# FlowChat: Bubble System Specification

## Overview

The bubble system provides a floating chat interface that persists across page navigation. It consists of a trigger button and an expandable panel, with advanced features including state persistence, auto-open triggers, unread badges, and multiple view modes.

## Bubble Architecture

### Component Structure

```
┌─────────────────────────────────────────────────────────────────┐
│                         BubbleRoot                               │
│  (Portal to document.body, manages global state)                │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              ▼                               ▼
┌─────────────────────────┐     ┌─────────────────────────────────┐
│     BubbleTrigger       │     │         BubblePanel             │
│  (Collapsed state)      │     │      (Expanded state)           │
│  - Icon/Avatar          │     │  ┌─────────────────────────┐   │
│  - Unread badge         │     │  │    PanelHeader          │   │
│  - Pulse animation      │     │  │  - Title & controls     │   │
│  - Tooltip              │     │  └─────────────────────────┘   │
└─────────────────────────┘     │  ┌─────────────────────────┐   │
                                │  │    ChatContainer        │   │
                                │  │  - Messages, Composer   │   │
                                │  └─────────────────────────┘   │
                                │  ┌─────────────────────────┐   │
                                │  │  InstanceSwitcher       │   │
                                │  │  (if multiple)          │   │
                                │  └─────────────────────────┘   │
                                └─────────────────────────────────┘
```

### State Management

```typescript
// src/contexts/BubbleContext.tsx

interface BubbleState {
  // View state
  isOpen: boolean;
  viewMode: 'collapsed' | 'panel' | 'maximized' | 'fullscreen';
  
  // Position
  position: 'bottom-right' | 'bottom-left' | 'custom';
  offsetX: number;
  offsetY: number;
  
  // Panel dimensions (for resizable panel)
  panelWidth: number;
  panelHeight: number;
  
  // Instance management
  activeInstanceId: string | null;
  availableInstances: string[];
  
  // Notifications
  unreadCount: number;
  hasNewMessage: boolean;
  
  // Interaction
  isDragging: boolean;
  isResizing: boolean;
  
  // Auto-open
  autoOpenTriggered: boolean;
  autoOpenDismissed: boolean;
}

interface BubbleActions {
  // View controls
  open: () => void;
  close: () => void;
  toggle: () => void;
  minimize: () => void;
  maximize: () => void;
  enterFullscreen: () => void;
  exitFullscreen: () => void;
  
  // Instance management
  switchInstance: (instanceId: string) => void;
  
  // Notifications
  markAsRead: () => void;
  incrementUnread: () => void;
  
  // Position
  setPosition: (position: BubblePosition) => void;
  
  // Auto-open
  dismissAutoOpen: () => void;
}
```

## Bubble States

### State Diagram

```
                              ┌─────────────┐
                              │  Collapsed  │◄──────────────────┐
                              │  (Trigger)  │                   │
                              └──────┬──────┘                   │
                                     │ click                    │
                                     ▼                          │
                              ┌─────────────┐                   │
              ┌───────────────│    Panel    │───────────────┐   │
              │ maximize      │   (Open)    │    minimize   │   │
              ▼               └──────┬──────┘               │   │
       ┌─────────────┐               │                      │   │
       │  Maximized  │               │ fullscreen           ▼   │
       │   (Large)   │               ▼                   close  │
       └──────┬──────┘        ┌─────────────┐               │   │
              │               │ Fullscreen  │               │   │
              │ restore       │  (Modal)    │               │   │
              │               └──────┬──────┘               │   │
              │                      │ exit                 │   │
              └──────────────────────┴──────────────────────┘   │
                                     │                          │
                                     └──────────────────────────┘
```

### State Definitions

| State | Description | Dimensions | Features |
|-------|-------------|------------|----------|
| `collapsed` | Only trigger button visible | 50-70px button | Badge, tooltip, pulse |
| `panel` | Standard chat panel | 380×550px default | Full chat, resize handle |
| `maximized` | Larger panel | 600×700px or custom | Expanded view |
| `fullscreen` | Covers viewport | 100vw × 100vh | Modal overlay |

## Component Implementations

### BubbleRoot

```tsx
// src/components/bubble/BubbleRoot.tsx

import { createPortal } from 'react-dom';
import { useEffect, useState, useCallback } from 'react';
import { BubbleProvider, useBubble } from '../../contexts/BubbleContext';
import { BubbleTrigger } from './BubbleTrigger';
import { BubblePanel } from './BubblePanel';
import { useAutoOpen } from '../../hooks/useAutoOpen';
import { useBubblePersistence } from '../../hooks/useBubblePersistence';

interface BubbleRootProps {
  instances: string[];
  defaultInstance: string;
  config: BubbleConfig;
}

export function BubbleRoot({ instances, defaultInstance, config }: BubbleRootProps) {
  const [mounted, setMounted] = useState(false);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  useEffect(() => {
    // Create portal container
    let container = document.getElementById('flowchat-bubble-root');
    
    if (!container) {
      container = document.createElement('div');
      container.id = 'flowchat-bubble-root';
      container.setAttribute('data-flowchat-bubble', 'true');
      document.body.appendChild(container);
    }
    
    setPortalContainer(container);
    setMounted(true);
    
    return () => {
      // Don't remove container on unmount - might be used by other instances
    };
  }, []);
  
  if (!mounted || !portalContainer) {
    return null;
  }
  
  return createPortal(
    <BubbleProvider
      instances={instances}
      defaultInstance={defaultInstance}
      config={config}
    >
      <BubbleContent config={config} />
    </BubbleProvider>,
    portalContainer
  );
}

function BubbleContent({ config }: { config: BubbleConfig }) {
  const { state, actions } = useBubble();
  
  // Handle auto-open triggers
  useAutoOpen({
    enabled: config.autoOpen.enabled,
    delay: config.autoOpen.delay,
    triggers: config.autoOpen.triggers,
    onTrigger: actions.open,
  });
  
  // Persist state across page loads
  useBubblePersistence();
  
  // Handle escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (state.viewMode === 'fullscreen') {
          actions.exitFullscreen();
        } else if (state.isOpen) {
          actions.close();
        }
      }
    }
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [state.viewMode, state.isOpen, actions]);
  
  return (
    <div
      className={`flowchat-bubble flowchat-bubble--${state.position}`}
      style={{
        '--bubble-offset-x': `${config.offsetX}px`,
        '--bubble-offset-y': `${config.offsetY}px`,
      } as React.CSSProperties}
    >
      {/* Always render trigger (visible when collapsed) */}
      <BubbleTrigger
        visible={!state.isOpen}
        unreadCount={state.unreadCount}
        config={config.trigger}
        onClick={actions.toggle}
      />
      
      {/* Render panel when open */}
      {state.isOpen && (
        <BubblePanel
          viewMode={state.viewMode}
          activeInstanceId={state.activeInstanceId}
          availableInstances={state.availableInstances}
          config={config.panel}
          onClose={actions.close}
          onMinimize={actions.minimize}
          onMaximize={actions.maximize}
          onFullscreen={actions.enterFullscreen}
          onExitFullscreen={actions.exitFullscreen}
          onSwitchInstance={actions.switchInstance}
        />
      )}
    </div>
  );
}
```

### BubbleTrigger

```tsx
// src/components/bubble/BubbleTrigger.tsx

import { forwardRef } from 'react';
import { MessageCircle } from 'lucide-react';

interface BubbleTriggerProps {
  visible: boolean;
  unreadCount: number;
  config: TriggerConfig;
  onClick: () => void;
}

export const BubbleTrigger = forwardRef<HTMLButtonElement, BubbleTriggerProps>(
  function BubbleTrigger({ visible, unreadCount, config, onClick }, ref) {
    if (!visible) {
      return null;
    }
    
    const hasUnread = unreadCount > 0;
    
    return (
      <button
        ref={ref}
        type="button"
        className={`
          flowchat-bubble-trigger
          ${hasUnread ? 'flowchat-bubble-trigger--has-unread' : ''}
          ${config.pulse ? 'flowchat-bubble-trigger--pulse' : ''}
        `}
        onClick={onClick}
        aria-label={config.tooltip || 'Open chat'}
        title={config.tooltip}
        style={{
          '--trigger-size': config.size,
          '--trigger-bg': config.backgroundColor,
          '--trigger-color': config.iconColor,
        } as React.CSSProperties}
      >
        {/* Icon or Avatar */}
        {config.avatarUrl ? (
          <img
            src={config.avatarUrl}
            alt=""
            className="flowchat-bubble-trigger__avatar"
          />
        ) : config.iconUrl ? (
          <img
            src={config.iconUrl}
            alt=""
            className="flowchat-bubble-trigger__icon"
          />
        ) : (
          <MessageCircle className="flowchat-bubble-trigger__icon-default" />
        )}
        
        {/* Unread Badge */}
        {hasUnread && (
          <span className="flowchat-bubble-trigger__badge" aria-live="polite">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    );
  }
);
```

### BubblePanel

```tsx
// src/components/bubble/BubblePanel.tsx

import { useRef, useEffect, useState } from 'react';
import { X, Minus, Maximize2, Minimize2, ArrowsMaximize } from 'lucide-react';
import { ChatContainer } from '../chat/ChatContainer';
import { InstanceSwitcher } from './InstanceSwitcher';
import { useResizable } from '../../hooks/useResizable';

interface BubblePanelProps {
  viewMode: 'panel' | 'maximized' | 'fullscreen';
  activeInstanceId: string | null;
  availableInstances: string[];
  config: PanelConfig;
  onClose: () => void;
  onMinimize: () => void;
  onMaximize: () => void;
  onFullscreen: () => void;
  onExitFullscreen: () => void;
  onSwitchInstance: (id: string) => void;
}

export function BubblePanel({
  viewMode,
  activeInstanceId,
  availableInstances,
  config,
  onClose,
  onMinimize,
  onMaximize,
  onFullscreen,
  onExitFullscreen,
  onSwitchInstance,
}: BubblePanelProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  
  // Resizable panel (only in panel mode)
  const { size, handleMouseDown } = useResizable({
    enabled: viewMode === 'panel' && config.resizable,
    minWidth: config.minWidth,
    minHeight: config.minHeight,
    maxWidth: config.maxWidth,
    maxHeight: config.maxHeight,
    initialWidth: config.defaultWidth,
    initialHeight: config.defaultHeight,
  });
  
  // Focus trap for fullscreen
  useEffect(() => {
    if (viewMode === 'fullscreen' && panelRef.current) {
      panelRef.current.focus();
    }
  }, [viewMode]);
  
  // Prevent body scroll in fullscreen
  useEffect(() => {
    if (viewMode === 'fullscreen') {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [viewMode]);
  
  const isFullscreen = viewMode === 'fullscreen';
  const isMaximized = viewMode === 'maximized';
  const showInstanceSwitcher = availableInstances.length > 1;
  
  return (
    <>
      {/* Fullscreen overlay */}
      {isFullscreen && (
        <div
          className="flowchat-bubble-overlay"
          onClick={onExitFullscreen}
          aria-hidden="true"
        />
      )}
      
      <div
        ref={panelRef}
        className={`
          flowchat-bubble-panel
          flowchat-bubble-panel--${viewMode}
        `}
        style={
          viewMode === 'panel'
            ? {
                width: size.width,
                height: size.height,
              }
            : undefined
        }
        role="dialog"
        aria-modal={isFullscreen}
        aria-label="Chat window"
        tabIndex={-1}
      >
        {/* Panel Header */}
        <div className="flowchat-bubble-panel__header">
          <div className="flowchat-bubble-panel__title">
            {config.title}
            {config.subtitle && (
              <span className="flowchat-bubble-panel__subtitle">
                {config.subtitle}
              </span>
            )}
          </div>
          
          <div className="flowchat-bubble-panel__controls">
            {/* Minimize (to trigger) */}
            <button
              type="button"
              className="flowchat-bubble-panel__control"
              onClick={onMinimize}
              aria-label="Minimize"
              title="Minimize"
            >
              <Minus size={16} />
            </button>
            
            {/* Maximize / Restore */}
            {!isFullscreen && (
              <button
                type="button"
                className="flowchat-bubble-panel__control"
                onClick={isMaximized ? onMinimize : onMaximize}
                aria-label={isMaximized ? 'Restore' : 'Maximize'}
                title={isMaximized ? 'Restore' : 'Maximize'}
              >
                {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
              </button>
            )}
            
            {/* Fullscreen */}
            <button
              type="button"
              className="flowchat-bubble-panel__control"
              onClick={isFullscreen ? onExitFullscreen : onFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
              title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
            >
              <ArrowsMaximize size={16} />
            </button>
            
            {/* Close */}
            <button
              type="button"
              className="flowchat-bubble-panel__control flowchat-bubble-panel__control--close"
              onClick={onClose}
              aria-label="Close"
              title="Close"
            >
              <X size={16} />
            </button>
          </div>
        </div>
        
        {/* Instance Switcher */}
        {showInstanceSwitcher && (
          <InstanceSwitcher
            instances={availableInstances}
            activeInstance={activeInstanceId}
            onSwitch={onSwitchInstance}
          />
        )}
        
        {/* Chat Content */}
        <div className="flowchat-bubble-panel__content">
          {activeInstanceId && (
            <ChatContainer
              instanceId={activeInstanceId}
              compact={viewMode === 'panel'}
            />
          )}
        </div>
        
        {/* Resize Handle */}
        {viewMode === 'panel' && config.resizable && (
          <div
            className="flowchat-bubble-panel__resize-handle"
            onMouseDown={handleMouseDown}
            aria-hidden="true"
          />
        )}
      </div>
    </>
  );
}
```

### InstanceSwitcher

```tsx
// src/components/bubble/InstanceSwitcher.tsx

import { useInstanceConfig } from '../../hooks/useInstanceConfig';

interface InstanceSwitcherProps {
  instances: string[];
  activeInstance: string | null;
  onSwitch: (instanceId: string) => void;
}

export function InstanceSwitcher({
  instances,
  activeInstance,
  onSwitch,
}: InstanceSwitcherProps) {
  return (
    <div className="flowchat-instance-switcher" role="tablist">
      {instances.map((instanceId) => (
        <InstanceTab
          key={instanceId}
          instanceId={instanceId}
          isActive={instanceId === activeInstance}
          onSelect={() => onSwitch(instanceId)}
        />
      ))}
    </div>
  );
}

interface InstanceTabProps {
  instanceId: string;
  isActive: boolean;
  onSelect: () => void;
}

function InstanceTab({ instanceId, isActive, onSelect }: InstanceTabProps) {
  const config = useInstanceConfig(instanceId);
  
  return (
    <button
      type="button"
      role="tab"
      className={`
        flowchat-instance-tab
        ${isActive ? 'flowchat-instance-tab--active' : ''}
      `}
      aria-selected={isActive}
      onClick={onSelect}
    >
      {config?.appearance?.avatar && (
        <img
          src={config.appearance.avatar}
          alt=""
          className="flowchat-instance-tab__avatar"
        />
      )}
      <span className="flowchat-instance-tab__name">
        {config?.name || instanceId}
      </span>
    </button>
  );
}
```

## Auto-Open System

### Auto-Open Triggers

```typescript
// src/hooks/useAutoOpen.ts

import { useEffect, useRef, useCallback } from 'react';

export type AutoOpenTrigger =
  | { type: 'delay'; delay: number }
  | { type: 'scroll'; percentage: number }
  | { type: 'exit-intent' }
  | { type: 'idle'; timeout: number }
  | { type: 'page-count'; count: number }
  | { type: 'time-on-site'; seconds: number }
  | { type: 'element-visible'; selector: string };

interface UseAutoOpenOptions {
  enabled: boolean;
  delay: number;
  triggers: AutoOpenTrigger[];
  onTrigger: () => void;
  sessionKey?: string;
}

export function useAutoOpen({
  enabled,
  delay,
  triggers,
  onTrigger,
  sessionKey = 'flowchat_auto_open',
}: UseAutoOpenOptions) {
  const triggeredRef = useRef(false);
  const dismissedRef = useRef(false);
  
  // Check if already dismissed this session
  useEffect(() => {
    const dismissed = sessionStorage.getItem(`${sessionKey}_dismissed`);
    dismissedRef.current = dismissed === 'true';
  }, [sessionKey]);
  
  // Trigger handler
  const handleTrigger = useCallback(() => {
    if (triggeredRef.current || dismissedRef.current || !enabled) {
      return;
    }
    
    triggeredRef.current = true;
    
    // Delay before opening
    setTimeout(() => {
      onTrigger();
    }, delay);
  }, [enabled, delay, onTrigger]);
  
  // Set up trigger listeners
  useEffect(() => {
    if (!enabled || triggeredRef.current || dismissedRef.current) {
      return;
    }
    
    const cleanups: (() => void)[] = [];
    
    for (const trigger of triggers) {
      switch (trigger.type) {
        case 'delay': {
          const timeoutId = setTimeout(handleTrigger, trigger.delay);
          cleanups.push(() => clearTimeout(timeoutId));
          break;
        }
        
        case 'scroll': {
          const handleScroll = () => {
            const scrollPercent =
              (window.scrollY /
                (document.documentElement.scrollHeight - window.innerHeight)) *
              100;
            
            if (scrollPercent >= trigger.percentage) {
              handleTrigger();
            }
          };
          
          window.addEventListener('scroll', handleScroll, { passive: true });
          cleanups.push(() => window.removeEventListener('scroll', handleScroll));
          break;
        }
        
        case 'exit-intent': {
          const handleMouseLeave = (e: MouseEvent) => {
            if (e.clientY <= 0) {
              handleTrigger();
            }
          };
          
          document.addEventListener('mouseleave', handleMouseLeave);
          cleanups.push(() =>
            document.removeEventListener('mouseleave', handleMouseLeave)
          );
          break;
        }
        
        case 'idle': {
          let idleTimeout: ReturnType<typeof setTimeout>;
          
          const resetIdle = () => {
            clearTimeout(idleTimeout);
            idleTimeout = setTimeout(handleTrigger, trigger.timeout);
          };
          
          const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
          events.forEach((event) =>
            document.addEventListener(event, resetIdle, { passive: true })
          );
          
          resetIdle(); // Start idle timer
          
          cleanups.push(() => {
            clearTimeout(idleTimeout);
            events.forEach((event) =>
              document.removeEventListener(event, resetIdle)
            );
          });
          break;
        }
        
        case 'page-count': {
          const pageCount = parseInt(
            sessionStorage.getItem(`${sessionKey}_pages`) || '0',
            10
          );
          const newCount = pageCount + 1;
          sessionStorage.setItem(`${sessionKey}_pages`, String(newCount));
          
          if (newCount >= trigger.count) {
            handleTrigger();
          }
          break;
        }
        
        case 'time-on-site': {
          const startTime = parseInt(
            sessionStorage.getItem(`${sessionKey}_start`) || '0',
            10
          );
          
          if (!startTime) {
            sessionStorage.setItem(`${sessionKey}_start`, String(Date.now()));
          } else {
            const elapsed = (Date.now() - startTime) / 1000;
            if (elapsed >= trigger.seconds) {
              handleTrigger();
            } else {
              const remaining = (trigger.seconds - elapsed) * 1000;
              const timeoutId = setTimeout(handleTrigger, remaining);
              cleanups.push(() => clearTimeout(timeoutId));
            }
          }
          break;
        }
        
        case 'element-visible': {
          const observer = new IntersectionObserver(
            (entries) => {
              if (entries.some((entry) => entry.isIntersecting)) {
                handleTrigger();
                observer.disconnect();
              }
            },
            { threshold: 0.5 }
          );
          
          const element = document.querySelector(trigger.selector);
          if (element) {
            observer.observe(element);
            cleanups.push(() => observer.disconnect());
          }
          break;
        }
      }
    }
    
    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [enabled, triggers, handleTrigger, sessionKey]);
  
  // Dismiss handler
  const dismiss = useCallback(() => {
    dismissedRef.current = true;
    sessionStorage.setItem(`${sessionKey}_dismissed`, 'true');
  }, [sessionKey]);
  
  return { dismiss };
}
```

### Auto-Open Configuration

```typescript
// Types for admin configuration

interface AutoOpenConfig {
  enabled: boolean;
  delay: number; // Delay before opening after trigger
  
  triggers: AutoOpenTrigger[];
  
  // Conditions
  conditions: {
    // Only trigger for certain user states
    loggedInOnly: boolean;
    guestOnly: boolean;
    
    // Don't trigger if user has interacted
    skipIfInteracted: boolean;
    
    // Don't trigger on certain pages
    excludePages: string[];
    
    // Only trigger on certain pages
    includePages: string[];
    
    // Mobile behavior
    disableOnMobile: boolean;
  };
  
  // Frequency
  frequency: {
    // Once per session
    oncePerSession: boolean;
    
    // Once per day
    oncePerDay: boolean;
    
    // Max times to show
    maxOccurrences: number;
  };
}
```

## State Persistence

### Persistence Hook

```typescript
// src/hooks/useBubblePersistence.ts

import { useEffect } from 'react';
import { useBubble } from '../contexts/BubbleContext';

const STORAGE_KEY = 'flowchat_bubble_state';

interface PersistedState {
  isOpen: boolean;
  viewMode: string;
  activeInstanceId: string | null;
  panelWidth?: number;
  panelHeight?: number;
}

export function useBubblePersistence() {
  const { state, actions } = useBubble();
  
  // Restore state on mount
  useEffect(() => {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    
    if (stored) {
      try {
        const parsed: PersistedState = JSON.parse(stored);
        
        // Restore state
        if (parsed.isOpen) {
          actions.open();
        }
        
        if (parsed.activeInstanceId) {
          actions.switchInstance(parsed.activeInstanceId);
        }
        
        // Restore panel dimensions if available
        if (parsed.panelWidth && parsed.panelHeight) {
          actions.setPanelSize(parsed.panelWidth, parsed.panelHeight);
        }
      } catch {
        // Invalid stored state, ignore
      }
    }
  }, []);
  
  // Persist state on change
  useEffect(() => {
    const stateToStore: PersistedState = {
      isOpen: state.isOpen,
      viewMode: state.viewMode,
      activeInstanceId: state.activeInstanceId,
      panelWidth: state.panelWidth,
      panelHeight: state.panelHeight,
    };
    
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToStore));
  }, [
    state.isOpen,
    state.viewMode,
    state.activeInstanceId,
    state.panelWidth,
    state.panelHeight,
  ]);
  
  // Save to localStorage for cross-tab sync (optional)
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (e.key === `${STORAGE_KEY}_sync` && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (parsed.action === 'close') {
            actions.close();
          }
        } catch {
          // Ignore
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [actions]);
}
```

## Styling

### CSS Variables

```css
/* src/styles/bubble.css */

.flowchat-bubble {
  /* Position */
  --bubble-offset-x: 20px;
  --bubble-offset-y: 20px;
  
  /* Trigger */
  --trigger-size: 60px;
  --trigger-bg: var(--flowchat-primary, #0066cc);
  --trigger-color: #ffffff;
  --trigger-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  --trigger-hover-scale: 1.05;
  
  /* Badge */
  --badge-bg: #ef4444;
  --badge-color: #ffffff;
  --badge-size: 20px;
  
  /* Panel */
  --panel-width: 380px;
  --panel-height: 550px;
  --panel-min-width: 300px;
  --panel-min-height: 400px;
  --panel-max-width: 600px;
  --panel-max-height: 800px;
  --panel-bg: var(--flowchat-bg, #ffffff);
  --panel-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  --panel-border-radius: 16px;
  
  /* Maximized */
  --maximized-width: 600px;
  --maximized-height: 700px;
  
  /* Animation */
  --animation-duration: 200ms;
  --animation-easing: cubic-bezier(0.4, 0, 0.2, 1);
  
  /* Z-index */
  --bubble-z-index: 999999;
}
```

### Base Styles

```css
/* Position container */
.flowchat-bubble {
  position: fixed;
  z-index: var(--bubble-z-index);
  font-family: var(--flowchat-font-family, system-ui, sans-serif);
}

.flowchat-bubble--bottom-right {
  right: var(--bubble-offset-x);
  bottom: var(--bubble-offset-y);
}

.flowchat-bubble--bottom-left {
  left: var(--bubble-offset-x);
  bottom: var(--bubble-offset-y);
}

/* Trigger Button */
.flowchat-bubble-trigger {
  width: var(--trigger-size);
  height: var(--trigger-size);
  border-radius: 50%;
  border: none;
  background: var(--trigger-bg);
  color: var(--trigger-color);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--trigger-shadow);
  transition: transform var(--animation-duration) var(--animation-easing),
              box-shadow var(--animation-duration) var(--animation-easing);
}

.flowchat-bubble-trigger:hover {
  transform: scale(var(--trigger-hover-scale));
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.flowchat-bubble-trigger:focus-visible {
  outline: 2px solid var(--trigger-bg);
  outline-offset: 2px;
}

/* Trigger Icon */
.flowchat-bubble-trigger__icon-default {
  width: 28px;
  height: 28px;
}

.flowchat-bubble-trigger__avatar {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  object-fit: cover;
}

/* Pulse Animation */
.flowchat-bubble-trigger--pulse::before {
  content: '';
  position: absolute;
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: var(--trigger-bg);
  animation: flowchat-pulse 2s ease-out infinite;
  z-index: -1;
}

@keyframes flowchat-pulse {
  0% {
    transform: scale(1);
    opacity: 0.5;
  }
  100% {
    transform: scale(1.5);
    opacity: 0;
  }
}

/* Unread Badge */
.flowchat-bubble-trigger__badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: var(--badge-size);
  height: var(--badge-size);
  padding: 0 6px;
  border-radius: var(--badge-size);
  background: var(--badge-bg);
  color: var(--badge-color);
  font-size: 12px;
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: flowchat-badge-pop 200ms var(--animation-easing);
}

@keyframes flowchat-badge-pop {
  0% {
    transform: scale(0);
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}
```

### Panel Styles

```css
/* Panel Container */
.flowchat-bubble-panel {
  position: absolute;
  bottom: 0;
  background: var(--panel-bg);
  border-radius: var(--panel-border-radius);
  box-shadow: var(--panel-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: flowchat-panel-enter var(--animation-duration) var(--animation-easing);
}

.flowchat-bubble--bottom-right .flowchat-bubble-panel {
  right: 0;
  transform-origin: bottom right;
}

.flowchat-bubble--bottom-left .flowchat-bubble-panel {
  left: 0;
  transform-origin: bottom left;
}

@keyframes flowchat-panel-enter {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

/* Panel Modes */
.flowchat-bubble-panel--panel {
  width: var(--panel-width);
  height: var(--panel-height);
}

.flowchat-bubble-panel--maximized {
  width: var(--maximized-width);
  height: var(--maximized-height);
}

.flowchat-bubble-panel--fullscreen {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100vw;
  height: 100vh;
  border-radius: 0;
  z-index: calc(var(--bubble-z-index) + 1);
}

/* Panel Header */
.flowchat-bubble-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--flowchat-border, #e5e7eb);
  flex-shrink: 0;
}

.flowchat-bubble-panel__title {
  font-weight: 600;
  font-size: 15px;
  color: var(--flowchat-text, #111827);
}

.flowchat-bubble-panel__subtitle {
  display: block;
  font-size: 12px;
  font-weight: 400;
  color: var(--flowchat-text-secondary, #6b7280);
  margin-top: 2px;
}

/* Panel Controls */
.flowchat-bubble-panel__controls {
  display: flex;
  gap: 4px;
}

.flowchat-bubble-panel__control {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--flowchat-text-secondary, #6b7280);
  transition: background-color 150ms, color 150ms;
}

.flowchat-bubble-panel__control:hover {
  background: var(--flowchat-hover, #f3f4f6);
  color: var(--flowchat-text, #111827);
}

.flowchat-bubble-panel__control--close:hover {
  background: #fee2e2;
  color: #dc2626;
}

/* Panel Content */
.flowchat-bubble-panel__content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Resize Handle */
.flowchat-bubble-panel__resize-handle {
  position: absolute;
  width: 16px;
  height: 16px;
  cursor: nwse-resize;
}

.flowchat-bubble--bottom-right .flowchat-bubble-panel__resize-handle {
  top: 0;
  left: 0;
}

.flowchat-bubble--bottom-left .flowchat-bubble-panel__resize-handle {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

/* Overlay for fullscreen */
.flowchat-bubble-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: var(--bubble-z-index);
  animation: flowchat-fade-in 150ms ease-out;
}

@keyframes flowchat-fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}
```

### Instance Switcher Styles

```css
/* Instance Switcher */
.flowchat-instance-switcher {
  display: flex;
  padding: 8px 12px;
  gap: 4px;
  border-bottom: 1px solid var(--flowchat-border, #e5e7eb);
  overflow-x: auto;
  flex-shrink: 0;
}

.flowchat-instance-tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  border-radius: 6px;
  cursor: pointer;
  white-space: nowrap;
  font-size: 13px;
  color: var(--flowchat-text-secondary, #6b7280);
  transition: background-color 150ms, color 150ms;
}

.flowchat-instance-tab:hover {
  background: var(--flowchat-hover, #f3f4f6);
}

.flowchat-instance-tab--active {
  background: var(--flowchat-primary-light, #e0f2fe);
  color: var(--flowchat-primary, #0066cc);
  font-weight: 500;
}

.flowchat-instance-tab__avatar {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  object-fit: cover;
}
```

### Mobile Responsive

```css
/* Mobile Adjustments */
@media (max-width: 480px) {
  .flowchat-bubble {
    --bubble-offset-x: 16px;
    --bubble-offset-y: 16px;
    --trigger-size: 56px;
  }
  
  .flowchat-bubble-panel--panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    border-radius: 0;
  }
  
  .flowchat-bubble-panel__resize-handle {
    display: none;
  }
}
```

## Accessibility

### ARIA Attributes

```tsx
// Accessibility considerations in BubblePanel

<div
  role="dialog"
  aria-modal={isFullscreen}
  aria-label={config.title || 'Chat window'}
  aria-describedby="flowchat-panel-description"
>
  <span id="flowchat-panel-description" className="sr-only">
    Chat assistant. Press Escape to close.
  </span>
  
  {/* Content */}
</div>
```

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close panel / Exit fullscreen |
| `Tab` | Navigate controls |
| `Enter/Space` | Activate focused control |

### Focus Management

```typescript
// Focus management hook
export function useBubbleFocus(isOpen: boolean, panelRef: RefObject<HTMLElement>) {
  const previousFocusRef = useRef<HTMLElement | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      // Save current focus
      previousFocusRef.current = document.activeElement as HTMLElement;
      
      // Focus panel
      panelRef.current?.focus();
    } else {
      // Restore focus
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
}
```

## Configuration Schema

```typescript
interface BubbleConfig {
  // Enable/disable
  enabled: boolean;
  
  // Position
  position: 'bottom-right' | 'bottom-left';
  offsetX: number;
  offsetY: number;
  
  // Trigger button
  trigger: {
    size: string;
    backgroundColor: string;
    iconColor: string;
    iconUrl?: string;
    avatarUrl?: string;
    tooltip?: string;
    pulse: boolean;
  };
  
  // Panel
  panel: {
    title: string;
    subtitle?: string;
    defaultWidth: number;
    defaultHeight: number;
    minWidth: number;
    minHeight: number;
    maxWidth: number;
    maxHeight: number;
    resizable: boolean;
  };
  
  // Auto-open
  autoOpen: AutoOpenConfig;
  
  // Behavior
  behavior: {
    rememberState: boolean;
    startOpen: boolean;
    closeOnOutsideClick: boolean;
  };
  
  // Multiple instances
  multiInstance: {
    enabled: boolean;
    instances: string[];
    defaultInstance: string;
  };
}
```

## Related Documentation

- [04-chat-instances-config.md](./04-chat-instances-config.md) - Multi-instance configuration
- [05-frontend-components.md](./05-frontend-components.md) - Chat components used in panel
- [03-admin-ui-spec.md](./03-admin-ui-spec.md) - Bubble configuration UI
