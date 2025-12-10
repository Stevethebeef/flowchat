/**
 * FilePreview Component
 *
 * Displays file attachments with preview support for images.
 * Per 05-frontend-components.md spec.
 */

import React, { useState } from 'react';

export interface FilePreviewProps {
  /** File URL */
  url: string;
  /** File name */
  filename: string;
  /** MIME type */
  mimeType: string;
  /** File size in bytes */
  size?: number;
  /** Whether file is being uploaded */
  isUploading?: boolean;
  /** Upload progress (0-100) */
  uploadProgress?: number;
  /** Show remove button */
  removable?: boolean;
  /** Remove callback */
  onRemove?: () => void;
  /** Additional class name */
  className?: string;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

/**
 * Get file icon based on MIME type
 */
function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️';
  if (mimeType.startsWith('video/')) return '🎬';
  if (mimeType.startsWith('audio/')) return '🎵';
  if (mimeType.includes('pdf')) return '📄';
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝';
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊';
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint')) return '📊';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return '📦';
  if (mimeType.includes('text/')) return '📃';
  return '📎';
}

/**
 * FilePreview component for displaying file attachments
 */
export function FilePreview({
  url,
  filename,
  mimeType,
  size,
  isUploading = false,
  uploadProgress = 0,
  removable = false,
  onRemove,
  className = '',
}: FilePreviewProps) {
  const [imageError, setImageError] = useState(false);
  const isImage = mimeType.startsWith('image/') && !imageError;

  const classes = [
    'flowchat-file-preview',
    isUploading ? 'flowchat-file-uploading' : '',
    isImage ? 'flowchat-file-image' : 'flowchat-file-generic',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes}>
      {/* Image preview or file icon */}
      <div className="flowchat-file-preview-media">
        {isImage ? (
          <img
            src={url}
            alt={filename}
            onError={() => setImageError(true)}
            className="flowchat-file-preview-image"
          />
        ) : (
          <span className="flowchat-file-preview-icon" role="img" aria-label="File icon">
            {getFileIcon(mimeType)}
          </span>
        )}

        {/* Upload progress overlay */}
        {isUploading && (
          <div className="flowchat-file-upload-overlay">
            <div
              className="flowchat-file-upload-progress"
              style={{ width: `${uploadProgress}%` }}
            />
            <span className="flowchat-file-upload-text">{uploadProgress}%</span>
          </div>
        )}
      </div>

      {/* File info */}
      <div className="flowchat-file-preview-info">
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flowchat-file-preview-name"
          title={filename}
        >
          {filename}
        </a>
        {size !== undefined && (
          <span className="flowchat-file-preview-size">{formatFileSize(size)}</span>
        )}
      </div>

      {/* Remove button */}
      {removable && onRemove && !isUploading && (
        <button
          type="button"
          className="flowchat-file-preview-remove"
          onClick={onRemove}
          aria-label={`Remove ${filename}`}
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
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
    </div>
  );
}

export default FilePreview;
