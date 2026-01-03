/**
 * ChatWidget Component
 *
 * Main chat widget component that integrates with @assistant-ui/react.
 */

import React, { useMemo, useState, useCallback } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useThreadRuntime,
} from '@assistant-ui/react';
import { N8nRuntimeAdapter } from '../../runtime/N8nRuntimeAdapter';
import { N8nChatProvider } from '../../context/N8nChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import type { ChatWidgetProps } from '../../types';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'error';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  webhookUrl,
  sessionId,
  config,
  context,
  apiUrl,
  isPreview = false,
  onClose,
}) => {
  // Connection status state
  const [connectionStatus, setConnectionStatus] = useState<ConnectionState>('connected');
  const [connectionMessage, setConnectionMessage] = useState<string | undefined>();

  // Handle connection retry
  const handleRetry = useCallback(() => {
    setConnectionStatus('connecting');
    setConnectionMessage('Retrying connection...');
    // The adapter will retry on next message send
    setTimeout(() => {
      setConnectionStatus('connected');
      setConnectionMessage(undefined);
    }, 1000);
  }, []);

  // Create adapter instance with proxy support for CORS bypass
  const adapter = useMemo(
    () =>
      new N8nRuntimeAdapter({
        webhookUrl,
        sessionId,
        context,
        // Use proxy endpoint to bypass CORS
        proxyUrl: apiUrl ? `${apiUrl}/proxy` : undefined,
        instanceId: config.instanceId,
        onError: (error) => {
          console.error('n8n Chat error:', error);
          // Update connection status on error
          if (error.message.includes('fetch') || error.message.includes('connect')) {
            setConnectionStatus('disconnected');
            setConnectionMessage('Connection lost');
          } else if (error.message.includes('timeout')) {
            setConnectionStatus('error');
            setConnectionMessage('Request timed out');
          } else {
            setConnectionStatus('error');
            setConnectionMessage(error.message);
          }
        },
      }),
    [webhookUrl, sessionId, context, apiUrl, config.instanceId]
  );

  // Create runtime
  const runtime = useLocalRuntime(adapter);

  // Generate CSS custom properties
  const style = useMemo(
    () =>
      ({
        '--n8n-chat-primary': config.primaryColor,
        '--n8n-chat-primary-foreground': '#ffffff',
        '--n8n-chat-background': config.theme === 'dark' ? '#1f2937' : '#ffffff',
        '--n8n-chat-foreground': config.theme === 'dark' ? '#f9fafb' : '#111827',
        '--n8n-chat-muted': config.theme === 'dark' ? '#374151' : '#f3f4f6',
        '--n8n-chat-muted-foreground': config.theme === 'dark' ? '#9ca3af' : '#6b7280',
        '--n8n-chat-border': config.theme === 'dark' ? '#374151' : '#e5e7eb',
      }) as React.CSSProperties,
    [config.primaryColor, config.theme]
  );

  // Theme class
  const themeClass =
    config.theme === 'auto'
      ? ''
      : config.theme === 'dark'
        ? 'n8n-chat-dark'
        : 'n8n-chat-light';

  return (
    <N8nChatProvider
      initialConfig={config}
      initialContext={context}
      initialWebhookUrl={webhookUrl}
      initialSessionId={sessionId}
      initialApiUrl={apiUrl}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <div
          className={`n8n-chat-widget ${themeClass}`}
          style={style}
          data-preview={isPreview}
        >
          {config.showHeader && (
            <ChatHeader title={config.chatTitle} onClose={onClose} />
          )}

          <ConnectionStatus
            state={connectionStatus}
            message={connectionMessage}
            onRetry={handleRetry}
          />

          <ChatMessages
            welcomeMessage={config.welcomeMessage}
            showTimestamp={config.showTimestamp}
            showAvatar={config.showAvatar}
            avatarUrl={config.avatarUrl}
          />

          <ChatInput
            placeholder={config.placeholderText}
            fileUpload={config.features.fileUpload}
            fileTypes={config.features.fileTypes}
            maxFileSize={config.features.maxFileSize}
          />

          {/* Suggested prompts */}
          {config.suggestedPrompts && config.suggestedPrompts.length > 0 && (
            <SuggestedPrompts prompts={config.suggestedPrompts} />
          )}
        </div>
      </AssistantRuntimeProvider>
    </N8nChatProvider>
  );
};

/**
 * Suggested prompts component
 */
interface SuggestedPromptsProps {
  prompts: string[];
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts }) => {
  const threadRuntime = useThreadRuntime();

  const handlePromptClick = (prompt: string) => {
    // Append the message to the thread and trigger submission
    threadRuntime.append({
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    });
  };

  return (
    <div className="n8n-chat-suggested-prompts">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          className="n8n-chat-suggested-prompt"
          type="button"
          onClick={() => handlePromptClick(prompt)}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

export default ChatWidget;
