/**
 * ChatMessage Component
 *
 * Individual message display component.
 */

import React from 'react';
import { MessagePrimitive, useMessage } from '@assistant-ui/react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({
  role,
  showTimestamp,
  showAvatar,
  avatarUrl,
}) => {
  const isUser = role === 'user';

  return (
    <MessagePrimitive.Root
      className={`n8n-chat-message n8n-chat-message-${role}`}
    >
      <div className="n8n-chat-message-wrapper">
        {/* Avatar */}
        {showAvatar && (
          <div className="n8n-chat-message-avatar">
            {isUser ? (
              <UserAvatar />
            ) : (
              <AssistantAvatar url={avatarUrl} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="n8n-chat-message-content">
          <MessagePrimitive.Content
            components={{
              Text: ({ text }) => <MessageText text={text} />,
              Image: ({ image }) => <MessageImage image={image} />,
            }}
          />

          {/* Timestamp */}
          {showTimestamp && (
            <div className="n8n-chat-message-timestamp">
              <MessageTimestamp />
            </div>
          )}
        </div>
      </div>

      {/* Actions for assistant messages */}
      {!isUser && (
        <div className="n8n-chat-message-actions">
          <CopyButton />
        </div>
      )}
    </MessagePrimitive.Root>
  );
};

/**
 * User avatar
 */
const UserAvatar: React.FC = () => (
  <div className="n8n-chat-avatar n8n-chat-avatar-user">
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path d="M10 10a4 4 0 100-8 4 4 0 000 8zM3 18a7 7 0 1114 0H3z" />
    </svg>
  </div>
);

/**
 * Assistant avatar
 */
interface AssistantAvatarProps {
  url?: string;
}

const AssistantAvatar: React.FC<AssistantAvatarProps> = ({ url }) => {
  if (url) {
    return (
      <div className="n8n-chat-avatar n8n-chat-avatar-assistant">
        <img src={url} alt="Assistant" />
      </div>
    );
  }

  // Default to N8.Chat branded icon - orange rounded box with "N8" text
  return (
    <div className="n8n-chat-avatar n8n-chat-avatar-assistant n8n-chat-avatar-n8">
      <svg
        width="20"
        height="20"
        viewBox="0 0 512 512"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="32" y="32" width="448" height="448" rx="80" fill="#FF6B2C" />
        <text
          x="256"
          y="310"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontSize="200"
          fontWeight="700"
          fill="white"
          textAnchor="middle"
        >
          N8
        </text>
      </svg>
    </div>
  );
};

/**
 * Message text content
 */
interface MessageTextProps {
  text: string;
}

const MessageText: React.FC<MessageTextProps> = ({ text }) => {
  // Simple markdown-like rendering
  // In production, you'd want to use a proper markdown renderer
  return (
    <div className="n8n-chat-message-text">
      {text.split('\n').map((line, i) => (
        <p key={i}>{line || '\u00A0'}</p>
      ))}
    </div>
  );
};

/**
 * Message image content
 */
interface MessageImageProps {
  image: string;
}

const MessageImage: React.FC<MessageImageProps> = ({ image }) => {
  return (
    <div className="n8n-chat-message-image">
      <img src={image} alt="Attached" loading="lazy" />
    </div>
  );
};

/**
 * Message timestamp
 */
const MessageTimestamp: React.FC = () => {
  const message = useMessage();
  // Use message createdAt if available, otherwise fallback to current time
  const timestamp = message.createdAt ? new Date(message.createdAt) : new Date();
  const time = timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return <span>{time}</span>;
};

/**
 * Copy button - uses useMessage hook to get correct message content
 */
const CopyButton: React.FC = () => {
  const message = useMessage();

  const handleCopy = () => {
    // Extract text content from the message content array
    const textContent = message.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map((c) => c.text)
      .join('\n');

    navigator.clipboard.writeText(textContent);
  };

  return (
    <button
      className="n8n-chat-copy-button"
      onClick={handleCopy}
      title="Copy message"
      type="button"
    >
      <CopyIcon />
    </button>
  );
};

// Icons
const CopyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="8" height="8" rx="1" />
    <path d="M2 10V3a1 1 0 011-1h7" />
  </svg>
);

export default ChatMessage;
