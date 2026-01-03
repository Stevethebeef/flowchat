/**
 * ChatInput Component
 *
 * Input area for composing and sending messages with file upload and voice input support.
 */

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { useThreadRuntime } from '@assistant-ui/react';
import { useN8nChat } from '../../context/N8nChatContext';
import { uploadFiles } from '../../services/FileUploadService';
import { VoiceInputButton } from './VoiceInputButton';
import { useFrontendI18n } from '../../hooks/useFrontendI18n';
import type { ChatInputProps, UploadResponse } from '../../types';

export const ChatInput: React.FC<ChatInputProps> = ({
  placeholder,
  disabled = false,
  fileUpload = false,
  fileTypes = [],
  maxFileSize = 10485760, // 10MB
}) => {
  const { config, apiUrl } = useN8nChat();
  const { t } = useFrontendI18n();
  const threadRuntime = useThreadRuntime();

  const [inputValue, setInputValue] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Check if voice input is supported and enabled
  const voiceInputEnabled = config?.features?.voiceInput !== false;

  // Validate a single file
  const validateFile = useCallback(
    (file: File): boolean => {
      if (fileTypes.length > 0 && !fileTypes.includes(file.type)) {
        console.warn(`File type ${file.type} not allowed`);
        return false;
      }
      if (file.size > maxFileSize) {
        console.warn(`File ${file.name} exceeds maximum size`);
        return false;
      }
      return true;
    },
    [fileTypes, maxFileSize]
  );

  // Handle file selection
  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || []);
      setUploadError(null);

      // Validate files
      const validFiles = files.filter((file) => validateFile(file));

      setSelectedFiles((prev) => [...prev, ...validFiles]);

      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    },
    [validateFile]
  );

  // Remove file
  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // Trigger file input
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (fileUpload && !disabled && !isUploading) {
      setIsDragging(true);
    }
  }, [fileUpload, disabled, isUploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (!fileUpload || disabled || isUploading) return;

    const files = Array.from(e.dataTransfer.files);
    setUploadError(null);

    files.forEach(file => {
      if (validateFile(file)) {
        setSelectedFiles(prev => [...prev, file]);
      }
    });
  }, [fileUpload, disabled, isUploading, validateFile]);

  // Handle voice transcript
  const handleVoiceTranscript = useCallback((text: string) => {
    setInputValue((prev) => prev + (prev ? ' ' : '') + text);
    // Focus the text input after voice input
    textInputRef.current?.focus();
  }, []);

  // Handle text input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputValue(e.target.value);
  }, []);

  // Handle send message (defined before handleKeyDown to avoid stale closure)
  const handleSend = useCallback(async () => {
    const text = inputValue.trim();
    if (!text && selectedFiles.length === 0) return;
    if (isUploading || disabled) return;

    setUploadError(null);
    setIsUploading(true);

    try {
      let uploadedFiles: UploadResponse[] = [];

      // Upload files if any
      if (selectedFiles.length > 0 && apiUrl && config) {
        try {
          uploadedFiles = await uploadFiles(
            selectedFiles,
            config.instanceId,
            apiUrl
          );
        } catch (error) {
          setUploadError(error instanceof Error ? error.message : 'File upload failed');
          setIsUploading(false);
          return;
        }
      }

      // Build message content
      const content: Array<
        | { type: 'text'; text: string }
        | { type: 'image' | 'file'; url: string; filename: string; mimeType: string }
      > = [];

      if (text) {
        content.push({ type: 'text', text });
      }

      for (const file of uploadedFiles) {
        content.push({
          type: file.mimeType.startsWith('image/') ? 'image' : 'file',
          url: file.url,
          filename: file.filename,
          mimeType: file.mimeType,
        });
      }

      // Send message via thread runtime
      threadRuntime.append({
        role: 'user',
        content,
      });

      // Clear state
      setInputValue('');
      setSelectedFiles([]);
    } finally {
      setIsUploading(false);
    }
  }, [inputValue, selectedFiles, isUploading, disabled, apiUrl, config, threadRuntime]);

  // Handle key press (Enter to send)
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  // Auto-resize textarea
  useEffect(() => {
    if (textInputRef.current) {
      textInputRef.current.style.height = 'auto';
      textInputRef.current.style.height = `${Math.min(textInputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  const canSend = (inputValue.trim() || selectedFiles.length > 0) && !isUploading && !disabled;

  return (
    <div
      className={`n8n-chat-input-container${isDragging ? ' dragging' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag and drop hint overlay */}
      {isDragging && (
        <div className="n8n-chat-dropzone-hint">
          {t('dropFilesHere', 'Drop files here')}
        </div>
      )}

      {/* Upload error */}
      {uploadError && (
        <div className="n8n-chat-upload-error" role="alert">
          {uploadError}
          <button
            type="button"
            onClick={() => setUploadError(null)}
            className="n8n-chat-upload-error-dismiss"
            aria-label={t('dismissError', 'Dismiss error')}
          >
            <CloseIcon />
          </button>
        </div>
      )}

      {/* File previews */}
      {selectedFiles.length > 0 && (
        <div className="n8n-chat-file-previews">
          {selectedFiles.map((file, index) => (
            <FilePreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeFile(index)}
              disabled={isUploading}
            />
          ))}
        </div>
      )}

      <div className="n8n-chat-input-wrapper">
        {/* File upload button */}
        {fileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={fileTypes.join(',')}
              onChange={handleFileSelect}
              className="n8n-chat-file-input-hidden"
              aria-hidden="true"
            />
            <button
              type="button"
              className="n8n-chat-attachment-button"
              onClick={triggerFileInput}
              disabled={disabled || isUploading}
              aria-label={t('attachFile', 'Attach file')}
            >
              <AttachmentIcon />
            </button>
          </>
        )}

        {/* Text input */}
        <textarea
          ref={textInputRef}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isUploading}
          className="n8n-chat-input"
          rows={1}
          aria-label={t('messageInput', 'Message input')}
        />

        {/* Voice input button */}
        {voiceInputEnabled && (
          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            disabled={disabled || isUploading}
            className="n8n-chat-voice-input-button"
          />
        )}

        {/* Send button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="n8n-chat-send-button"
          aria-label={t('send', 'Send message')}
        >
          {isUploading ? <LoadingIcon /> : <SendIcon />}
        </button>
      </div>
    </div>
  );
};

/**
 * File preview component
 * Uses useState for previewUrl to prevent memory leaks from blob URLs
 */
interface FilePreviewProps {
  file: File;
  onRemove: () => void;
  disabled?: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, onRemove, disabled }) => {
  const isImage = file.type.startsWith('image/');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Create and cleanup blob URL properly
  useEffect(() => {
    if (!isImage) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Cleanup URL on unmount or when file changes
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file, isImage]);

  return (
    <div className="n8n-chat-file-preview">
      {isImage && previewUrl ? (
        <img src={previewUrl} alt={file.name} className="n8n-chat-file-preview-image" />
      ) : (
        <div className="n8n-chat-file-preview-icon">
          <FileIcon />
        </div>
      )}
      <span className="n8n-chat-file-preview-name">{file.name}</span>
      <button
        type="button"
        className="n8n-chat-file-preview-remove"
        onClick={onRemove}
        disabled={disabled}
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
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
  </svg>
);

const SendIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 24 24"
    fill="currentColor"
  >
    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
  </svg>
);

const LoadingIcon: React.FC = () => (
  <svg
    width="20"
    height="20"
    viewBox="0 0 20 20"
    fill="currentColor"
    className="n8n-chat-loading-spinner"
  >
    <path d="M10 3a7 7 0 0 1 7 7h-2a5 5 0 0 0-5-5V3z" />
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
