/**
 * N8n Runtime Adapter
 *
 * Implements the ChatModelAdapter interface from @assistant-ui/react
 * to connect the chat widget directly to n8n webhooks.
 */

import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from '@assistant-ui/react';

interface N8nConfig {
  webhookUrl: string;
  sessionId: string;
  context: Record<string, unknown>;
  onError?: (error: Error) => void;
}

interface FormattedMessage {
  role: string;
  content: string;
}

interface SSEData {
  text?: string;
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  error?: string;
}

/**
 * Runtime adapter that connects @assistant-ui/react to n8n webhooks
 */
export class N8nRuntimeAdapter implements ChatModelAdapter {
  private config: N8nConfig;
  private abortController: AbortController | null = null;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  /**
   * Run the chat model - sends message to n8n and handles streaming response
   */
  async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: this.config.sessionId,
          messages: this.formatMessages(options.messages),
          context: this.config.context,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (contentType.includes('text/event-stream')) {
        // Handle SSE streaming
        yield* this.handleSSEResponse(response);
      } else if (contentType.includes('application/json')) {
        // Handle JSON response
        yield* this.handleJSONResponse(response);
      } else {
        // Handle plain text
        yield* this.handleTextResponse(response);
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        // Request was cancelled
        return;
      }

      this.config.onError?.(error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }

  /**
   * Handle Server-Sent Events streaming response
   */
  private async *handleSSEResponse(
    response: Response
  ): AsyncGenerator<ChatModelRunResult> {
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body');
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          // Skip empty lines and comments
          if (!line.trim() || line.startsWith(':')) continue;

          // Handle SSE data lines
          if (line.startsWith('data: ')) {
            const data = line.slice(6);

            // Check for stream end marker
            if (data === '[DONE]') {
              continue;
            }

            try {
              const parsed: SSEData = JSON.parse(data);

              // Handle error in stream
              if (parsed.error) {
                throw new Error(parsed.error);
              }

              // Handle text chunks
              if (parsed.text) {
                fullText += parsed.text;
                yield {
                  content: [{ type: 'text', text: fullText }],
                };
              }

              // Handle tool calls (if n8n sends them)
              if (parsed.tool_calls) {
                yield {
                  content: [{ type: 'text', text: fullText }],
                  // Note: tool calls would need to be converted to assistant-ui format
                };
              }
            } catch (parseError) {
              // If not valid JSON, treat as plain text chunk
              if (data.trim()) {
                fullText += data;
                yield {
                  content: [{ type: 'text', text: fullText }],
                };
              }
            }
          }
        }
      }

      // Process any remaining buffer
      if (buffer.trim() && buffer.startsWith('data: ')) {
        const data = buffer.slice(6);
        if (data !== '[DONE]' && data.trim()) {
          try {
            const parsed: SSEData = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
            }
          } catch {
            fullText += data;
          }
          yield {
            content: [{ type: 'text', text: fullText }],
          };
        }
      }
    } finally {
      reader.releaseLock();
    }
  }

  /**
   * Handle JSON response (non-streaming)
   */
  private async *handleJSONResponse(
    response: Response
  ): AsyncGenerator<ChatModelRunResult> {
    const data = await response.json();

    // Try to extract text from various common response formats
    const text =
      data.output ||
      data.text ||
      data.message ||
      data.response ||
      data.content ||
      (typeof data === 'string' ? data : JSON.stringify(data));

    yield {
      content: [{ type: 'text', text }],
    };
  }

  /**
   * Handle plain text response
   */
  private async *handleTextResponse(
    response: Response
  ): AsyncGenerator<ChatModelRunResult> {
    const text = await response.text();

    yield {
      content: [{ type: 'text', text }],
    };
  }

  /**
   * Cancel the current request
   */
  cancel(): void {
    this.abortController?.abort();
    this.abortController = null;
  }

  /**
   * Format messages for n8n
   */
  private formatMessages(
    messages: ChatModelRunOptions['messages']
  ): FormattedMessage[] {
    return messages.map((msg) => ({
      role: msg.role,
      content: msg.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text)
        .join(''),
    }));
  }

  /**
   * Update session ID (for reconnection scenarios)
   */
  updateSessionId(sessionId: string): void {
    this.config.sessionId = sessionId;
  }

  /**
   * Update context (for dynamic context changes)
   */
  updateContext(context: Record<string, unknown>): void {
    this.config.context = { ...this.config.context, ...context };
  }
}

/**
 * Create a new N8nRuntimeAdapter instance
 */
export function createN8nAdapter(config: N8nConfig): N8nRuntimeAdapter {
  return new N8nRuntimeAdapter(config);
}

export default N8nRuntimeAdapter;
