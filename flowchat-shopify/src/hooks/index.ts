/**
 * n8n Chat Widget Hooks
 * Export all custom hooks for the chat widget
 */

// Re-export useful Assistant UI hooks for convenience
export { useLocalRuntime } from '@assistant-ui/react';

// Proactive triggers
export {
  useProactiveTriggers,
  useAutoOpen,
  resetTriggerState,
} from './useProactiveTriggers';
export type {
  ProactiveTrigger,
  UseProactiveTriggersOptions,
} from './useProactiveTriggers';

// Voice input
export {
  useVoiceInput,
  useMicrophonePermission,
} from './useVoiceInput';
export type {
  UseVoiceInputOptions,
  UseVoiceInputReturn,
} from './useVoiceInput';

// File upload
export {
  useFileUpload,
  formatFileSize,
  getAcceptString,
  DEFAULT_FILE_CONFIG,
  FILE_TYPE_PRESETS,
} from './useFileUpload';
export type {
  FileUploadConfig,
  UploadedFile,
  UseFileUploadOptions,
  UseFileUploadReturn,
} from './useFileUpload';
