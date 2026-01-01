# FlowChat Pro - React Components

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Technical Specification

---

## Component Architecture

```
FlowChatApp
├── FlowChatRuntime (Provider)
│   └── ChatContainer
│       ├── ChatBubble (when mode=bubble)
│       │   ├── BubbleButton
│       │   └── ChatWindow
│       │       ├── ChatHeader
│       │       ├── Thread (assistant-ui)
│       │       │   ├── WelcomeScreen
│       │       │   ├── MessageList
│       │       │   │   └── Message (assistant-ui)
│       │       │   └── Composer (assistant-ui)
│       │       └── ChatFooter
│       │
│       ├── ChatInline (when mode=inline)
│       │   └── [Same as ChatWindow]
│       │
│       └── ChatSidebar (when mode=sidebar)
│           └── [Same as ChatWindow]
```

---

## Entry Point

```typescript
// src/chat/main.tsx

import React from 'react';
import { createRoot } from 'react-dom/client';
import { FlowChatApp } from './App';

// Mount function called by WordPress
function mountFlowChat(containerId: string, configId: string) {
  const container = document.getElementById(containerId);
  
  if (!container) {
    console.error(`FlowChat: Container #${containerId} not found`);
    return;
  }
  
  // Get configuration from WordPress
  const configKey = `flowchatConfig_${configId}`;
  const config = (window as any)[configKey];
  
  if (!config) {
    console.error(`FlowChat: Configuration ${configId} not found`);
    return;
  }
  
  const root = createRoot(container);
  root.render(
    <React.StrictMode>
      <FlowChatApp config={config} />
    </React.StrictMode>
  );
  
  // Return unmount function
  return () => {
    root.unmount();
  };
}

// Expose to global
(window as any).FlowChat = {
  mount: mountFlowChat,
  instances: new Map(),
};

// Auto-mount all containers
document.addEventListener('DOMContentLoaded', () => {
  const containers = document.querySelectorAll('[data-flowchat]');
  
  containers.forEach((container) => {
    const configId = container.getAttribute('data-flowchat');
    if (configId) {
      const unmount = mountFlowChat(container.id, configId);
      (window as any).FlowChat.instances.set(container.id, unmount);
    }
  });
});
```

---

## Main App Component

```typescript
// src/chat/App.tsx

import React from 'react';
import { FlowChatRuntime } from './runtime/FlowChatRuntime';
import { ChatContainer } from './components/ChatContainer';
import { ThemeProvider } from './theme/ThemeProvider';
import type { FlowChatConfig } from './types';
import './styles/tailwind.css';

interface FlowChatAppProps {
  config: FlowChatConfig;
}

export function FlowChatApp({ config }: FlowChatAppProps) {
  return (
    <ThemeProvider config={config.appearance}>
      <FlowChatRuntime config={config}>
        <ChatContainer config={config} />
      </FlowChatRuntime>
    </ThemeProvider>
  );
}
```

---

## Chat Container

```typescript
// src/chat/components/ChatContainer.tsx

import React from 'react';
import { ChatBubble } from './bubble/ChatBubble';
import { ChatInline } from './inline/ChatInline';
import { ChatSidebar } from './sidebar/ChatSidebar';
import type { FlowChatConfig } from '../types';

interface ChatContainerProps {
  config: FlowChatConfig;
}

export function ChatContainer({ config }: ChatContainerProps) {
  const { mode } = config.display;
  
  switch (mode) {
    case 'bubble':
      return <ChatBubble config={config} />;
    case 'inline':
      return <ChatInline config={config} />;
    case 'sidebar':
      return <ChatSidebar config={config} />;
    case 'fullpage':
      return <ChatInline config={config} fullPage />;
    default:
      return <ChatBubble config={config} />;
  }
}
```

---

## Bubble Components

### ChatBubble

```typescript
// src/chat/components/bubble/ChatBubble.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { BubbleButton } from './BubbleButton';
import { ChatWindow } from '../window/ChatWindow';
import { useEscapeKey } from '../../hooks/useEscapeKey';
import { useClickOutside } from '../../hooks/useClickOutside';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import type { FlowChatConfig } from '../../types';

interface ChatBubbleProps {
  config: FlowChatConfig;
}

type BubbleState = 'collapsed' | 'expanded' | 'fullscreen';

export function ChatBubble({ config }: ChatBubbleProps) {
  const { bubble, window: windowConfig, behavior, mobile } = config.display;
  const storageKey = `flowchat_state_${config.id}`;
  
  // State management
  const [savedState, setSavedState] = useLocalStorage<BubbleState>(
    storageKey,
    'collapsed'
  );
  
  const [state, setState] = useState<BubbleState>(
    behavior.rememberState ? savedState : 'collapsed'
  );
  
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(
    window.innerWidth < (mobile.mobileBreakpoint || 768)
  );
  
  // Refs for click outside
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Sync state to storage
  useEffect(() => {
    if (behavior.rememberState) {
      setSavedState(state);
    }
  }, [state, behavior.rememberState, setSavedState]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < (mobile.mobileBreakpoint || 768));
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobile.mobileBreakpoint]);
  
  // Auto-open logic
  useEffect(() => {
    if (!behavior.autoOpen || state !== 'collapsed') return;
    
    const timer = setTimeout(() => {
      setState('expanded');
    }, behavior.autoOpenDelay * 1000);
    
    return () => clearTimeout(timer);
  }, [behavior.autoOpen, behavior.autoOpenDelay, state]);
  
  // Exit intent detection
  useEffect(() => {
    if (!behavior.openOnExitIntent || state !== 'collapsed') return;
    
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY < 10) {
        setState('expanded');
      }
    };
    
    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [behavior.openOnExitIntent, state]);
  
  // Escape key to close
  useEscapeKey(() => {
    if (behavior.closeOnEscape && state !== 'collapsed') {
      setState('collapsed');
    }
  });
  
  // Click outside to close
  useClickOutside(containerRef, () => {
    if (behavior.closeOnOutsideClick && state === 'expanded') {
      setState('collapsed');
    }
  });
  
  // Handlers
  const handleToggle = useCallback(() => {
    setState(prev => prev === 'collapsed' ? 'expanded' : 'collapsed');
    setUnreadCount(0);
  }, []);
  
  const handleFullscreen = useCallback(() => {
    setState(prev => prev === 'fullscreen' ? 'expanded' : 'fullscreen');
  }, []);
  
  const handleClose = useCallback(() => {
    setState('collapsed');
  }, []);
  
  const handleNewMessage = useCallback(() => {
    if (state === 'collapsed') {
      setUnreadCount(prev => prev + 1);
    }
  }, [state]);
  
  // Check mobile visibility
  if (isMobile && mobile.hideOnMobile) {
    return null;
  }
  
  // Position classes
  const positionClasses = bubble?.position === 'bottom-left'
    ? 'left-[var(--fc-bubble-offset-x)] bottom-[var(--fc-bubble-offset-y)]'
    : 'right-[var(--fc-bubble-offset-x)] bottom-[var(--fc-bubble-offset-y)]';
  
  return (
    <div
      ref={containerRef}
      className={`
        fixed z-[9999]
        ${positionClasses}
        ${state === 'fullscreen' ? 'inset-0' : ''}
      `}
      style={{
        '--fc-bubble-offset-x': `${bubble?.offsetX || 20}px`,
        '--fc-bubble-offset-y': `${bubble?.offsetY || 20}px`,
      } as React.CSSProperties}
    >
      {/* Chat Window */}
      {state !== 'collapsed' && (
        <ChatWindow
          config={config}
          isFullscreen={state === 'fullscreen' || (isMobile && mobile.fullscreenOnMobile)}
          onClose={handleClose}
          onFullscreen={behavior.allowFullscreen ? handleFullscreen : undefined}
          onNewMessage={handleNewMessage}
        />
      )}
      
      {/* Bubble Button */}
      {state === 'collapsed' && (
        <BubbleButton
          config={config}
          onClick={handleToggle}
          unreadCount={bubble?.notificationBadge ? unreadCount : 0}
        />
      )}
    </div>
  );
}
```

### BubbleButton

```typescript
// src/chat/components/bubble/BubbleButton.tsx

import React from 'react';
import { MessageCircle, HelpCircle, Mail } from 'lucide-react';
import type { FlowChatConfig } from '../../types';

interface BubbleButtonProps {
  config: FlowChatConfig;
  onClick: () => void;
  unreadCount: number;
}

export function BubbleButton({ config, onClick, unreadCount }: BubbleButtonProps) {
  const { bubble } = config.display;
  const { colors, animations } = config.appearance;
  
  const sizeMap = {
    small: 'w-12 h-12',
    medium: 'w-15 h-15',  // 60px
    large: 'w-18 h-18',   // 72px
  };
  
  const iconSizeMap = {
    small: 20,
    medium: 24,
    large: 28,
  };
  
  const IconComponent = {
    chat: MessageCircle,
    help: HelpCircle,
    message: Mail,
  }[bubble?.icon || 'chat'] || MessageCircle;
  
  return (
    <button
      onClick={onClick}
      className={`
        ${sizeMap[bubble?.size || 'medium']}
        rounded-full shadow-lg
        flex items-center justify-center
        transition-all duration-200
        hover:scale-110 hover:shadow-xl
        focus:outline-none focus:ring-2 focus:ring-offset-2
        ${animations.bubblePulse ? 'animate-pulse-subtle' : ''}
      `}
      style={{
        backgroundColor: colors.primary,
        color: colors.primaryForeground,
      }}
      aria-label="Open chat"
    >
      {bubble?.icon === 'custom' && bubble?.customIconUrl ? (
        <img
          src={bubble.customIconUrl}
          alt="Chat"
          className="w-6 h-6"
        />
      ) : (
        <IconComponent size={iconSizeMap[bubble?.size || 'medium']} />
      )}
      
      {/* Unread badge */}
      {unreadCount > 0 && (
        <span
          className="
            absolute -top-1 -right-1
            min-w-[20px] h-5
            rounded-full
            flex items-center justify-center
            text-xs font-bold
            px-1
          "
          style={{
            backgroundColor: colors.error || '#EF4444',
            color: '#FFFFFF',
          }}
        >
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
```

---

## Chat Window

```typescript
// src/chat/components/window/ChatWindow.tsx

import React, { useEffect } from 'react';
import { Thread, Composer, ThreadPrimitive } from '@assistant-ui/react';
import { ChatHeader } from './ChatHeader';
import { ChatFooter } from './ChatFooter';
import { WelcomeScreen } from './WelcomeScreen';
import { CustomMessage } from '../message/CustomMessage';
import { Suggestions } from './Suggestions';
import type { FlowChatConfig } from '../../types';

interface ChatWindowProps {
  config: FlowChatConfig;
  isFullscreen?: boolean;
  onClose?: () => void;
  onFullscreen?: () => void;
  onNewMessage?: () => void;
}

export function ChatWindow({
  config,
  isFullscreen,
  onClose,
  onFullscreen,
  onNewMessage,
}: ChatWindowProps) {
  const { window: windowConfig, mobile } = config.display;
  const { welcome, suggestions, input } = config.messages;
  const { colors, typography, animations } = config.appearance;
  
  // Notify parent of new messages
  useEffect(() => {
    // This would hook into the runtime's message events
    // Implementation depends on assistant-ui's event system
  }, [onNewMessage]);
  
  return (
    <div
      className={`
        flex flex-col
        bg-[var(--fc-background)]
        text-[var(--fc-foreground)]
        shadow-2xl
        overflow-hidden
        ${isFullscreen 
          ? 'fixed inset-0 rounded-none' 
          : 'rounded-[var(--fc-border-radius)]'
        }
        ${animations.enabled ? 'animate-in fade-in slide-in-from-bottom-4' : ''}
      `}
      style={{
        '--fc-background': colors.background,
        '--fc-foreground': colors.foreground,
        '--fc-border-radius': `${windowConfig.borderRadius}px`,
        width: isFullscreen ? '100%' : `${windowConfig.width}px`,
        height: isFullscreen ? '100%' : `${windowConfig.height}px`,
        fontFamily: getFontFamily(typography.fontFamily),
      } as React.CSSProperties}
    >
      {/* Header */}
      <ChatHeader
        config={config}
        onClose={onClose}
        onFullscreen={onFullscreen}
        isFullscreen={isFullscreen}
      />
      
      {/* Thread */}
      <Thread.Root className="flex-1 overflow-hidden">
        <Thread.Viewport className="flex-1 overflow-y-auto p-4">
          {/* Welcome Screen */}
          <Thread.Empty>
            {welcome.enabled && (
              <WelcomeScreen
                title={welcome.title}
                message={welcome.message}
                avatarUrl={welcome.avatarUrl}
                config={config}
              />
            )}
            
            {/* Initial Suggestions */}
            {suggestions.enabled && suggestions.showAfterWelcome && (
              <Suggestions items={suggestions.items} config={config} />
            )}
          </Thread.Empty>
          
          {/* Messages */}
          <Thread.Messages 
            components={{
              Message: (props) => <CustomMessage {...props} config={config} />,
            }}
          />
          
          {/* Typing Indicator */}
          <Thread.TypingIndicator>
            <TypingIndicator 
              text={config.messages.system.typingIndicator}
              style={animations.typingIndicator}
            />
          </Thread.TypingIndicator>
        </Thread.Viewport>
        
        {/* Composer */}
        <div className="border-t border-[var(--fc-border)] p-3">
          {/* After-response suggestions */}
          {suggestions.enabled && suggestions.showAfterResponse && (
            <Thread.If hasContent>
              <Suggestions items={suggestions.items} config={config} />
            </Thread.If>
          )}
          
          <Composer.Root className="flex items-end gap-2">
            <Composer.Input
              placeholder={input.placeholder}
              maxLength={input.maxLength}
              className="
                flex-1 resize-none
                rounded-lg border
                px-3 py-2
                focus:outline-none focus:ring-2
                min-h-[40px] max-h-[120px]
              "
              style={{
                backgroundColor: colors.inputBackground,
                borderColor: colors.inputBorder,
                color: colors.inputForeground,
              }}
            />
            
            <Composer.Send
              className="
                p-2 rounded-lg
                transition-colors
                disabled:opacity-50
              "
              style={{
                backgroundColor: colors.primary,
                color: colors.primaryForeground,
              }}
            >
              <SendIcon />
            </Composer.Send>
          </Composer.Root>
          
          {/* Character count */}
          {input.showCharCount && (
            <Composer.Character className="text-xs text-gray-400 mt-1 text-right">
              {(count) => `${count}/${input.maxLength}`}
            </Composer.Character>
          )}
        </div>
      </Thread.Root>
      
      {/* Footer */}
      <ChatFooter config={config} />
    </div>
  );
}

function getFontFamily(font: string): string {
  const fontMap: Record<string, string> = {
    system: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    inter: '"Inter", sans-serif',
    roboto: '"Roboto", sans-serif',
    'open-sans': '"Open Sans", sans-serif',
    lato: '"Lato", sans-serif',
  };
  
  return fontMap[font] || font;
}

function SendIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
    </svg>
  );
}
```

### ChatHeader

```typescript
// src/chat/components/window/ChatHeader.tsx

import React from 'react';
import { X, Maximize2, Minimize2, RotateCcw } from 'lucide-react';
import { useThreadRuntime } from '@assistant-ui/react';
import type { FlowChatConfig } from '../../types';

interface ChatHeaderProps {
  config: FlowChatConfig;
  onClose?: () => void;
  onFullscreen?: () => void;
  isFullscreen?: boolean;
}

export function ChatHeader({
  config,
  onClose,
  onFullscreen,
  isFullscreen,
}: ChatHeaderProps) {
  const { colors } = config.appearance;
  const { welcome } = config.messages;
  const { chat } = config.features;
  
  const thread = useThreadRuntime();
  
  const handleNewConversation = () => {
    // Clear messages and start fresh
    // This would clear the session
    localStorage.removeItem(`flowchat_session_${config.id}`);
    window.location.reload();
  };
  
  return (
    <div
      className="
        flex items-center justify-between
        px-4 py-3
        border-b
      "
      style={{
        backgroundColor: colors.headerBackground,
        color: colors.headerForeground,
        borderColor: colors.border,
      }}
    >
      {/* Title */}
      <div className="flex items-center gap-3">
        {config.appearance.avatar.enabled && (
          <Avatar config={config} size={32} />
        )}
        <div>
          <h3 className="font-semibold text-sm">
            {welcome.title}
          </h3>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center gap-1">
        {/* New conversation */}
        <button
          onClick={handleNewConversation}
          className="
            p-2 rounded-lg
            opacity-70 hover:opacity-100
            transition-opacity
          "
          title="New conversation"
        >
          <RotateCcw size={16} />
        </button>
        
        {/* Fullscreen toggle */}
        {onFullscreen && (
          <button
            onClick={onFullscreen}
            className="
              p-2 rounded-lg
              opacity-70 hover:opacity-100
              transition-opacity
            "
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
          </button>
        )}
        
        {/* Close */}
        {onClose && (
          <button
            onClick={onClose}
            className="
              p-2 rounded-lg
              opacity-70 hover:opacity-100
              transition-opacity
            "
            title="Close"
          >
            <X size={16} />
          </button>
        )}
      </div>
    </div>
  );
}

function Avatar({ config, size }: { config: FlowChatConfig; size: number }) {
  const { avatar } = config.appearance;
  
  if (avatar.type === 'none') return null;
  
  const shapeClass = {
    circle: 'rounded-full',
    square: 'rounded-none',
    rounded: 'rounded-lg',
  }[avatar.shape || 'circle'];
  
  if (avatar.type === 'image' && avatar.imageUrl) {
    return (
      <img
        src={avatar.imageUrl}
        alt="Bot avatar"
        className={`${shapeClass}`}
        style={{ width: size, height: size }}
      />
    );
  }
  
  // Icon avatar
  return (
    <div
      className={`
        ${shapeClass}
        flex items-center justify-center
        bg-white/20
      `}
      style={{ width: size, height: size }}
    >
      <BotIcon size={size * 0.6} />
    </div>
  );
}

function BotIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
  );
}
```

### WelcomeScreen

```typescript
// src/chat/components/window/WelcomeScreen.tsx

import React from 'react';
import { Markdown } from '../message/Markdown';
import type { FlowChatConfig } from '../../types';

interface WelcomeScreenProps {
  title: string;
  message: string;
  avatarUrl?: string;
  config: FlowChatConfig;
}

export function WelcomeScreen({
  title,
  message,
  avatarUrl,
  config,
}: WelcomeScreenProps) {
  const { colors } = config.appearance;
  
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
      {/* Avatar */}
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={title}
          className="w-16 h-16 rounded-full mb-4"
        />
      )}
      
      {/* Welcome message */}
      <div
        className="
          rounded-2xl p-4
          max-w-[90%]
        "
        style={{
          backgroundColor: colors.botBubble,
          color: colors.botBubbleForeground,
        }}
      >
        <Markdown content={message} config={config} />
      </div>
    </div>
  );
}
```

### Suggestions

```typescript
// src/chat/components/window/Suggestions.tsx

import React from 'react';
import { useComposerRuntime } from '@assistant-ui/react';
import type { FlowChatConfig } from '../../types';

interface SuggestionsProps {
  items: string[];
  config: FlowChatConfig;
}

export function Suggestions({ items, config }: SuggestionsProps) {
  const composer = useComposerRuntime();
  const { colors } = config.appearance;
  
  if (!items.length) return null;
  
  const handleClick = (suggestion: string) => {
    composer.setText(suggestion);
    composer.send();
  };
  
  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {items.slice(0, 4).map((item, index) => (
        <button
          key={index}
          onClick={() => handleClick(item)}
          className="
            px-3 py-1.5
            text-sm
            rounded-full
            border
            transition-colors
            hover:bg-opacity-10
          "
          style={{
            borderColor: colors.primary,
            color: colors.primary,
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}
```

---

## Custom Message Component

```typescript
// src/chat/components/message/CustomMessage.tsx

import React from 'react';
import { Message, MessagePrimitive } from '@assistant-ui/react';
import { Markdown } from './Markdown';
import { Copy, Volume2, RefreshCw } from 'lucide-react';
import type { FlowChatConfig } from '../../types';

interface CustomMessageProps {
  config: FlowChatConfig;
}

export function CustomMessage({ config }: CustomMessageProps) {
  const { colors, avatar } = config.appearance;
  const { chat, speech } = config.features;
  
  return (
    <MessagePrimitive.Root className="group flex gap-3 mb-4">
      <MessagePrimitive.If user>
        <div className="flex-1 flex justify-end">
          <div
            className="
              max-w-[80%]
              rounded-2xl rounded-br-sm
              px-4 py-2
            "
            style={{
              backgroundColor: colors.userBubble,
              color: colors.userBubbleForeground,
            }}
          >
            <MessagePrimitive.Content />
          </div>
        </div>
      </MessagePrimitive.If>
      
      <MessagePrimitive.If assistant>
        {/* Avatar */}
        {avatar.enabled && (
          <div className="flex-shrink-0">
            <Avatar config={config} size={avatar.size || 32} />
          </div>
        )}
        
        <div className="flex-1">
          <div
            className="
              max-w-[80%]
              rounded-2xl rounded-bl-sm
              px-4 py-2
            "
            style={{
              backgroundColor: colors.botBubble,
              color: colors.botBubbleForeground,
            }}
          >
            <MessagePrimitive.Content
              components={{
                Text: ({ text }) => <Markdown content={text} config={config} />,
              }}
            />
          </div>
          
          {/* Actions */}
          <div className="
            flex gap-1 mt-1
            opacity-0 group-hover:opacity-100
            transition-opacity
          ">
            {chat.allowCopy && (
              <CopyButton />
            )}
            
            {speech.textToSpeech && (
              <SpeakButton />
            )}
            
            {chat.allowRegenerate && (
              <RegenerateButton />
            )}
          </div>
        </div>
      </MessagePrimitive.If>
    </MessagePrimitive.Root>
  );
}

function CopyButton() {
  const [copied, setCopied] = React.useState(false);
  
  const handleCopy = async () => {
    // Copy message text
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded hover:bg-gray-200 text-gray-500"
      title={copied ? 'Copied!' : 'Copy'}
    >
      <Copy size={14} />
    </button>
  );
}

function SpeakButton() {
  return (
    <button
      className="p-1 rounded hover:bg-gray-200 text-gray-500"
      title="Read aloud"
    >
      <Volume2 size={14} />
    </button>
  );
}

function RegenerateButton() {
  return (
    <MessagePrimitive.If lastOrHover>
      <button
        className="p-1 rounded hover:bg-gray-200 text-gray-500"
        title="Regenerate response"
      >
        <RefreshCw size={14} />
      </button>
    </MessagePrimitive.If>
  );
}
```

---

## Markdown Renderer

```typescript
// src/chat/components/message/Markdown.tsx

import React, { useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark, oneLight } from 'react-syntax-highlighter/dist/esm/styles/prism';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import type { FlowChatConfig } from '../../types';

interface MarkdownProps {
  content: string;
  config: FlowChatConfig;
}

export function Markdown({ content, config }: MarkdownProps) {
  const { chat } = config.features;
  const { theme } = config.appearance;
  
  const remarkPlugins = useMemo(() => {
    const plugins = [remarkGfm];
    if (chat.enableLatex) {
      plugins.push(remarkMath);
    }
    return plugins;
  }, [chat.enableLatex]);
  
  const rehypePlugins = useMemo(() => {
    const plugins = [];
    if (chat.enableLatex) {
      plugins.push(rehypeKatex);
    }
    return plugins;
  }, [chat.enableLatex]);
  
  return (
    <ReactMarkdown
      remarkPlugins={remarkPlugins}
      rehypePlugins={rehypePlugins}
      className="prose prose-sm max-w-none"
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          
          if (!inline && match && chat.enableCodeHighlight) {
            return (
              <SyntaxHighlighter
                style={theme === 'dark' ? oneDark : oneLight}
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
        
        // Custom link handling
        a({ href, children }) {
          return (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
```

---

## Typing Indicator

```typescript
// src/chat/components/window/TypingIndicator.tsx

import React from 'react';

interface TypingIndicatorProps {
  text: string;
  style: 'dots' | 'pulse' | 'wave';
}

export function TypingIndicator({ text, style }: TypingIndicatorProps) {
  return (
    <div className="flex items-center gap-2 text-gray-500 text-sm">
      <div className="flex gap-1">
        {style === 'dots' && <DotsAnimation />}
        {style === 'pulse' && <PulseAnimation />}
        {style === 'wave' && <WaveAnimation />}
      </div>
      <span>{text}</span>
    </div>
  );
}

function DotsAnimation() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </div>
  );
}

function PulseAnimation() {
  return (
    <div className="w-6 h-6 bg-gray-300 rounded-full animate-pulse" />
  );
}

function WaveAnimation() {
  return (
    <div className="flex gap-0.5">
      {[0, 1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="w-1 h-3 bg-gray-400 rounded-full animate-wave"
          style={{ animationDelay: `${i * 0.1}s` }}
        />
      ))}
    </div>
  );
}
```

---

## Custom Hooks

```typescript
// src/chat/hooks/useEscapeKey.ts
import { useEffect } from 'react';

export function useEscapeKey(callback: () => void) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        callback();
      }
    };
    
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [callback]);
}

// src/chat/hooks/useClickOutside.ts
import { useEffect, type RefObject } from 'react';

export function useClickOutside(
  ref: RefObject<HTMLElement>,
  callback: () => void
) {
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        callback();
      }
    };
    
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [ref, callback]);
}

// src/chat/hooks/useLocalStorage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch {
      return initialValue;
    }
  });
  
  const setValue = (value: T) => {
    try {
      setStoredValue(value);
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };
  
  return [storedValue, setValue];
}
```

---

## Next Document

→ **06-STYLING-THEMING.md** - CSS architecture and themes
