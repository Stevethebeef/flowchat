/**
 * ChatMessages Component
 *
 * Displays the list of chat messages using @assistant-ui/react primitives.
 */

import React from 'react';
import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
} from '@assistant-ui/react';
import { ChatMessage } from './ChatMessage';
import { TypingIndicator } from './TypingIndicator';
import type { ChatMessagesProps } from '../../types';

export const ChatMessages: React.FC<ChatMessagesProps> = ({
  welcomeMessage,
  showTimestamp,
  showAvatar,
  avatarUrl,
}) => {
  return (
    <ThreadPrimitive.Root className="n8n-chat-messages">
      <ThreadPrimitive.Viewport className="n8n-chat-messages-viewport">
        {/* Welcome message */}
        {welcomeMessage && (
          <ThreadPrimitive.Empty>
            <WelcomeMessage message={welcomeMessage} />
          </ThreadPrimitive.Empty>
        )}

        {/* Messages list */}
        <ThreadPrimitive.Messages
          components={{
            UserMessage: (props) => (
              <ChatMessage
                {...props}
                role="user"
                showTimestamp={showTimestamp}
                showAvatar={showAvatar}
              />
            ),
            AssistantMessage: (props) => (
              <ChatMessage
                {...props}
                role="assistant"
                showTimestamp={showTimestamp}
                showAvatar={showAvatar}
                avatarUrl={avatarUrl}
              />
            ),
          }}
        />

        {/* Typing indicator */}
        <ThreadPrimitive.If running>
          <TypingIndicator />
        </ThreadPrimitive.If>
      </ThreadPrimitive.Viewport>

      {/* Scroll to bottom button */}
      <ThreadPrimitive.ScrollToBottom className="n8n-chat-scroll-to-bottom">
        <ScrollDownIcon />
      </ThreadPrimitive.ScrollToBottom>
    </ThreadPrimitive.Root>
  );
};

/**
 * Welcome message component
 */
interface WelcomeMessageProps {
  message: string;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({ message }) => {
  return (
    <div className="n8n-chat-welcome">
      <div className="n8n-chat-welcome-content">
        <p>{message}</p>
      </div>
    </div>
  );
};

/**
 * Scroll down icon
 */
const ScrollDownIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="4 6 8 10 12 6" />
  </svg>
);

export default ChatMessages;
