/**
 * Thread Component - Full-featured chat thread using assistant-ui
 * Implements all backend settings from Messages tab
 */

import React, { useRef, useCallback, useState } from 'react';
import {
  ThreadPrimitive,
  MessagePrimitive,
  ComposerPrimitive,
  ActionBarPrimitive,
  useThreadRuntime,
  useMessage,
} from '@assistant-ui/react';

// ============================================================================
// Icons
// ============================================================================

const SendIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13" />
    <polygon points="22 2 15 22 11 13 2 9 22 2" />
  </svg>
);

const CopyIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

const ChevronDownIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
);

const BotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="10" rx="2" />
    <circle cx="12" cy="5" r="2" />
    <path d="M12 7v4" />
    <line x1="8" y1="16" x2="8" y2="16" />
    <line x1="16" y1="16" x2="16" y2="16" />
  </svg>
);

const MicIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.91-3c-.49 0-.9.36-.98.85C16.52 14.2 14.47 16 12 16s-4.52-1.8-4.93-4.15c-.08-.49-.49-.85-.98-.85-.61 0-1.09.54-1 1.14.49 3 2.89 5.35 5.91 5.78V20c0 .55.45 1 1 1s1-.45 1-1v-2.08c3.02-.43 5.42-2.78 5.91-5.78.1-.6-.39-1.14-1-1.14z" />
  </svg>
);

const PaperclipIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M16.5 6v11.5c0 2.21-1.79 4-4 4s-4-1.79-4-4V5c0-1.38 1.12-2.5 2.5-2.5s2.5 1.12 2.5 2.5v10.5c0 .55-.45 1-1 1s-1-.45-1-1V6H10v9.5c0 1.38 1.12 2.5 2.5 2.5s2.5-1.12 2.5-2.5V5c0-2.21-1.79-4-4-4S7 2.79 7 5v12.5c0 3.04 2.46 5.5 5.5 5.5s5.5-2.46 5.5-5.5V6h-1.5z" />
  </svg>
);

const XIcon: React.FC<{ className?: string; size?: number }> = ({ className, size = 16 }) => (
  <svg className={className} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// ============================================================================
// Utility Functions
// ============================================================================

const formatTimestamp = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// ============================================================================
// Avatar Component
// ============================================================================

interface AvatarProps {
  type: 'user' | 'assistant';
  src?: string;
  primaryColor?: string;
  show?: boolean;
}

const Avatar: React.FC<AvatarProps> = ({ type, src, primaryColor, show = true }) => {
  const [imgError, setImgError] = useState(false);

  if (!show) return <div style={{ width: 32, height: 32 }} />;

  return (
    <div
      className={`flowchat-avatar ${type === 'user' ? 'flowchat-avatar-user' : 'flowchat-avatar-assistant'}`}
      style={type === 'user' && primaryColor ? { backgroundColor: primaryColor } : undefined}
    >
      {src && !imgError ? (
        <img src={src} alt="" onError={() => setImgError(true)} />
      ) : (
        type === 'user' ?
          <UserIcon style={{ width: 16, height: 16 }} /> :
          <BotIcon style={{ width: 16, height: 16 }} />
      )}
    </div>
  );
};

// ============================================================================
// Message Timestamp Component
// ============================================================================

interface TimestampProps {
  show?: boolean;
}

const MessageTimestamp: React.FC<TimestampProps> = ({ show }) => {
  const message = useMessage();

  if (!show || !message?.createdAt) return null;

  return (
    <span className="flowchat-timestamp">
      {formatTimestamp(message.createdAt)}
    </span>
  );
};

// ============================================================================
// User Message Component
// ============================================================================

interface UserMessageProps {
  primaryColor?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const UserMessage: React.FC<UserMessageProps> = ({ primaryColor, showAvatar = true, showTimestamp }) => (
  <MessagePrimitive.Root className="aui-user-message-root">
    <div className="flowchat-message flowchat-message-user">
      <Avatar type="user" primaryColor={primaryColor} show={showAvatar} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
        <div
          className="aui-user-message-content"
          style={primaryColor ? {
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)`,
          } : undefined}
        >
          <MessagePrimitive.Content />
        </div>
        <MessageTimestamp show={showTimestamp} />
      </div>
    </div>
  </MessagePrimitive.Root>
);

// ============================================================================
// Assistant Message Component
// ============================================================================

interface AssistantMessageProps {
  avatarUrl?: string;
  showAvatar?: boolean;
  showTimestamp?: boolean;
}

const AssistantMessage: React.FC<AssistantMessageProps> = ({ avatarUrl, showAvatar = true, showTimestamp }) => (
  <MessagePrimitive.Root className="aui-assistant-message-root">
    <div className="flowchat-message flowchat-message-assistant">
      <Avatar type="assistant" src={avatarUrl} show={showAvatar} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <div className="aui-assistant-message-content">
          <MessagePrimitive.Content />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <ActionBarPrimitive.Root className="aui-assistant-action-bar-root">
            <ActionBarPrimitive.Copy asChild>
              <button className="flowchat-action-button" aria-label="Copy message">
                <CopyIcon style={{ width: 14, height: 14 }} />
              </button>
            </ActionBarPrimitive.Copy>
          </ActionBarPrimitive.Root>
          <MessageTimestamp show={showTimestamp} />
        </div>
      </div>
    </div>
  </MessagePrimitive.Root>
);

// ============================================================================
// Scroll to Bottom Button
// ============================================================================

const ScrollToBottom: React.FC = () => (
  <ThreadPrimitive.ScrollToBottom className="aui-thread-scroll-to-bottom">
    <ChevronDownIcon style={{ width: 16, height: 16 }} />
  </ThreadPrimitive.ScrollToBottom>
);

// ============================================================================
// File Attachment Preview Component
// ============================================================================

interface AttachmentPreviewProps {
  file: File;
  onRemove: () => void;
}

const AttachmentPreview: React.FC<AttachmentPreviewProps> = ({ file, onRemove }) => {
  const isImage = file.type.startsWith('image/');
  const [preview, setPreview] = useState<string | null>(null);

  React.useEffect(() => {
    if (isImage) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);

  return (
    <div className="flowchat-attachment-preview">
      {isImage && preview ? (
        <img src={preview} alt={file.name} className="flowchat-attachment-image" />
      ) : (
        <div className="flowchat-attachment-file">
          <PaperclipIcon style={{ width: 16, height: 16 }} />
          <span className="flowchat-attachment-name">{file.name}</span>
          <span className="flowchat-attachment-size">{formatFileSize(file.size)}</span>
        </div>
      )}
      <button
        type="button"
        className="flowchat-attachment-remove"
        onClick={onRemove}
        aria-label="Remove attachment"
      >
        <XIcon size={14} />
      </button>
    </div>
  );
};

// ============================================================================
// Composer Component
// ============================================================================

interface ComposerProps {
  placeholder?: string;
  showVoiceInput?: boolean;
  primaryColor?: string;
  fileUpload?: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
}

const Composer: React.FC<ComposerProps> = ({
  placeholder = 'Type your message...',
  showVoiceInput = true,
  primaryColor,
  fileUpload = false,
  fileTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
  maxFileSize = 10 * 1024 * 1024, // 10MB default
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setError(null);

    for (const file of files) {
      // Check file type
      if (fileTypes.length > 0 && !fileTypes.some(type => {
        if (type.endsWith('/*')) {
          return file.type.startsWith(type.slice(0, -1));
        }
        return file.type === type;
      })) {
        setError(`File type ${file.type} is not allowed`);
        continue;
      }

      // Check file size
      if (file.size > maxFileSize) {
        setError(`File ${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`);
        continue;
      }

      setAttachments(prev => [...prev, file]);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [fileTypes, maxFileSize]);

  const removeAttachment = useCallback((index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  }, []);

  return (
    <ComposerPrimitive.Root className="aui-composer-root">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flowchat-attachments-container">
          {attachments.map((file, index) => (
            <AttachmentPreview
              key={`${file.name}-${index}`}
              file={file}
              onRemove={() => removeAttachment(index)}
            />
          ))}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="flowchat-composer-error">
          {error}
          <button type="button" onClick={() => setError(null)}>
            <XIcon size={12} />
          </button>
        </div>
      )}

      <div className="flowchat-composer-container">
        {/* File upload button */}
        {fileUpload && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept={fileTypes.join(',')}
              multiple
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="flowchat-attachment-button"
              onClick={() => fileInputRef.current?.click()}
              aria-label="Attach file"
            >
              <PaperclipIcon style={{ width: 18, height: 18 }} />
            </button>
          </>
        )}

        <ComposerPrimitive.Input
          placeholder={placeholder}
          className="aui-composer-input"
          autoFocus
        />
        <div className="flowchat-composer-actions">
          {showVoiceInput && (
            <button
              type="button"
              className="flowchat-voice-button"
              aria-label="Start voice input"
            >
              <MicIcon style={{ width: 18, height: 18 }} />
            </button>
          )}
          <ComposerPrimitive.Send
            className="aui-composer-send"
            style={primaryColor ? { backgroundColor: primaryColor } : undefined}
          >
            <SendIcon className="aui-composer-send-icon" />
          </ComposerPrimitive.Send>
        </div>
      </div>
    </ComposerPrimitive.Root>
  );
};

// ============================================================================
// Suggested Prompts Component
// ============================================================================

interface SuggestedPromptsProps {
  prompts?: string[];
  primaryColor?: string;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ prompts, primaryColor }) => {
  const runtime = useThreadRuntime();

  if (!prompts || prompts.length === 0) return null;

  const handleClick = (prompt: string) => {
    runtime.append({
      role: 'user',
      content: [{ type: 'text', text: prompt }],
    });
  };

  return (
    <div className="flowchat-suggestions">
      {prompts.slice(0, 4).map((prompt, index) => (
        <button
          key={index}
          type="button"
          className="flowchat-suggestion-button"
          onClick={() => handleClick(prompt)}
          style={primaryColor ? {
            borderColor: `${primaryColor}40`,
            color: primaryColor,
          } : undefined}
        >
          {prompt}
        </button>
      ))}
    </div>
  );
};

// ============================================================================
// Welcome Message Component
// ============================================================================

interface WelcomeMessageProps {
  message?: string;
  avatarUrl?: string;
  showAvatar?: boolean;
  suggestedPrompts?: string[];
  primaryColor?: string;
}

const WelcomeMessage: React.FC<WelcomeMessageProps> = ({
  message = "Hi! How can I help you today?",
  avatarUrl,
  showAvatar = true,
  suggestedPrompts,
  primaryColor,
}) => (
  <ThreadPrimitive.Empty>
    <div className="flowchat-welcome">
      <Avatar type="assistant" src={avatarUrl} show={showAvatar} />
      <div className="flowchat-welcome-content">
        <p style={{ margin: 0 }}>{message}</p>
      </div>
    </div>
    <SuggestedPrompts prompts={suggestedPrompts} primaryColor={primaryColor} />
  </ThreadPrimitive.Empty>
);

// ============================================================================
// Typing Indicator
// ============================================================================

interface TypingIndicatorProps {
  avatarUrl?: string;
  showAvatar?: boolean;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ avatarUrl, showAvatar = true }) => (
  <div className="flowchat-typing">
    <Avatar type="assistant" src={avatarUrl} show={showAvatar} />
    <div className="flowchat-typing-dots">
      <span className="flowchat-typing-dot" />
      <span className="flowchat-typing-dot" />
      <span className="flowchat-typing-dot" />
    </div>
  </div>
);

// ============================================================================
// Main Thread Component
// ============================================================================

export interface ThreadProps {
  welcomeMessage?: string;
  placeholder?: string;
  showVoiceInput?: boolean;
  primaryColor?: string;
  suggestedPrompts?: string[];
  showTimestamp?: boolean;
  showAvatar?: boolean;
  avatarUrl?: string;
  showTypingIndicator?: boolean;
  fileUpload?: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
  onNewMessage?: () => void;
}

export const Thread: React.FC<ThreadProps> = ({
  welcomeMessage,
  placeholder,
  showVoiceInput = true,
  primaryColor,
  suggestedPrompts,
  showTimestamp = false,
  showAvatar = true,
  avatarUrl,
  showTypingIndicator = true,
  fileUpload = false,
  fileTypes,
  maxFileSize,
  onNewMessage,
}) => {
  // Create message components with all props
  const UserMessageWithProps = useCallback(() => (
    <UserMessage
      primaryColor={primaryColor}
      showAvatar={showAvatar}
      showTimestamp={showTimestamp}
    />
  ), [primaryColor, showAvatar, showTimestamp]);

  const AssistantMessageWithProps = useCallback(() => (
    <AssistantMessage
      avatarUrl={avatarUrl}
      showAvatar={showAvatar}
      showTimestamp={showTimestamp}
    />
  ), [avatarUrl, showAvatar, showTimestamp]);

  return (
    <ThreadPrimitive.Root className="aui-thread-root">
      <ThreadPrimitive.Viewport className="aui-thread-viewport">
        <WelcomeMessage
          message={welcomeMessage}
          avatarUrl={avatarUrl}
          showAvatar={showAvatar}
          suggestedPrompts={suggestedPrompts}
          primaryColor={primaryColor}
        />
        <ThreadPrimitive.Messages
          components={{
            UserMessage: UserMessageWithProps,
            AssistantMessage: AssistantMessageWithProps,
          }}
        />
        {showTypingIndicator && (
          <ThreadPrimitive.If running>
            <TypingIndicator avatarUrl={avatarUrl} showAvatar={showAvatar} />
          </ThreadPrimitive.If>
        )}
      </ThreadPrimitive.Viewport>
      <ScrollToBottom />
      <Composer
        placeholder={placeholder}
        showVoiceInput={showVoiceInput}
        primaryColor={primaryColor}
        fileUpload={fileUpload}
        fileTypes={fileTypes}
        maxFileSize={maxFileSize}
      />
    </ThreadPrimitive.Root>
  );
};

export default Thread;
