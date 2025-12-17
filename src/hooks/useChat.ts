/**
 * useChat Hook
 *
 * Custom hook for managing chat state and interactions.
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatMessage, N8nChatConfig, ChatContext, UploadResponse } from '../types';

interface UseChatOptions {
  webhookUrl: string;
  sessionId: string;
  config: N8nChatConfig;
  context: ChatContext;
  apiUrl: string;
  nonce: string;
  onError?: (error: Error) => void;
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string, attachments?: File[]) => Promise<void>;
  clearMessages: () => void;
  retryLastMessage: () => Promise<void>;
}

export function useChat({
  webhookUrl,
  sessionId,
  config,
  context,
  apiUrl,
  nonce,
  onError,
  onMessageSent,
  onMessageReceived,
}: UseChatOptions): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastMessageRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Generate unique message ID
  const generateMessageId = useCallback(() => {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  // Upload file
  const uploadFile = useCallback(
    async (file: File): Promise<UploadResponse> => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('instance_id', config.instanceId);

      const response = await fetch(`${apiUrl}/upload`, {
        method: 'POST',
        headers: {
          'X-WP-Nonce': nonce,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Upload failed');
      }

      return response.json();
    },
    [apiUrl, nonce, config.instanceId]
  );

  // Send message
  const sendMessage = useCallback(
    async (content: string, attachments: File[] = []) => {
      if (!content.trim() && attachments.length === 0) return;

      setError(null);
      setIsLoading(true);
      lastMessageRef.current = content;

      // Cancel any pending request
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      try {
        // Upload attachments first
        const uploadedFiles: UploadResponse[] = [];
        for (const file of attachments) {
          const uploaded = await uploadFile(file);
          uploadedFiles.push(uploaded);
        }

        // Create user message
        const userMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'user',
          content: {
            parts: [
              { type: 'text', text: content },
              ...uploadedFiles.map((f) => ({
                type: f.mimeType.startsWith('image/') ? ('image' as const) : ('file' as const),
                url: f.url,
                filename: f.filename,
                mimeType: f.mimeType,
              })),
            ],
          },
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, userMessage]);
        onMessageSent?.(userMessage);

        // Create placeholder for assistant response
        const assistantMessageId = generateMessageId();
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: { parts: [{ type: 'text', text: '' }] },
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantMessage]);

        // Send to n8n
        const response = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'text/event-stream',
          },
          body: JSON.stringify({
            action: 'sendMessage',
            sessionId,
            messages: messages
              .concat(userMessage)
              .filter((m) => m.role !== 'system')
              .map((m) => ({
                role: m.role,
                content: m.content.parts
                  .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
                  .map((p) => p.text)
                  .join(''),
              })),
            context,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const contentType = response.headers.get('content-type') || '';

        if (contentType.includes('text/event-stream')) {
          // Handle streaming response
          const reader = response.body?.getReader();
          if (!reader) throw new Error('No response body');

          const decoder = new TextDecoder();
          let buffer = '';
          let fullText = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const data = line.slice(6);
              if (data === '[DONE]') continue;

              try {
                const parsed = JSON.parse(data);
                if (parsed.text) {
                  fullText += parsed.text;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: { parts: [{ type: 'text', text: fullText }] },
                          }
                        : m
                    )
                  );
                }
              } catch {
                if (data.trim()) {
                  fullText += data;
                  setMessages((prev) =>
                    prev.map((m) =>
                      m.id === assistantMessageId
                        ? {
                            ...m,
                            content: { parts: [{ type: 'text', text: fullText }] },
                          }
                        : m
                    )
                  );
                }
              }
            }
          }
        } else {
          // Handle JSON response
          const data = await response.json();
          const text = data.output || data.text || data.message || JSON.stringify(data);

          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMessageId
                ? {
                    ...m,
                    content: { parts: [{ type: 'text', text }] },
                  }
                : m
            )
          );
        }

        // Get final message and notify
        const finalMessage = messages.find((m) => m.id === assistantMessageId);
        if (finalMessage) {
          onMessageReceived?.(finalMessage);
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage = err instanceof Error ? err.message : 'An error occurred';
        setError(errorMessage);
        onError?.(err instanceof Error ? err : new Error(errorMessage));

        // Remove the empty assistant message on error
        setMessages((prev) => prev.filter((m) => m.content.parts[0]?.type !== 'text' || (m.content.parts[0] as { text: string }).text !== ''));
      } finally {
        setIsLoading(false);
      }
    },
    [
      webhookUrl,
      sessionId,
      messages,
      context,
      generateMessageId,
      uploadFile,
      onMessageSent,
      onMessageReceived,
      onError,
    ]
  );

  // Clear messages
  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  // Retry last message
  const retryLastMessage = useCallback(async () => {
    if (!lastMessageRef.current) return;

    // Remove the last user message and failed assistant response
    setMessages((prev) => {
      const lastUserIndex = prev.map((m) => m.role).lastIndexOf('user');
      if (lastUserIndex === -1) return prev;
      return prev.slice(0, lastUserIndex);
    });

    await sendMessage(lastMessageRef.current);
  }, [sendMessage]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    retryLastMessage,
  };
}

export default useChat;
