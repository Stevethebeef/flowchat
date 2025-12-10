/**
 * Avatar Component
 *
 * Displays user or assistant avatar with fallback support.
 * Per 05-frontend-components.md spec.
 */

import React, { useState } from 'react';

export interface AvatarProps {
  /** Avatar type */
  type?: 'user' | 'assistant';
  /** Image source URL */
  src?: string;
  /** Fallback text (initials) */
  fallback?: string;
  /** Avatar size */
  size?: 'xs' | 'sm' | 'md' | 'lg';
  /** Alt text */
  alt?: string;
  /** Additional class name */
  className?: string;
}

const SIZE_CLASSES: Record<NonNullable<AvatarProps['size']>, string> = {
  xs: 'flowchat-avatar-xs',
  sm: 'flowchat-avatar-sm',
  md: 'flowchat-avatar-md',
  lg: 'flowchat-avatar-lg',
};

/**
 * Get initials from a name
 */
function getInitials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

/**
 * Avatar component for displaying user or assistant images
 */
export function Avatar({
  type = 'assistant',
  src,
  fallback,
  size = 'md',
  alt = '',
  className = '',
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  // Determine fallback text
  const fallbackText = fallback || (type === 'user' ? 'U' : 'AI');

  // Show image if available and not errored
  const showImage = src && !imageError;

  const classes = [
    'flowchat-avatar',
    `flowchat-avatar-${type}`,
    SIZE_CLASSES[size],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role="img" aria-label={alt || `${type} avatar`}>
      {showImage ? (
        <img
          src={src}
          alt={alt}
          onError={() => setImageError(true)}
          className="flowchat-avatar-image"
        />
      ) : (
        <span className="flowchat-avatar-fallback">{fallbackText}</span>
      )}
    </div>
  );
}

export default Avatar;
