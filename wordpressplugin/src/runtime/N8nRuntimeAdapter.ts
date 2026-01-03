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

/**
 * Custom error messages configuration
 */
interface ErrorMessages {
  connection?: string;
  timeout?: string;
  rateLimit?: string;
  generic?: string;
}

interface N8nConfig {
  webhookUrl: string;
  sessionId: string;
  context: Record<string, unknown>;
  onError?: (error: Error) => void;
  // Proxy configuration (for CORS bypass)
  proxyUrl?: string;
  instanceId?: string;
  // Enable streaming via proxy
  streaming?: boolean;
  // Custom key names for n8n Chat Trigger compatibility
  chatInputKey?: string;
  sessionKey?: string;
  // Custom error messages
  errorMessages?: ErrorMessages;
}

interface FileAttachment {
  type: 'image' | 'file';
  url: string;
  filename: string;
  mimeType: string;
}

interface FormattedMessage {
  role: string;
  content: string;
  attachments?: FileAttachment[];
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
   * Get custom error message based on error type
   */
  private getErrorMessage(error: Error, statusCode?: number): string {
    const errorMessages = this.config.errorMessages || {};

    // Check for rate limit error
    if (statusCode === 429) {
      return errorMessages.rateLimit || 'Rate limit exceeded. Please wait a moment before trying again.';
    }

    // Check for timeout error
    if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
      return errorMessages.timeout || 'Request timed out. Please try again.';
    }

    // Check for connection error
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      return errorMessages.connection || 'Unable to connect. Please check your connection and try again.';
    }

    // Generic error message
    return errorMessages.generic || error.message || 'An error occurred. Please try again.';
  }

  /**
   * Run the chat model - sends message to n8n and handles streaming response
   */
  async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    // Determine which URL to use (proxy or direct webhook)
    const useProxy = this.config.proxyUrl && this.config.instanceId;
    // Streaming is enabled by default, can be disabled via config
    const useStreaming = this.config.streaming !== false && useProxy;

    // Use streaming proxy endpoint if streaming is enabled
    let targetUrl: string;
    if (useProxy) {
      const baseUrl = this.config.proxyUrl!.replace(/\/proxy$/, '');
      targetUrl = useStreaming ? `${baseUrl}/stream-proxy` : this.config.proxyUrl!;
    } else {
      targetUrl = this.config.webhookUrl;
    }

    // Validate URL before attempting to fetch
    if (!targetUrl || targetUrl.trim() === '') {
      const error = new Error('Webhook URL is not configured. Please configure the webhook URL in the chat instance settings.');
      this.config.onError?.(error);
      throw error;
    }

    this.abortController = new AbortController();

    // Build request body
    // n8n Chat Trigger expects 'chatInput' as a string, not 'messages' array
    const lastUserMessage = options.messages
      .filter((m) => m.role === 'user')
      .pop();
    const chatInput = lastUserMessage?.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('') || '';

    // Extract file attachments from the last user message
    const attachments: FileAttachment[] = lastUserMessage?.content
      .filter(
        (c): c is { type: 'image' | 'file'; url: string; filename?: string; mimeType?: string } =>
          c.type === 'image' || c.type === 'file'
      )
      .map((c) => ({
        type: c.type as 'image' | 'file',
        url: (c as { url: string }).url,
        filename: (c as { filename?: string }).filename || 'attachment',
        mimeType: (c as { mimeType?: string }).mimeType || 'application/octet-stream',
      })) || [];

    // Use custom key names or defaults
    const chatInputKey = this.config.chatInputKey || 'chatInput';
    const sessionKey = this.config.sessionKey || 'sessionId';

    // Build request body with dynamic keys
    const requestBody: Record<string, unknown> = {
      action: 'sendMessage',
      [sessionKey]: this.config.sessionId,
      [chatInputKey]: chatInput,
      context: this.config.context,
    };

    // Include attachments if any files were uploaded
    if (attachments.length > 0) {
      requestBody.attachments = attachments;
    }

    // Add instance_id when using proxy
    if (useProxy) {
      requestBody.instance_id = this.config.instanceId;
    }

    try {
      const response = await fetch(targetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Request SSE when streaming is enabled (either direct or via streaming proxy)
          'Accept': useStreaming || !useProxy ? 'text/event-stream' : 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        const error = new Error(`HTTP ${response.status}: ${errorText}`);
        const customMessage = this.getErrorMessage(error, response.status);
        const customError = new Error(customMessage);
        this.config.onError?.(customError);
        throw customError;
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

      // Use custom error message if available
      const customMessage = this.getErrorMessage(error instanceof Error ? error : new Error(String(error)));
      const customError = new Error(customMessage);
      this.config.onError?.(customError);
      throw customError;
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
    return messages.map((msg) => {
      // Extract text content
      const textParts = msg.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map((c) => c.text);

      // Extract file attachments (images and files)
      const attachments: FileAttachment[] = msg.content
        .filter(
          (c): c is { type: 'image' | 'file'; url: string; filename?: string; mimeType?: string } =>
            c.type === 'image' || c.type === 'file'
        )
        .map((c) => ({
          type: c.type as 'image' | 'file',
          url: (c as { url: string }).url,
          filename: (c as { filename?: string }).filename || 'attachment',
          mimeType: (c as { mimeType?: string }).mimeType || 'application/octet-stream',
        }));

      const message: FormattedMessage = {
        role: msg.role,
        content: textParts.join(''),
      };

      // Only include attachments if there are any
      if (attachments.length > 0) {
        message.attachments = attachments;
      }

      return message;
    });
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
