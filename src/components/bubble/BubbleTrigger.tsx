/**
 * BubbleTrigger Component
 *
 * The floating button that toggles the chat panel.
 */

import React from 'react';

interface BubbleTriggerProps {
  isOpen: boolean;
  onClick: () => void;
  unreadCount: number;
  icon: 'chat' | 'message' | 'help' | 'custom';
  customIconUrl?: string;
  text?: string;
  size: 'small' | 'medium' | 'large';
  showUnreadBadge: boolean;
  pulseAnimation: boolean;
}

export const BubbleTrigger: React.FC<BubbleTriggerProps> = ({
  isOpen,
  onClick,
  unreadCount,
  icon,
  customIconUrl,
  text,
  size,
  showUnreadBadge,
  pulseAnimation,
}) => {
  // Size classes
  const sizeClass = `flowchat-bubble-trigger-${size}`;

  // Get icon component
  const IconComponent = getIconComponent(icon, customIconUrl);

  return (
    <button
      type="button"
      className={`
        flowchat-bubble-trigger
        ${sizeClass}
        ${isOpen ? 'flowchat-bubble-trigger-open' : ''}
        ${pulseAnimation ? 'flowchat-bubble-pulse' : ''}
      `.trim()}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
    >
      {/* Icon or close icon when open */}
      <span className="flowchat-bubble-icon">
        {isOpen ? <CloseIcon /> : IconComponent}
      </span>

      {/* Optional text */}
      {text && !isOpen && (
        <span className="flowchat-bubble-text">{text}</span>
      )}

      {/* Unread badge */}
      {showUnreadBadge && unreadCount > 0 && !isOpen && (
        <span className="flowchat-bubble-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};

/**
 * Get icon component based on type
 */
function getIconComponent(
  icon: 'chat' | 'message' | 'help' | 'custom',
  customIconUrl?: string
): React.ReactNode {
  switch (icon) {
    case 'message':
      return <MessageIcon />;
    case 'help':
      return <HelpIcon />;
    case 'custom':
      return customIconUrl ? (
        <img src={customIconUrl} alt="" className="flowchat-bubble-custom-icon" />
      ) : (
        <ChatIcon />
      );
    case 'chat':
    default:
      return <ChatIcon />;
  }
}

// Icons
const ChatIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
  </svg>
);

const MessageIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
);

const HelpIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

export default BubbleTrigger;
