/**
 * ChatHeader Component
 *
 * Header section of the chat widget with title and action buttons.
 */

import React from 'react';
import type { ChatHeaderProps } from '../../types';

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  title,
  onClose,
  onMinimize,
}) => {
  return (
    <header className="flowchat-header">
      <div className="flowchat-header-content">
        <h2 className="flowchat-header-title">{title}</h2>
      </div>

      <div className="flowchat-header-actions">
        {onMinimize && (
          <button
            type="button"
            className="flowchat-header-button flowchat-minimize-button"
            onClick={onMinimize}
            aria-label="Minimize chat"
          >
            <MinimizeIcon />
          </button>
        )}

        {onClose && (
          <button
            type="button"
            className="flowchat-header-button flowchat-close-button"
            onClick={onClose}
            aria-label="Close chat"
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </header>
  );
};

/**
 * Minimize icon
 */
const MinimizeIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="8" x2="13" y2="8" />
  </svg>
);

/**
 * Close icon
 */
const CloseIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
  >
    <line x1="3" y1="3" x2="13" y2="13" />
    <line x1="13" y1="3" x2="3" y2="13" />
  </svg>
);

export default ChatHeader;
