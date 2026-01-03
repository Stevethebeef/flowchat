/**
 * N8Chat Icon Component
 *
 * The official N8.Chat branded icon - orange rounded box with "N8" text.
 * Based on assets/logos/n8chat-icon-simple.svg
 *
 * Brand Colors:
 * - Primary: #FF6B2C (orange)
 * - Gradient End: #FF8F5C
 */

import React from 'react';

interface N8ChatIconProps {
  /** Icon size in pixels */
  size?: number;
  /** Custom class name */
  className?: string;
  /** Use gradient fill instead of solid color */
  gradient?: boolean;
  /** Use only the current color (for monochrome contexts) */
  currentColor?: boolean;
}

/**
 * N8.Chat branded icon component
 */
export const N8ChatIcon: React.FC<N8ChatIconProps> = ({
  size = 24,
  className = '',
  gradient = false,
  currentColor = false,
}) => {
  const gradientId = `n8chat-gradient-${Math.random().toString(36).substr(2, 9)}`;

  const fill = currentColor
    ? 'currentColor'
    : gradient
      ? `url(#${gradientId})`
      : '#FF6B2C';

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 512 512"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`n8n-chat-icon ${className}`.trim()}
      aria-hidden="true"
    >
      {gradient && (
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FF6B2C" />
            <stop offset="100%" stopColor="#FF8F5C" />
          </linearGradient>
        </defs>
      )}
      <rect x="32" y="32" width="448" height="448" rx="80" fill={fill} />
      <text
        x="256"
        y="310"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="200"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        N8
      </text>
    </svg>
  );
};

/**
 * N8.Chat logo with wordmark (icon + ".Chat" text)
 */
export const N8ChatLogo: React.FC<{
  height?: number;
  className?: string;
  variant?: 'default' | 'white' | 'dark';
}> = ({
  height = 40,
  className = '',
  variant = 'default',
}) => {
  const width = height * 4; // Aspect ratio of horizontal logo
  const textColor = variant === 'white' ? '#FAFAFA' : variant === 'dark' ? '#1d1d1f' : '#FAFAFA';
  const gradientId = `n8chat-logo-gradient-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 400 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`n8n-chat-logo ${className}`.trim()}
      aria-label="N8.Chat"
    >
      <defs>
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FF6B2C" />
          <stop offset="100%" stopColor="#FF8F5C" />
        </linearGradient>
      </defs>

      {/* Icon box */}
      <rect x="10" y="10" width="80" height="80" rx="16" fill={`url(#${gradientId})`} />

      {/* N8 in icon */}
      <text
        x="50"
        y="65"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="36"
        fontWeight="700"
        fill="white"
        textAnchor="middle"
      >
        N8
      </text>

      {/* .Chat text */}
      <text
        x="110"
        y="65"
        fontFamily="system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
        fontSize="40"
        fontWeight="700"
        fill={textColor}
      >
        .Chat
      </text>
    </svg>
  );
};

export default N8ChatIcon;
