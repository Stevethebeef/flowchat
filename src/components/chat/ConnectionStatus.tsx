/**
 * Connection Status Component for FlowChat
 *
 * Displays the current connection status and reconnection state.
 */

import React from 'react';

type ConnectionState = 'connected' | 'connecting' | 'disconnected' | 'reconnecting' | 'error';

interface ConnectionStatusProps {
  state: ConnectionState;
  message?: string;
  onRetry?: () => void;
  showAlways?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  state,
  message,
  onRetry,
  showAlways = false,
  className = '',
}) => {
  // Don't show when connected unless showAlways is true
  if (state === 'connected' && !showAlways) {
    return null;
  }

  const statusConfig = getStatusConfig(state);

  return (
    <div
      className={`flowchat-connection-status flowchat-connection-status--${state} ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flowchat-connection-status__indicator">
        {statusConfig.icon}
      </div>
      <span className="flowchat-connection-status__text">
        {message || statusConfig.message}
      </span>
      {state === 'error' && onRetry && (
        <button
          className="flowchat-connection-status__retry"
          onClick={onRetry}
          type="button"
          aria-label="Retry connection"
        >
          Retry
        </button>
      )}
    </div>
  );
};

function getStatusConfig(state: ConnectionState): { message: string; icon: React.ReactNode } {
  switch (state) {
    case 'connected':
      return {
        message: 'Connected',
        icon: <ConnectedIcon />,
      };
    case 'connecting':
      return {
        message: 'Connecting...',
        icon: <LoadingIcon />,
      };
    case 'disconnected':
      return {
        message: 'Disconnected',
        icon: <DisconnectedIcon />,
      };
    case 'reconnecting':
      return {
        message: 'Reconnecting...',
        icon: <LoadingIcon />,
      };
    case 'error':
      return {
        message: 'Connection error',
        icon: <ErrorIcon />,
      };
    default:
      return {
        message: 'Unknown',
        icon: <DisconnectedIcon />,
      };
  }
}

const ConnectedIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="flowchat-connection-status__icon flowchat-connection-status__icon--connected"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const DisconnectedIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="flowchat-connection-status__icon flowchat-connection-status__icon--disconnected"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const ErrorIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="currentColor"
    className="flowchat-connection-status__icon flowchat-connection-status__icon--error"
  >
    <circle cx="12" cy="12" r="8" />
  </svg>
);

const LoadingIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    className="flowchat-connection-status__icon flowchat-connection-status__icon--loading"
  >
    <circle cx="12" cy="12" r="8" strokeOpacity="0.25" />
    <path d="M12 4a8 8 0 0 1 8 8" strokeLinecap="round" />
  </svg>
);

export default ConnectionStatus;
