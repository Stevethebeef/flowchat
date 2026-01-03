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
  icon: 'chat' | 'message' | 'help' | 'headphones' | 'sparkles' | 'n8chat' | 'custom';
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
  const sizeClass = `n8n-chat-bubble-trigger-${size}`;

  // Get icon component
  const IconComponent = getIconComponent(icon, customIconUrl);

  return (
    <button
      type="button"
      className={`
        n8n-chat-bubble-trigger
        ${sizeClass}
        ${isOpen ? 'n8n-chat-bubble-trigger-open' : ''}
        ${pulseAnimation ? 'n8n-chat-bubble-pulse' : ''}
      `.trim()}
      onClick={onClick}
      aria-label={isOpen ? 'Close chat' : 'Open chat'}
      aria-expanded={isOpen}
    >
      {/* Icon or close icon when open */}
      <span className="n8n-chat-bubble-icon">
        {isOpen ? <CloseIcon /> : IconComponent}
      </span>

      {/* Optional text */}
      {text && !isOpen && (
        <span className="n8n-chat-bubble-text">{text}</span>
      )}

      {/* Unread badge */}
      {showUnreadBadge && unreadCount > 0 && !isOpen && (
        <span className="n8n-chat-bubble-badge">
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
  icon: 'chat' | 'message' | 'help' | 'headphones' | 'sparkles' | 'n8chat' | 'custom',
  customIconUrl?: string
): React.ReactNode {
  switch (icon) {
    case 'message':
      return <MessageIcon />;
    case 'headphones':
      return <HeadphonesIcon />;
    case 'sparkles':
      return <SparklesIcon />;
    case 'n8chat':
      return <N8ChatBubbleIcon />;
    case 'help':
      return <HelpIcon />;
    case 'custom':
      return customIconUrl ? (
        <img src={customIconUrl} alt="" className="n8n-chat-bubble-custom-icon" />
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


const HeadphonesIcon: React.FC = () => (
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
    <path d="M3 18v-6a9 9 0 0118 0v6" />
    <path d="M21 19a2 2 0 01-2 2h-1a2 2 0 01-2-2v-3a2 2 0 012-2h3v5z" />
    <path d="M3 19a2 2 0 002 2h1a2 2 0 002-2v-3a2 2 0 00-2-2H3v5z" />
  </svg>
);

const SparklesIcon: React.FC = () => (
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
    <path d="M12 3l1.912 5.813a2 2 0 001.275 1.275L21 12l-5.813 1.912a2 2 0 00-1.275 1.275L12 21l-1.912-5.813a2 2 0 00-1.275-1.275L3 12l5.813-1.912a2 2 0 001.275-1.275L12 3z" />
    <path d="M5 3v4" />
    <path d="M3 5h4" />
    <path d="M19 17v4" />
    <path d="M17 19h4" />
  </svg>
);

const N8ChatBubbleIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 512 512"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect x="32" y="32" width="448" height="448" rx="80" fill="currentColor" />
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
);

export default BubbleTrigger;
