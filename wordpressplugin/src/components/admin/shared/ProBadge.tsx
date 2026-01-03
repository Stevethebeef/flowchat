/**
 * ProBadge Component
 *
 * Small badge to indicate premium/pro features.
 */

import React from 'react';

interface ProBadgeProps {
  /** Badge variant */
  variant?: 'default' | 'small' | 'inline';
  /** Custom class name */
  className?: string;
}

/**
 * Pro badge component - shows "PRO" label for premium features
 */
export const ProBadge: React.FC<ProBadgeProps> = ({
  variant = 'default',
  className = '',
}) => {
  return (
    <span className={`n8n-chat-pro-badge n8n-chat-pro-badge-${variant} ${className}`}>
      PRO
    </span>
  );
};

/**
 * Crown icon for premium features
 */
export const CrownIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`n8n-chat-crown-icon ${className}`}
  >
    <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z" />
    <path d="M3 20h18" />
  </svg>
);

/**
 * Lock icon for locked features
 */
export const LockIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 16,
  className = '',
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`n8n-chat-lock-icon ${className}`}
  >
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0110 0v4" />
  </svg>
);

export default ProBadge;
