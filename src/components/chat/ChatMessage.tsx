/**
 * ChatMessage Component
 *
 * Individual message display component.
 */

import React from 'react';
import { MessagePrimitive } from '@assistant-ui/react';

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
      className={`flowchat-message flowchat-message-${role}`}
    >
      <div className="flowchat-message-wrapper">
        {/* Avatar */}
        {showAvatar && (
          <div className="flowchat-message-avatar">
            {isUser ? (
              <UserAvatar />
            ) : (
              <AssistantAvatar url={avatarUrl} />
            )}
          </div>
        )}

        {/* Content */}
        <div className="flowchat-message-content">
          <MessagePrimitive.Content
            components={{
              Text: ({ text }) => <MessageText text={text} />,
              Image: ({ image }) => <MessageImage image={image} />,
            }}
          />

          {/* Timestamp */}
          {showTimestamp && (
            <div className="flowchat-message-timestamp">
              <MessageTimestamp />
            </div>
          )}
        </div>
      </div>

      {/* Actions for assistant messages */}
      {!isUser && (
        <div className="flowchat-message-actions">
          <MessagePrimitive.If hasBranches>
            <BranchNav />
          </MessagePrimitive.If>
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
  <div className="flowchat-avatar flowchat-avatar-user">
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
      <div className="flowchat-avatar flowchat-avatar-assistant">
        <img src={url} alt="Assistant" />
      </div>
    );
  }

  return (
    <div className="flowchat-avatar flowchat-avatar-assistant">
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="currentColor"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zm-1-9a1 1 0 112 0v4a1 1 0 11-2 0V9zm1-4a1 1 0 100 2 1 1 0 000-2z"
          clipRule="evenodd"
        />
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
    <div className="flowchat-message-text">
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
    <div className="flowchat-message-image">
      <img src={image} alt="Attached" loading="lazy" />
    </div>
  );
};

/**
 * Message timestamp
 */
const MessageTimestamp: React.FC = () => {
  // Note: @assistant-ui/react doesn't provide timestamp out of the box
  // This would need to be implemented based on your message structure
  const now = new Date();
  const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return <span>{time}</span>;
};

/**
 * Branch navigation for message alternatives
 */
const BranchNav: React.FC = () => {
  return (
    <div className="flowchat-branch-nav">
      <MessagePrimitive.BranchPicker.Previous className="flowchat-branch-button">
        <ChevronLeftIcon />
      </MessagePrimitive.BranchPicker.Previous>

      <span className="flowchat-branch-count">
        <MessagePrimitive.BranchPicker.Number /> /{' '}
        <MessagePrimitive.BranchPicker.Count />
      </span>

      <MessagePrimitive.BranchPicker.Next className="flowchat-branch-button">
        <ChevronRightIcon />
      </MessagePrimitive.BranchPicker.Next>
    </div>
  );
};

/**
 * Copy button
 */
const CopyButton: React.FC = () => {
  return (
    <MessagePrimitive.ActionBar.Copy className="flowchat-copy-button">
      <CopyIcon />
    </MessagePrimitive.ActionBar.Copy>
  );
};

// Icons
const ChevronLeftIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="8 10 4 6 8 2" />
  </svg>
);

const ChevronRightIcon: React.FC = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="4 2 8 6 4 10" />
  </svg>
);

const CopyIcon: React.FC = () => (
  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="4" y="4" width="8" height="8" rx="1" />
    <path d="M2 10V3a1 1 0 011-1h7" />
  </svg>
);

export default ChatMessage;
