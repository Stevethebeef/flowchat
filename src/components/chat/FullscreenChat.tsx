/**
 * FullscreenChat Component
 *
 * Full-page dedicated chat experience.
 * Per 00-overview.md: "Fullscreen Mode: Dedicated chat page experience"
 */

import React, { useEffect, useState } from 'react';
import { ChatWidget } from './ChatWidget';
import type { FlowChatConfig } from '../../types';

export interface FullscreenChatProps {
  /** Instance configuration */
  config: FlowChatConfig;
  /** Webhook URL for n8n */
  webhookUrl: string;
  /** Session ID */
  sessionId: string;
  /** WordPress context */
  wpContext?: Record<string, unknown>;
  /** Whether to show exit button */
  showExitButton?: boolean;
  /** Exit button callback */
  onExit?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Fullscreen chat wrapper component
 */
export function FullscreenChat({
  config,
  webhookUrl,
  sessionId,
  wpContext,
  showExitButton = true,
  onExit,
  className = '',
}: FullscreenChatProps) {
  const [isExiting, setIsExiting] = useState(false);

  // Lock body scroll when mounted
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showExitButton && onExit) {
        handleExit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showExitButton, onExit]);

  const handleExit = () => {
    setIsExiting(true);
    setTimeout(() => {
      onExit?.();
    }, 300); // Match animation duration
  };

  const containerClasses = [
    'flowchat-fullscreen',
    isExiting ? 'flowchat-fullscreen-exiting' : '',
    config.appearance?.theme === 'dark' ? 'flowchat-fullscreen-dark' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClasses} role="dialog" aria-modal="true" aria-label="Chat">
      {/* Background overlay */}
      <div className="flowchat-fullscreen-backdrop" />

      {/* Exit button */}
      {showExitButton && onExit && (
        <button
          type="button"
          className="flowchat-fullscreen-exit"
          onClick={handleExit}
          aria-label="Exit fullscreen chat"
        >
          <svg
            viewBox="0 0 24 24"
            width="24"
            height="24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}

      {/* Chat container */}
      <div className="flowchat-fullscreen-container">
        {/* Header with branding */}
        <div className="flowchat-fullscreen-header">
          {config.appearance?.avatarUrl && (
            <img
              src={config.appearance.avatarUrl}
              alt=""
              className="flowchat-fullscreen-avatar"
            />
          )}
          <div className="flowchat-fullscreen-title">
            <h1>{config.messages?.title || 'Chat'}</h1>
            {config.messages?.subtitle && (
              <p>{config.messages.subtitle}</p>
            )}
          </div>
        </div>

        {/* Chat widget */}
        <div className="flowchat-fullscreen-chat">
          <ChatWidget
            config={{
              ...config,
              display: {
                ...config.display,
                mode: 'inline' as const,
              },
            }}
            webhookUrl={webhookUrl}
            sessionId={sessionId}
            wpContext={wpContext}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Hook to manage fullscreen mode state
 */
export function useFullscreenChat() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const enterFullscreen = () => setIsFullscreen(true);
  const exitFullscreen = () => setIsFullscreen(false);
  const toggleFullscreen = () => setIsFullscreen((prev) => !prev);

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    toggleFullscreen,
  };
}

export default FullscreenChat;
