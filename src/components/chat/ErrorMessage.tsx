/**
 * Error Message Component for FlowChat
 *
 * Displays user-friendly error messages with recovery actions.
 */

import React from 'react';
import { FlowChatError, formatErrorForDisplay } from '../../errors';

interface ErrorMessageProps {
  error: FlowChatError;
  onRetry?: () => void;
  onRefresh?: () => void;
  onDismiss?: () => void;
  className?: string;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onRefresh,
  onDismiss,
  className = '',
}) => {
  const display = formatErrorForDisplay(error);

  return (
    <div className={`flowchat-error-message ${className}`} role="alert">
      <div className="flowchat-error-message__icon">
        <ErrorIcon category={error.category} />
      </div>

      <div className="flowchat-error-message__content">
        <h4 className="flowchat-error-message__title">{display.title}</h4>
        <p className="flowchat-error-message__text">{display.message}</p>

        <div className="flowchat-error-message__actions">
          {display.showRetry && onRetry && (
            <button
              className="flowchat-error-message__button flowchat-error-message__button--primary"
              onClick={onRetry}
              type="button"
            >
              <RetryIcon />
              Try Again
            </button>
          )}

          {display.showRefresh && onRefresh && (
            <button
              className="flowchat-error-message__button flowchat-error-message__button--secondary"
              onClick={onRefresh}
              type="button"
            >
              <RefreshIcon />
              Refresh
            </button>
          )}

          {display.showLogin && (
            <a
              href={getLoginUrl()}
              className="flowchat-error-message__button flowchat-error-message__button--primary"
            >
              <LoginIcon />
              Log In
            </a>
          )}

          {onDismiss && (
            <button
              className="flowchat-error-message__button flowchat-error-message__button--text"
              onClick={onDismiss}
              type="button"
            >
              Dismiss
            </button>
          )}
        </div>
      </div>

      {onDismiss && (
        <button
          className="flowchat-error-message__close"
          onClick={onDismiss}
          type="button"
          aria-label="Dismiss error"
        >
          <CloseIcon />
        </button>
      )}
    </div>
  );
};

// Error icon based on category
const ErrorIcon: React.FC<{ category: string }> = ({ category }) => {
  switch (category) {
    case 'connection':
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0 1 19 12.55M5 12.55a10.94 10.94 0 0 1 5.17-2.39M10.71 5.05A16 16 0 0 1 22.58 9M1.42 9a16 16 0 0 1 6.88-3.78M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
      );
    case 'authentication':
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      );
    case 'rate_limit':
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
    default:
      return (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      );
  }
};

const RetryIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);

const RefreshIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>
);

const LoginIcon: React.FC = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
    <polyline points="10 17 15 12 10 7" />
    <line x1="15" y1="12" x2="3" y2="12" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function getLoginUrl(): string {
  // Get WordPress login URL from global or default
  if (typeof window !== 'undefined' && (window as unknown as { flowchatConfig?: { loginUrl?: string } }).flowchatConfig?.loginUrl) {
    return (window as unknown as { flowchatConfig: { loginUrl: string } }).flowchatConfig.loginUrl;
  }
  return '/wp-login.php';
}

export default ErrorMessage;
