/**
 * File Upload Hook for n8n Chat Widget
 * Handles file selection, validation, and upload to n8n backend
 */

import { useState, useCallback, useRef } from 'react';

export interface FileUploadConfig {
  enabled: boolean;
  maxFileSize: number; // in bytes
  allowedTypes: string[]; // MIME types or extensions
  maxFiles: number;
  uploadEndpoint?: string; // Optional separate upload endpoint
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'error';
  error?: string;
  file: File;
}

export interface UseFileUploadOptions {
  config: FileUploadConfig;
  webhookUrl: string;
  sessionId: string;
  onUploadComplete?: (files: UploadedFile[]) => void;
  onUploadError?: (error: string, file: UploadedFile) => void;
}

export interface UseFileUploadReturn {
  files: UploadedFile[];
  isUploading: boolean;
  selectFiles: () => void;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (id: string) => void;
  clearFiles: () => void;
  uploadFiles: () => Promise<UploadedFile[]>;
  error: string | null;
  inputRef: React.RefObject<HTMLInputElement>;
}

/**
 * Generate a unique ID for files
 */
function generateId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Get file extension from filename
 */
function getFileExtension(filename: string): string {
  return filename.slice(((filename.lastIndexOf('.') - 1) >>> 0) + 2).toLowerCase();
}

/**
 * Check if a file type is allowed
 */
function isFileTypeAllowed(file: File, allowedTypes: string[]): boolean {
  if (allowedTypes.length === 0) return true;

  const extension = `.${getFileExtension(file.name)}`;
  const mimeType = file.type.toLowerCase();

  return allowedTypes.some((allowed) => {
    const normalizedAllowed = allowed.toLowerCase();

    // Check exact MIME type match
    if (mimeType === normalizedAllowed) return true;

    // Check extension match
    if (normalizedAllowed.startsWith('.') && extension === normalizedAllowed) return true;

    // Check wildcard MIME type (e.g., image/*)
    if (normalizedAllowed.endsWith('/*')) {
      const typePrefix = normalizedAllowed.slice(0, -2);
      if (mimeType.startsWith(typePrefix)) return true;
    }

    return false;
  });
}

/**
 * Validate a file against config rules
 */
function validateFile(
  file: File,
  config: FileUploadConfig,
  existingCount: number
): { valid: boolean; error?: string } {
  // Check if file uploads are enabled
  if (!config.enabled) {
    return { valid: false, error: 'File uploads are not enabled' };
  }

  // Check max files
  if (existingCount >= config.maxFiles) {
    return { valid: false, error: `Maximum ${config.maxFiles} files allowed` };
  }

  // Check file size
  if (file.size > config.maxFileSize) {
    return {
      valid: false,
      error: `File size exceeds ${formatFileSize(config.maxFileSize)}`,
    };
  }

  // Check file type
  if (!isFileTypeAllowed(file, config.allowedTypes)) {
    return {
      valid: false,
      error: `File type not allowed. Accepted: ${config.allowedTypes.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Hook for file upload functionality
 */
export function useFileUpload({
  config,
  webhookUrl,
  sessionId,
  onUploadComplete,
  onUploadError,
}: UseFileUploadOptions): UseFileUploadReturn {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Create hidden file input
  const selectFiles = useCallback(() => {
    if (!config.enabled) return;

    if (inputRef.current) {
      inputRef.current.click();
    }
  }, [config.enabled]);

  // Add files to the queue
  const addFiles = useCallback(
    (newFiles: FileList | File[]) => {
      setError(null);

      const filesToAdd: UploadedFile[] = [];
      const errors: string[] = [];

      const fileArray = Array.from(newFiles);

      for (const file of fileArray) {
        const validation = validateFile(file, config, files.length + filesToAdd.length);

        if (validation.valid) {
          filesToAdd.push({
            id: generateId(),
            name: file.name,
            size: file.size,
            type: file.type,
            progress: 0,
            status: 'pending',
            file,
          });
        } else {
          errors.push(`${file.name}: ${validation.error}`);
        }
      }

      if (errors.length > 0) {
        setError(errors.join('. '));
      }

      if (filesToAdd.length > 0) {
        setFiles((prev) => [...prev, ...filesToAdd]);
      }
    },
    [config, files.length]
  );

  // Remove a file from the queue
  const removeFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setError(null);
  }, []);

  // Upload all pending files
  const uploadFiles = useCallback(async (): Promise<UploadedFile[]> => {
    const pendingFiles = files.filter((f) => f.status === 'pending');

    if (pendingFiles.length === 0) {
      return files;
    }

    setIsUploading(true);
    setError(null);

    const uploadEndpoint = config.uploadEndpoint || webhookUrl;
    const results: UploadedFile[] = [];

    for (const uploadFile of pendingFiles) {
      // Update status to uploading
      setFiles((prev) =>
        prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'uploading' as const } : f))
      );

      try {
        const formData = new FormData();
        formData.append('action', 'uploadFile');
        formData.append('sessionId', sessionId);
        formData.append('file', uploadFile.file);
        formData.append('filename', uploadFile.name);

        const response = await fetch(uploadEndpoint, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const data = await response.json();

        const completedFile: UploadedFile = {
          ...uploadFile,
          url: data.url || data.fileUrl,
          progress: 100,
          status: 'completed',
        };

        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? completedFile : f)));

        results.push(completedFile);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';

        const errorFile: UploadedFile = {
          ...uploadFile,
          status: 'error',
          error: errorMessage,
        };

        setFiles((prev) => prev.map((f) => (f.id === uploadFile.id ? errorFile : f)));

        onUploadError?.(errorMessage, errorFile);
        results.push(errorFile);
      }
    }

    setIsUploading(false);

    const completedFiles = results.filter((f) => f.status === 'completed');
    if (completedFiles.length > 0) {
      onUploadComplete?.(completedFiles);
    }

    return results;
  }, [files, config.uploadEndpoint, webhookUrl, sessionId, onUploadComplete, onUploadError]);

  return {
    files,
    isUploading,
    selectFiles,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
    error,
    inputRef,
  };
}

/**
 * Get accepted file types string for input element
 */
export function getAcceptString(allowedTypes: string[]): string {
  return allowedTypes.join(',');
}

/**
 * Default file upload configuration
 */
export const DEFAULT_FILE_CONFIG: FileUploadConfig = {
  enabled: false,
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: ['image/*', '.pdf', '.doc', '.docx', '.txt'],
  maxFiles: 5,
};

/**
 * Common allowed file type presets
 */
export const FILE_TYPE_PRESETS = {
  images: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  documents: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt'],
  all: ['image/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt', '.zip'],
} as const;
