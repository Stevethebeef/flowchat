/**
 * ChatInput Component
 *
 * Input area for composing and sending messages.
 */

import React, { useRef, useState, useCallback } from 'react';
import { ComposerPrimitive } from '@assistant-ui/react';
import type { ChatInputProps } from '../../types';

export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder,
  disabled = false,
  fileUpload = false,
  fileTypes = [],
  maxFileSize = 10485760, // 10MB
}) => {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);

      // Validate files
      const validFiles = files.filter((file) => {
        if (fileTypes.length > 0 && !fileTypes.includes(file.type)) {
          console.warn(`File type ${file.type} not allowed`);
          return false;
        }
        if (file.size > maxFileSize) {
          console.warn(`File ${file.name} exceeds maximum size`);
          return false;
        }
        return true;
      });

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [fileTypes, maxFileSize]
  );

  // Remove file
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  return (
    <ComposerPrimitive.Root className="flowchat-input-container">
      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="flowchat-file-previews">
          {selectedFiles.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
            />
          ))}
        </div>
      )}

      <div className="flowchat-input-wrapper">
        {/* File upload button */}
        {fileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={fileTypes.join(',')}
              onChange={handleFileSelect}
              className="flowchat-file-input-hidden"
              aria-hidden="true"
            />
            <button
              type="button"
              className="flowchat-attachment-button"
              onClick={triggerFileInput}
              disabled={disabled}
              aria-label="Attach file"
            >
              <AttachmentIcon />
            </button>
          </>
        )}

        {/* Text input */}
        <ComposerPrimitive.Input
          placeholder={placeholder}
          disabled={disabled}
          className="flowchat-input"
          autoFocus
        />

        {/* Send button */}
        <ComposerPrimitive.Send
          disabled={disabled}
          className="flowchat-send-button"
        >
          <SendIcon />
        </ComposerPrimitive.Send>
      </div>

      {/* Cancel button (shown while generating) */}
      <ComposerPrimitive.Cancel className="flowchat-cancel-button">
        <StopIcon />
        <span>Stop generating</span>
      </ComposerPrimitive.Cancel>
    </ComposerPrimitive.Root>
  );
};

/**
 * File preview component
 */
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const previewUrl = isImage ? URL.createObjectURL(file) : null;

  // Cleanup URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <div className="flowchat-file-preview">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="flowchat-file-preview-image" />
      ) : (
        <div className="flowchat-file-preview-icon">
          <FileIcon />
        </div>
      )}
      <span className="flowchat-file-preview-name">{file.name}</span>
      <button
        type="button"
        className="flowchat-file-preview-remove"
        onClick={onRemove}
        aria-label={`Remove ${file.name}`}
      >
        <CloseIcon />
      </button>
    </div>
  );
};

// Icons
const AttachmentIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17.5 10.833v2.5a4.167 4.167 0 01-4.167 4.167H6.667A4.167 4.167 0 012.5 13.333v-2.5" />
    <path d="M10 12.5V2.5" />
    <path d="M6.667 5.833L10 2.5l3.333 3.333" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path d="M2.925 5.025L9.18333 7.70833L2.91667 6.875L2.925 5.025ZM9.175 12.2917L2.91667 14.975V13.125L9.175 12.2917ZM1.25833 2.5L1.25 8.33333L13.75 10L1.25 11.6667L1.25833 17.5L18.75 10L1.25833 2.5Z" />
  </svg>
);

const StopIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="currentColor"
  >
    <rect x="3" y="3" width="10" height="10" rx="1" />
  </svg>
);

const FileIcon: React.FC = () => (
  <svg
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
    <polyline points="14,2 14,8 20,8" />
  </svg>
);

const CloseIcon: React.FC = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
  >
    <line x1="2" y1="2" x2="10" y2="10" />
    <line x1="10" y1="2" x2="2" y2="10" />
  </svg>
);

export default ChatInput;
