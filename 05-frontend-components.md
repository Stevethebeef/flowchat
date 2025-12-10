# FlowChat - Frontend Components Specification

## Component Architecture

```
src/
├── index.tsx                    # Entry point, initialization
├── App.tsx                      # Root component with providers
├── contexts/
│   ├── InstanceManagerContext.tsx
│   ├── ConfigContext.tsx
│   └── FeatureFlagsContext.tsx
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx    # Main chat wrapper
│   │   ├── ChatHeader.tsx       # Title bar, controls
│   │   ├── ThreadView.tsx       # Message list
│   │   ├── Message.tsx          # Single message
│   │   ├── MessageContent.tsx   # Content rendering
│   │   ├── Composer.tsx         # Input area
│   │   ├── ComposerInput.tsx    # Text input
│   │   ├── ComposerActions.tsx  # Send, attach buttons
│   │   ├── Suggestions.tsx      # Quick reply chips
│   │   ├── TypingIndicator.tsx  # "Assistant is typing"
│   │   └── ChatFooter.tsx       # Branding, powered-by
│   ├── bubble/
│   │   ├── BubbleContainer.tsx  # Floating bubble wrapper
│   │   ├── BubbleTrigger.tsx    # Collapsed bubble button
│   │   ├── BubblePanel.tsx      # Expanded chat panel
│   │   ├── InstanceSwitcher.tsx # Tab bar for instances
│   │   └── UnreadBadge.tsx      # Notification count
│   ├── shared/
│   │   ├── Avatar.tsx           # User/assistant avatar
│   │   ├── IconButton.tsx       # Icon-only buttons
│   │   ├── LoadingSpinner.tsx   # Loading states
│   │   ├── ErrorMessage.tsx     # Error display
│   │   ├── FilePreview.tsx      # Attachment previews
│   │   └── Markdown.tsx         # Markdown renderer
│   └── ui/                      # Base UI primitives
│       ├── Button.tsx
│       ├── Input.tsx
│       ├── Textarea.tsx
│       └── Tooltip.tsx
├── hooks/
│   ├── useInstance.ts           # Instance state & config
│   ├── useRuntime.ts            # Runtime adapter access
│   ├── useHistory.ts            # Chat history operations
│   ├── useBubble.ts             # Bubble state management
│   ├── useAutoOpen.ts           # Auto-open trigger logic
│   └── useLocalStorage.ts       # Persistent state
├── runtime/
│   ├── n8nRuntime.ts            # n8n runtime adapter
│   ├── messageTransform.ts      # Message format conversion
│   └── streamParser.ts          # SSE stream parsing
├── styles/
│   ├── variables.css            # CSS custom properties
│   ├── base.css                 # Reset, typography
│   ├── components.css           # Component styles
│   └── themes/
│       ├── light.css
│       └── dark.css
└── utils/
    ├── cn.ts                    # Class name utility
    ├── storage.ts               # localStorage helpers
    └── uuid.ts                  # ID generation
```

## Core Components

### ChatContainer

Main wrapper component that assembles the chat interface.

```typescript
// components/chat/ChatContainer.tsx

import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { useInstance } from '../../hooks/useInstance';

interface ChatContainerProps {
  instanceId: string;
  mode: 'inline' | 'bubble' | 'fullscreen';
  className?: string;
}

export function ChatContainer({ 
  instanceId, 
  mode,
  className 
}: ChatContainerProps) {
  const { config, runtime, isLoading, error } = useInstance(instanceId);
  
  if (isLoading) {
    return <ChatSkeleton />;
  }
  
  if (error) {
    return <ChatError message={error} />;
  }
  
  const containerClasses = cn(
    'flowchat-container',
    `flowchat-mode-${mode}`,
    config.appearance.theme === 'dark' && 'flowchat-dark',
    className
  );
  
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div 
        className={containerClasses}
        style={generateCSSVariables(config.appearance)}
        data-instance-id={instanceId}
      >
        {config.display.inline.show_header && (
          <ChatHeader 
            title={config.name}
            onClose={mode === 'bubble' ? handleClose : undefined}
            onFullscreen={config.display.bubble.fullscreen_enabled ? handleFullscreen : undefined}
          />
        )}
        
        <ThreadView />
        
        {config.features.suggestions.enabled && (
          <Suggestions items={config.features.suggestions.items} />
        )}
        
        <Composer 
          placeholder={config.behavior.placeholder_text}
          maxLength={config.behavior.max_message_length}
          fileUpload={config.features.file_upload}
          voiceInput={config.features.voice_input}
        />
        
        {config.display.inline.show_footer && (
          <ChatFooter branding={globalSettings.branding} />
        )}
      </div>
    </AssistantRuntimeProvider>
  );
}

function generateCSSVariables(appearance: AppearanceConfig): React.CSSProperties {
  return {
    '--flowchat-primary': appearance.colors.primary,
    '--flowchat-primary-foreground': appearance.colors.primary_foreground,
    '--flowchat-background': appearance.colors.background,
    '--flowchat-surface': appearance.colors.surface,
    '--flowchat-border': appearance.colors.border,
    '--flowchat-text': appearance.colors.text,
    '--flowchat-text-muted': appearance.colors.text_muted,
    '--flowchat-user-bubble': appearance.colors.user_bubble,
    '--flowchat-user-bubble-text': appearance.colors.user_bubble_text,
    '--flowchat-assistant-bubble': appearance.colors.assistant_bubble,
    '--flowchat-assistant-bubble-text': appearance.colors.assistant_bubble_text,
    '--flowchat-error': appearance.colors.error,
    '--flowchat-border-radius': appearance.dimensions.border_radius,
    '--flowchat-message-radius': appearance.dimensions.message_border_radius,
    '--flowchat-avatar-size': appearance.dimensions.avatar_size,
    '--flowchat-font-family': appearance.typography.font_family,
    '--flowchat-font-size': appearance.typography.font_size_base,
    '--flowchat-shadow': appearance.shadows.container,
  } as React.CSSProperties;
}
```

### ChatHeader

```typescript
// components/chat/ChatHeader.tsx

import { 
  ThreadPrimitive,
  useThreadContext 
} from '@assistant-ui/react';

interface ChatHeaderProps {
  title: string;
  onMinimize?: () => void;
  onClose?: () => void;
  onFullscreen?: () => void;
}

export function ChatHeader({ 
  title, 
  onMinimize, 
  onClose, 
  onFullscreen 
}: ChatHeaderProps) {
  const { isRunning } = useThreadContext();
  
  return (
    <header className="flowchat-header">
      <div className="flowchat-header-title">
        <Avatar type="assistant" size="sm" />
        <span>{title}</span>
        {isRunning && (
          <span className="flowchat-status-indicator" aria-label="Active" />
        )}
      </div>
      
      <div className="flowchat-header-actions">
        {onFullscreen && (
          <IconButton 
            icon="expand" 
            onClick={onFullscreen}
            aria-label="Fullscreen"
          />
        )}
        {onMinimize && (
          <IconButton 
            icon="minimize" 
            onClick={onMinimize}
            aria-label="Minimize"
          />
        )}
        {onClose && (
          <IconButton 
            icon="close" 
            onClick={onClose}
            aria-label="Close"
          />
        )}
      </div>
    </header>
  );
}
```

### ThreadView

```typescript
// components/chat/ThreadView.tsx

import { 
  ThreadPrimitive,
  MessagePrimitive,
  useThreadContext 
} from '@assistant-ui/react';
import { useRef, useEffect } from 'react';

export function ThreadView() {
  const { messages, isRunning } = useThreadContext();
  const scrollRef = useRef<HTMLDivElement>(null);
  const { config } = useInstance();
  
  // Auto-scroll on new messages
  useEffect(() => {
    if (config.behavior.auto_scroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, config.behavior.auto_scroll]);
  
  return (
    <div className="flowchat-thread" ref={scrollRef}>
      <ThreadPrimitive.Messages>
        {messages.map((message, index) => (
          <Message 
            key={message.id} 
            message={message}
            showTimestamp={config.behavior.show_timestamps}
            isLatest={index === messages.length - 1}
          />
        ))}
      </ThreadPrimitive.Messages>
      
      {isRunning && <TypingIndicator />}
      
      <ThreadPrimitive.Empty>
        <WelcomeMessage text={config.behavior.welcome_message} />
      </ThreadPrimitive.Empty>
    </div>
  );
}

function WelcomeMessage({ text }: { text: string }) {
  if (!text) return null;
  
  return (
    <div className="flowchat-welcome">
      <Avatar type="assistant" />
      <div className="flowchat-welcome-content">
        <Markdown content={text} />
      </div>
    </div>
  );
}
```

### Message

```typescript
// components/chat/Message.tsx

import { MessagePrimitive } from '@assistant-ui/react';

interface MessageProps {
  message: ThreadMessage;
  showTimestamp: boolean;
  isLatest: boolean;
}

export function Message({ message, showTimestamp, isLatest }: MessageProps) {
  const isUser = message.role === 'user';
  const { config } = useInstance();
  
  return (
    <div 
      className={cn(
        'flowchat-message',
        isUser ? 'flowchat-message-user' : 'flowchat-message-assistant'
      )}
    >
      {!isUser && config.appearance.avatar.show_assistant && (
        <Avatar 
          type="assistant" 
          src={config.appearance.avatar.assistant_image}
          fallback={config.appearance.avatar.assistant_fallback}
        />
      )}
      
      <div className="flowchat-message-content">
        <MessagePrimitive.Content>
          {({ content }) => (
            <MessageContent 
              content={content}
              enableMarkdown={config.behavior.markdown_enabled}
              enableCodeHighlight={config.behavior.code_highlighting}
            />
          )}
        </MessagePrimitive.Content>
        
        {/* Attachments */}
        {message.attachments?.length > 0 && (
          <div className="flowchat-attachments">
            {message.attachments.map(att => (
              <FilePreview key={att.id} file={att} />
            ))}
          </div>
        )}
        
        {showTimestamp && (
          <time className="flowchat-timestamp">
            {formatTime(message.createdAt)}
          </time>
        )}
      </div>
      
      {isUser && config.appearance.avatar.show_user && (
        <Avatar 
          type="user"
          src={config.appearance.avatar.user_image}
        />
      )}
    </div>
  );
}
```

### MessageContent

```typescript
// components/chat/MessageContent.tsx

import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';

interface MessageContentProps {
  content: ContentPart[];
  enableMarkdown: boolean;
  enableCodeHighlight: boolean;
}

export function MessageContent({ 
  content, 
  enableMarkdown, 
  enableCodeHighlight 
}: MessageContentProps) {
  return (
    <>
      {content.map((part, index) => {
        if (part.type === 'text') {
          if (!enableMarkdown) {
            return <p key={index}>{part.text}</p>;
          }
          
          return (
            <ReactMarkdown
              key={index}
              remarkPlugins={[remarkGfm]}
              components={{
                code({ node, inline, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || '');
                  
                  if (!inline && match && enableCodeHighlight) {
                    return (
                      <SyntaxHighlighter
                        style={oneDark}
                        language={match[1]}
                        PreTag="div"
                        {...props}
                      >
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    );
                  }
                  
                  return (
                    <code className={className} {...props}>
                      {children}
                    </code>
                  );
                },
                a({ href, children }) {
                  return (
                    <a href={href} target="_blank" rel="noopener noreferrer">
                      {children}
                    </a>
                  );
                },
              }}
            >
              {part.text}
            </ReactMarkdown>
          );
        }
        
        if (part.type === 'image') {
          return (
            <img 
              key={index}
              src={part.image}
              alt="Image"
              className="flowchat-content-image"
            />
          );
        }
        
        if (part.type === 'tool-call') {
          return (
            <ToolCallDisplay 
              key={index}
              name={part.toolName}
              args={part.args}
              result={part.result}
            />
          );
        }
        
        return null;
      })}
    </>
  );
}
```

### Composer

```typescript
// components/chat/Composer.tsx

import { 
  ComposerPrimitive,
  useComposerContext 
} from '@assistant-ui/react';
import { useRef, useState } from 'react';

interface ComposerProps {
  placeholder: string;
  maxLength: number;
  fileUpload: FileUploadConfig;
  voiceInput: VoiceInputConfig;
}

export function Composer({ 
  placeholder, 
  maxLength, 
  fileUpload, 
  voiceInput 
}: ComposerProps) {
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      // Check size
      if (file.size > fileUpload.max_size_mb * 1024 * 1024) {
        showError(`File too large: ${file.name}`);
        return false;
      }
      // Check type
      if (!isAllowedType(file.type, fileUpload.allowed_types)) {
        showError(`File type not allowed: ${file.name}`);
        return false;
      }
      return true;
    });
    
    setAttachments(prev => [...prev, ...validFiles].slice(0, fileUpload.max_files));
  };
  
  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };
  
  return (
    <div className="flowchat-composer">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flowchat-composer-attachments">
          {attachments.map((file, index) => (
            <div key={index} className="flowchat-attachment-preview">
              <FilePreview file={file} size="sm" />
              <IconButton 
                icon="close" 
                size="xs"
                onClick={() => removeAttachment(index)}
              />
            </div>
          ))}
        </div>
      )}
      
      <div className="flowchat-composer-input-row">
        {/* Actions left */}
        <div className="flowchat-composer-actions-left">
          {fileUpload.enabled && (
            <>
              <IconButton 
                icon="attach"
                onClick={() => fileInputRef.current?.click()}
                aria-label="Attach file"
              />
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={fileUpload.allowed_types.join(',')}
                onChange={handleFileSelect}
                hidden
              />
            </>
          )}
          
          {voiceInput.enabled && (
            <IconButton 
              icon={isRecording ? 'stop' : 'mic'}
              onClick={() => handleVoiceInput()}
              aria-label={isRecording ? 'Stop recording' : 'Voice input'}
              className={isRecording ? 'recording' : ''}
            />
          )}
        </div>
        
        {/* Text input */}
        <ComposerPrimitive.Input asChild>
          <ComposerInput 
            placeholder={placeholder}
            maxLength={maxLength}
          />
        </ComposerPrimitive.Input>
        
        {/* Send button */}
        <ComposerPrimitive.Send asChild>
          <SendButton attachments={attachments} />
        </ComposerPrimitive.Send>
      </div>
    </div>
  );
}

function ComposerInput({ placeholder, maxLength }: { 
  placeholder: string; 
  maxLength: number;
}) {
  const { value, setValue } = useComposerContext();
  const remainingChars = maxLength - value.length;
  
  return (
    <div className="flowchat-input-wrapper">
      <textarea
        className="flowchat-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, maxLength))}
        rows={1}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            // Trigger send via form submit
          }
        }}
      />
      {remainingChars < 100 && (
        <span className="flowchat-char-count">
          {remainingChars}
        </span>
      )}
    </div>
  );
}

function SendButton({ attachments }: { attachments: File[] }) {
  const { value, isRunning } = useComposerContext();
  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isRunning;
  
  return (
    <button 
      type="submit"
      className="flowchat-send-button"
      disabled={!canSend}
      aria-label="Send message"
    >
      {isRunning ? (
        <LoadingSpinner size="sm" />
      ) : (
        <Icon name="send" />
      )}
    </button>
  );
}
```

### Suggestions

```typescript
// components/chat/Suggestions.tsx

import { useComposerContext } from '@assistant-ui/react';

interface SuggestionsProps {
  items: string[];
}

export function Suggestions({ items }: SuggestionsProps) {
  const { setValue, submit } = useComposerContext();
  const { messages } = useThreadContext();
  
  // Only show suggestions when thread is empty or after greeting
  if (messages.length > 1) {
    return null;
  }
  
  const handleClick = (suggestion: string) => {
    setValue(suggestion);
    submit();
  };
  
  return (
    <div className="flowchat-suggestions">
      {items.map((item, index) => (
        <button
          key={index}
          className="flowchat-suggestion-chip"
          onClick={() => handleClick(item)}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
```

### TypingIndicator

```typescript
// components/chat/TypingIndicator.tsx

export function TypingIndicator() {
  return (
    <div className="flowchat-typing" aria-label="Assistant is typing">
      <Avatar type="assistant" size="sm" />
      <div className="flowchat-typing-dots">
        <span className="flowchat-typing-dot" />
        <span className="flowchat-typing-dot" />
        <span className="flowchat-typing-dot" />
      </div>
    </div>
  );
}
```

## Bubble Components

### BubbleContainer

```typescript
// components/bubble/BubbleContainer.tsx

import { createPortal } from 'react-dom';
import { useBubble } from '../../hooks/useBubble';
import { useAutoOpen } from '../../hooks/useAutoOpen';

export function BubbleContainer() {
  const { 
    isOpen, 
    isMinimized,
    isFullscreen,
    activeInstanceId,
    instances,
    unreadCounts,
    position,
    open,
    close,
    minimize,
    maximize,
    toggleFullscreen,
    switchInstance
  } = useBubble();
  
  const { config } = useInstance(activeInstanceId);
  
  // Auto-open logic
  useAutoOpen({
    enabled: config?.display.bubble.auto_open.enabled,
    trigger: config?.display.bubble.auto_open.trigger,
    delay: config?.display.bubble.auto_open.delay_seconds,
    scrollPercent: config?.display.bubble.auto_open.scroll_percent,
    oncePerSession: config?.display.bubble.auto_open.once_per_session,
    onTrigger: open,
  });
  
  // Render in portal at body level
  return createPortal(
    <div 
      className={cn(
        'flowchat-bubble-container',
        isOpen && 'flowchat-bubble-open',
        isMinimized && 'flowchat-bubble-minimized',
        isFullscreen && 'flowchat-bubble-fullscreen',
        `flowchat-bubble-${config?.display.bubble.position}`
      )}
      style={{
        '--bubble-offset-x': `${position.x}px`,
        '--bubble-offset-y': `${position.y}px`,
        zIndex: globalSettings.bubble.z_index,
      } as React.CSSProperties}
    >
      {/* Collapsed bubble trigger */}
      {!isOpen && (
        <BubbleTrigger 
          icon={config?.display.bubble.icon}
          customIcon={config?.display.bubble.custom_icon_url}
          unreadCount={getTotalUnread(unreadCounts)}
          onClick={open}
        />
      )}
      
      {/* Expanded panel */}
      {isOpen && (
        <BubblePanel
          isMinimized={isMinimized}
          isFullscreen={isFullscreen}
          onMinimize={minimize}
          onMaximize={maximize}
          onClose={close}
          onFullscreen={toggleFullscreen}
        >
          {/* Instance switcher for multi-instance */}
          {instances.length > 1 && globalSettings.bubble.allow_instance_switching && (
            <InstanceSwitcher
              instances={instances}
              activeInstanceId={activeInstanceId}
              onSwitch={switchInstance}
              unreadCounts={unreadCounts}
            />
          )}
          
          {/* Chat container */}
          <ChatContainer 
            instanceId={activeInstanceId}
            mode="bubble"
          />
        </BubblePanel>
      )}
    </div>,
    document.body
  );
}
```

### BubbleTrigger

```typescript
// components/bubble/BubbleTrigger.tsx

interface BubbleTriggerProps {
  icon: 'chat' | 'message' | 'custom';
  customIcon?: string;
  unreadCount: number;
  onClick: () => void;
}

export function BubbleTrigger({ 
  icon, 
  customIcon, 
  unreadCount, 
  onClick 
}: BubbleTriggerProps) {
  return (
    <button
      className="flowchat-bubble-trigger"
      onClick={onClick}
      aria-label={`Open chat${unreadCount > 0 ? `, ${unreadCount} unread messages` : ''}`}
    >
      {icon === 'custom' && customIcon ? (
        <img src={customIcon} alt="" className="flowchat-bubble-icon-custom" />
      ) : (
        <Icon name={icon === 'message' ? 'message-circle' : 'message-square'} />
      )}
      
      {unreadCount > 0 && (
        <UnreadBadge count={unreadCount} />
      )}
    </button>
  );
}
```

### BubblePanel

```typescript
// components/bubble/BubblePanel.tsx

interface BubblePanelProps {
  isMinimized: boolean;
  isFullscreen: boolean;
  onMinimize: () => void;
  onMaximize: () => void;
  onClose: () => void;
  onFullscreen: () => void;
  children: React.ReactNode;
}

export function BubblePanel({
  isMinimized,
  isFullscreen,
  onMinimize,
  onMaximize,
  onClose,
  onFullscreen,
  children
}: BubblePanelProps) {
  // Animation states
  const [isAnimating, setIsAnimating] = useState(false);
  
  // Handle minimize/maximize with animation
  const handleMinimize = () => {
    setIsAnimating(true);
    setTimeout(() => {
      onMinimize();
      setIsAnimating(false);
    }, 200);
  };
  
  return (
    <div 
      className={cn(
        'flowchat-bubble-panel',
        isAnimating && 'flowchat-bubble-animating'
      )}
    >
      {/* Panel header with controls */}
      <div className="flowchat-bubble-panel-header">
        <div className="flowchat-bubble-panel-controls">
          {!isMinimized && (
            <IconButton 
              icon="minus" 
              onClick={handleMinimize}
              aria-label="Minimize"
              size="sm"
            />
          )}
          {isMinimized && (
            <IconButton 
              icon="maximize-2" 
              onClick={onMaximize}
              aria-label="Maximize"
              size="sm"
            />
          )}
          <IconButton 
            icon={isFullscreen ? 'minimize-2' : 'maximize'}
            onClick={onFullscreen}
            aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            size="sm"
          />
          <IconButton 
            icon="x" 
            onClick={onClose}
            aria-label="Close"
            size="sm"
          />
        </div>
      </div>
      
      {/* Content (hidden when minimized) */}
      {!isMinimized && (
        <div className="flowchat-bubble-panel-content">
          {children}
        </div>
      )}
      
      {/* Minimized preview */}
      {isMinimized && (
        <div 
          className="flowchat-bubble-minimized-preview"
          onClick={onMaximize}
        >
          <span>Click to expand</span>
        </div>
      )}
    </div>
  );
}
```

### InstanceSwitcher

```typescript
// components/bubble/InstanceSwitcher.tsx

interface InstanceSwitcherProps {
  instances: InstanceConfig[];
  activeInstanceId: string;
  onSwitch: (id: string) => void;
  unreadCounts: Record<string, number>;
}

export function InstanceSwitcher({
  instances,
  activeInstanceId,
  onSwitch,
  unreadCounts
}: InstanceSwitcherProps) {
  return (
    <div className="flowchat-instance-switcher" role="tablist">
      {instances.map(instance => (
        <button
          key={instance.id}
          role="tab"
          aria-selected={instance.id === activeInstanceId}
          className={cn(
            'flowchat-instance-tab',
            instance.id === activeInstanceId && 'flowchat-instance-tab-active'
          )}
          onClick={() => onSwitch(instance.id)}
        >
          <Avatar 
            src={instance.appearance.avatar?.assistant_image}
            fallback={instance.name.charAt(0)}
            size="xs"
          />
          <span className="flowchat-instance-tab-name">
            {instance.name}
          </span>
          {unreadCounts[instance.id] > 0 && (
            <UnreadBadge count={unreadCounts[instance.id]} size="sm" />
          )}
        </button>
      ))}
    </div>
  );
}
```

## Shared Components

### Avatar

```typescript
// components/shared/Avatar.tsx

interface AvatarProps {
  type?: 'user' | 'assistant';
  src?: string;
  fallback?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
}

export function Avatar({ 
  type = 'assistant', 
  src, 
  fallback,
  size = 'md' 
}: AvatarProps) {
  const [imageError, setImageError] = useState(false);
  const { currentUser } = useConfig();
  
  // Determine fallback text
  const fallbackText = fallback || (type === 'user' 
    ? getInitials(currentUser?.displayName)
    : 'AI');
  
  // Use image if available and not errored
  const showImage = src && !imageError;
  
  return (
    <div 
      className={cn(
        'flowchat-avatar',
        `flowchat-avatar-${type}`,
        `flowchat-avatar-${size}`
      )}
    >
      {showImage ? (
        <img 
          src={src}
          alt=""
          onError={() => setImageError(true)}
        />
      ) : (
        <span className="flowchat-avatar-fallback">
          {fallbackText}
        </span>
      )}
    </div>
  );
}

function getInitials(name?: string): string {
  if (!name) return 'U';
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();
}
```

### ErrorMessage

```typescript
// components/shared/ErrorMessage.tsx

interface ErrorMessageProps {
  type: keyof ErrorMessages;
  message?: string;
  onRetry?: () => void;
}

export function ErrorMessage({ type, message, onRetry }: ErrorMessageProps) {
  const { config } = useInstance();
  const displayMessage = message || config.errors[type] || config.errors.generic;
  
  return (
    <div className="flowchat-error" role="alert">
      <Icon name="alert-circle" className="flowchat-error-icon" />
      <p className="flowchat-error-message">{displayMessage}</p>
      {onRetry && (
        <button 
          className="flowchat-error-retry"
          onClick={onRetry}
        >
          Try again
        </button>
      )}
    </div>
  );
}
```

### FilePreview

```typescript
// components/shared/FilePreview.tsx

interface FilePreviewProps {
  file: File | Attachment;
  size?: 'sm' | 'md' | 'lg';
  onRemove?: () => void;
}

export function FilePreview({ file, size = 'md', onRemove }: FilePreviewProps) {
  const isImage = file.type?.startsWith('image/');
  const [preview, setPreview] = useState<string>();
  
  useEffect(() => {
    if (isImage && file instanceof File) {
      const url = URL.createObjectURL(file);
      setPreview(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [file, isImage]);
  
  return (
    <div className={cn('flowchat-file-preview', `flowchat-file-preview-${size}`)}>
      {isImage && preview ? (
        <img src={preview} alt={file.name} />
      ) : (
        <div className="flowchat-file-icon">
          <Icon name={getFileIcon(file.type)} />
        </div>
      )}
      
      <div className="flowchat-file-info">
        <span className="flowchat-file-name">{file.name}</span>
        <span className="flowchat-file-size">{formatFileSize(file.size)}</span>
      </div>
      
      {onRemove && (
        <IconButton 
          icon="x" 
          size="xs" 
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
        />
      )}
    </div>
  );
}

function getFileIcon(type?: string): string {
  if (!type) return 'file';
  if (type.startsWith('image/')) return 'image';
  if (type.includes('pdf')) return 'file-text';
  if (type.includes('word') || type.includes('document')) return 'file-text';
  if (type.includes('excel') || type.includes('spreadsheet')) return 'table';
  return 'file';
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
```

## CSS Architecture

### CSS Custom Properties

```css
/* styles/variables.css */

.flowchat-container {
  /* Colors - set by JS from config */
  --flowchat-primary: #0066cc;
  --flowchat-primary-foreground: #ffffff;
  --flowchat-secondary: #f5f5f5;
  --flowchat-secondary-foreground: #333333;
  --flowchat-background: #ffffff;
  --flowchat-surface: #f9f9f9;
  --flowchat-border: #e0e0e0;
  --flowchat-text: #333333;
  --flowchat-text-muted: #666666;
  --flowchat-user-bubble: var(--flowchat-primary);
  --flowchat-user-bubble-text: var(--flowchat-primary-foreground);
  --flowchat-assistant-bubble: var(--flowchat-surface);
  --flowchat-assistant-bubble-text: var(--flowchat-text);
  --flowchat-error: #dc2626;
  --flowchat-success: #16a34a;
  
  /* Typography */
  --flowchat-font-family: system-ui, -apple-system, sans-serif;
  --flowchat-font-size: 14px;
  --flowchat-line-height: 1.5;
  
  /* Spacing */
  --flowchat-space-xs: 4px;
  --flowchat-space-sm: 8px;
  --flowchat-space-md: 12px;
  --flowchat-space-lg: 16px;
  --flowchat-space-xl: 24px;
  
  /* Dimensions */
  --flowchat-border-radius: 12px;
  --flowchat-message-radius: 16px;
  --flowchat-avatar-size: 32px;
  --flowchat-input-height: 48px;
  
  /* Shadows */
  --flowchat-shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --flowchat-shadow-md: 0 4px 12px rgba(0,0,0,0.1);
  --flowchat-shadow-lg: 0 8px 24px rgba(0,0,0,0.15);
  
  /* Animations */
  --flowchat-transition-fast: 150ms ease;
  --flowchat-transition-normal: 200ms ease;
  --flowchat-transition-slow: 300ms ease;
}
```

### Component Styles Example

```css
/* styles/components.css */

/* Message styles */
.flowchat-message {
  display: flex;
  gap: var(--flowchat-space-sm);
  padding: var(--flowchat-space-sm) var(--flowchat-space-lg);
}

.flowchat-message-user {
  flex-direction: row-reverse;
}

.flowchat-message-content {
  max-width: 80%;
  padding: var(--flowchat-space-md) var(--flowchat-space-lg);
  border-radius: var(--flowchat-message-radius);
  word-wrap: break-word;
}

.flowchat-message-user .flowchat-message-content {
  background: var(--flowchat-user-bubble);
  color: var(--flowchat-user-bubble-text);
  border-bottom-right-radius: var(--flowchat-space-xs);
}

.flowchat-message-assistant .flowchat-message-content {
  background: var(--flowchat-assistant-bubble);
  color: var(--flowchat-assistant-bubble-text);
  border-bottom-left-radius: var(--flowchat-space-xs);
}

/* Typing indicator animation */
.flowchat-typing-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--flowchat-text-muted);
  animation: flowchat-typing 1.4s infinite ease-in-out both;
}

.flowchat-typing-dot:nth-child(1) { animation-delay: -0.32s; }
.flowchat-typing-dot:nth-child(2) { animation-delay: -0.16s; }

@keyframes flowchat-typing {
  0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
  40% { transform: scale(1); opacity: 1; }
}

/* Bubble animation */
.flowchat-bubble-trigger {
  transition: transform var(--flowchat-transition-normal),
              box-shadow var(--flowchat-transition-normal);
}

.flowchat-bubble-trigger:hover {
  transform: scale(1.05);
  box-shadow: var(--flowchat-shadow-lg);
}

.flowchat-bubble-panel {
  animation: flowchat-bubble-open var(--flowchat-transition-slow) ease-out;
}

@keyframes flowchat-bubble-open {
  from {
    opacity: 0;
    transform: scale(0.9) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}
```
