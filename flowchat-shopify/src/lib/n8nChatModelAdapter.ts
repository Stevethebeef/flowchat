/**
 * n8n ChatModelAdapter for Assistant UI
 * Connects Assistant UI LocalRuntime to n8n webhook endpoints
 */

import type { ChatModelAdapter, ChatModelRunOptions } from '@assistant-ui/react';
import type { FlowChatContext } from '@/types';

export interface N8nAdapterConfig {
  webhookUrl: string;
  sessionId: string;
  context: FlowChatContext;
  onContextRefresh?: () => Promise<FlowChatContext>;
}

/**
 * Creates a ChatModelAdapter that communicates with n8n webhooks
 * Supports both streaming (SSE) and non-streaming responses
 */
export function createN8nChatModelAdapter(config: N8nAdapterConfig): ChatModelAdapter {
  const { webhookUrl, sessionId, context, onContextRefresh } = config;

  return {
    async *run({ messages, abortSignal }: ChatModelRunOptions) {
      // Get fresh context if callback provided (e.g., for fresh cart data)
      const currentContext = onContextRefresh ? await onContextRefresh() : context;

      // Convert Assistant UI messages to n8n format
      const lastMessage = messages[messages.length - 1];
      const chatInput = lastMessage?.content
        .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
        .map((part) => part.text)
        .join('\n') || '';

      // Build n8n request payload
      const payload = {
        action: 'sendMessage',
        sessionId,
        chatInput,
        context: {
          ...currentContext,
          timestamp: new Date().toISOString(),
        },
        // Include message history for context
        messageHistory: messages.slice(0, -1).map((msg) => ({
          role: msg.role,
          content: msg.content
            .filter((part): part is { type: 'text'; text: string } => part.type === 'text')
            .map((part) => part.text)
            .join('\n'),
        })),
      };

      try {
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'text/event-stream, application/json',
          },
          body: JSON.stringify(payload),
          signal: abortSignal,
        });

        if (!response.ok) {
          throw new Error(`n8n webhook error: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('Content-Type') || '';

        // Handle SSE streaming response
        if (contentType.includes('text/event-stream')) {
          yield* handleStreamingResponse(response, abortSignal);
        } else {
          // Handle JSON response
          const data = await response.json();
          const text = data.output || data.response || data.text || '';

          yield {
            content: [{ type: 'text', text }],
          };
        }
      } catch (error) {
        // Re-throw abort errors silently
        if (error instanceof Error && error.name === 'AbortError') {
          throw error;
        }

        // Wrap other errors with helpful message
        throw new Error(
          error instanceof Error
            ? `Failed to communicate with AI: ${error.message}`
            : 'Failed to communicate with AI. Please try again.'
        );
      }
    },
  };
}

/**
 * Handles SSE streaming response from n8n
 */
async function* handleStreamingResponse(
  response: Response,
  abortSignal?: AbortSignal
): AsyncGenerator<{ content: Array<{ type: 'text'; text: string }> }> {
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('Failed to get response reader');
  }

  const decoder = new TextDecoder();
  let accumulatedText = '';
  let buffer = '';

  try {
    while (true) {
      // Check for abort
      if (abortSignal?.aborted) {
        break;
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Keep the last incomplete line in buffer
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();

          if (data === '[DONE]') {
            // Streaming complete
            return;
          }

          try {
            const parsed = JSON.parse(data);

            // n8n sends accumulated output in each chunk
            if (parsed.output !== undefined) {
              accumulatedText = parsed.output;
            } else if (parsed.text !== undefined) {
              accumulatedText = parsed.text;
            } else if (parsed.delta !== undefined) {
              // Some n8n setups send deltas
              accumulatedText += parsed.delta;
            }

            yield {
              content: [{ type: 'text', text: accumulatedText }],
            };
          } catch {
            // Ignore JSON parse errors for malformed chunks
          }
        }
      }
    }

    // Process any remaining buffer
    if (buffer.startsWith('data: ')) {
      const data = buffer.slice(6).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          if (parsed.output) {
            yield {
              content: [{ type: 'text', text: parsed.output }],
            };
          }
        } catch {
          // Ignore
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Fetches previous session messages from n8n
 */
export async function loadPreviousSession(
  webhookUrl: string,
  sessionId: string,
  context: FlowChatContext
): Promise<Array<{ role: 'user' | 'assistant'; content: string }>> {
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'loadPreviousSession',
        sessionId,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
        },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = await response.json();

    if (data.messages && Array.isArray(data.messages)) {
      return data.messages.map((msg: { role: string; content: string }) => ({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      }));
    }

    return [];
  } catch {
    // Silently fail - previous session loading is optional
    return [];
  }
}
