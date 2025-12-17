/**
 * File Upload Service
 *
 * Handles file uploads to the n8n Chat REST API.
 */

import type { UploadResponse } from '../types';

/**
 * Upload a file to the n8n Chat server
 *
 * @param file - The file to upload
 * @param instanceId - The chat instance ID
 * @param apiUrl - The base API URL (e.g., /wp-json/n8n-chat/v1)
 * @returns Upload response with file URL and metadata
 */
export async function uploadFile(
  file: File,
  instanceId: string,
  apiUrl: string
): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('instance_id', instanceId);

  const response = await fetch(`${apiUrl}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = 'Upload failed';
    try {
      const error = await response.json();
      errorMessage = error.message || errorMessage;
    } catch {
      // Response wasn't JSON
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();

  // Transform snake_case to camelCase if needed
  return {
    success: data.success,
    url: data.url,
    filename: data.filename,
    mimeType: data.mime_type || data.mimeType,
    size: data.size,
    expiresAt: data.expires_at || data.expiresAt,
  };
}

/**
 * Upload multiple files in parallel
 *
 * @param files - Array of files to upload
 * @param instanceId - The chat instance ID
 * @param apiUrl - The base API URL
 * @param onProgress - Optional callback for upload progress
 * @returns Array of upload responses
 */
export async function uploadFiles(
  files: File[],
  instanceId: string,
  apiUrl: string,
  onProgress?: (completed: number, total: number) => void
): Promise<UploadResponse[]> {
  const results: UploadResponse[] = [];
  let completed = 0;

  // Upload files in parallel with progress tracking
  const uploads = files.map(async (file) => {
    const result = await uploadFile(file, instanceId, apiUrl);
    completed++;
    onProgress?.(completed, files.length);
    return result;
  });

  const responses = await Promise.all(uploads);
  return responses;
}

export default uploadFile;
