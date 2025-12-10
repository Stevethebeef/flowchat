/**
 * ChatWidget Component
 *
 * Main chat widget component that integrates with @assistant-ui/react.
 */

import React, { useMemo } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  useThreadRuntime,
} from '@assistant-ui/react';
import { N8nRuntimeAdapter } from '../../runtime/N8nRuntimeAdapter';
import { FlowChatProvider } from '../../context/FlowChatContext';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { ChatWidgetProps } from '../../types';

export const ChatWidget: React.FC<ChatWidgetProps> = ({
  webhookUrl,
  sessionId,
  config,
  context,
  isPreview = false,
  onClose,
}) => {
  // Create adapter instance
  const adapter = useMemo(
    () =>
      new N8nRuntimeAdapter({
        webhookUrl,
        sessionId,
        context,
        onError: (error) => {
          console.error('FlowChat error:', error);
        },
      }),
    [webhookUrl, sessionId, context]
  );

  // Create runtime
  const runtime = useLocalRuntime(adapter);

  // Generate CSS custom properties
  const style = useMemo(
    () =>
      ({
        '--flowchat-primary': config.primaryColor,
        '--flowchat-primary-foreground': '#ffffff',
        '--flowchat-background': config.theme === 'dark' ? '#1f2937' : '#ffffff',
        '--flowchat-foreground': config.theme === 'dark' ? '#f9fafb' : '#111827',
        '--flowchat-muted': config.theme === 'dark' ? '#374151' : '#f3f4f6',
        '--flowchat-muted-foreground': config.theme === 'dark' ? '#9ca3af' : '#6b7280',
        '--flowchat-border': config.theme === 'dark' ? '#374151' : '#e5e7eb',
      }) as React.CSSProperties,
    [config.primaryColor, config.theme]
  );

  // Theme class
  const themeClass =
    config.theme === 'auto'
      ? ''
      : config.theme === 'dark'
        ? 'flowchat-dark'
        : 'flowchat-light';

  return (
    <FlowChatProvider
      initialConfig={config}
      initialContext={context}
      initialWebhookUrl={webhookUrl}
      initialSessionId={sessionId}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <div
          className={`flowchat-widget ${themeClass}`}
          style={style}
          data-preview={isPreview}
        >
          {config.showHeader && (
            <ChatHeader title={config.chatTitle} onClose={onClose} />
          )}

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
    </FlowChatProvider>
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
    <div className="flowchat-suggested-prompts">
      {prompts.map((prompt, index) => (
        <button
          key={index}
          className="flowchat-suggested-prompt"
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
