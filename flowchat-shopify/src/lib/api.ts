/**
 * n8n Chat Widget JavaScript API
 * Global API exposed as window.N8nChat for external control
 */

import type { ProactiveTrigger } from '@/hooks';

/**
 * Event types emitted by the widget
 */
export type N8nChatEventType =
  | 'widget:ready'
  | 'widget:open'
  | 'widget:close'
  | 'message:sent'
  | 'message:received'
  | 'session:start'
  | 'session:end'
  | 'trigger:fired'
  | 'error:occurred'
  | 'voice:start'
  | 'voice:end'
  | 'file:uploaded';

/**
 * Event payload types
 */
export interface N8nChatEventPayloads {
  'widget:ready': { version: string; sessionId: string };
  'widget:open': { trigger: 'user' | 'auto' | 'api' | 'proactive' };
  'widget:close': { trigger: 'user' | 'api' | 'escape' };
  'message:sent': { content: string; timestamp: string };
  'message:received': { content: string; timestamp: string };
  'session:start': { sessionId: string; isNew: boolean };
  'session:end': { sessionId: string; messageCount: number };
  'trigger:fired': { trigger: ProactiveTrigger };
  'error:occurred': { error: string; context?: string };
  'voice:start': Record<string, never>;
  'voice:end': { transcript: string };
  'file:uploaded': { filename: string; size: number; url?: string };
}

/**
 * Event listener callback type
 */
export type N8nChatEventListener<T extends N8nChatEventType> = (
  payload: N8nChatEventPayloads[T]
) => void;

/**
 * Widget configuration subset that can be updated at runtime
 */
export interface RuntimeConfig {
  primaryColor?: string;
  theme?: 'light' | 'dark' | 'auto';
  position?: 'bottom-right' | 'bottom-left';
  welcomeMessage?: string;
  placeholderText?: string;
}

/**
 * Full API interface
 */
export interface N8nChatAPI {
  // Version
  version: string;

  // State management
  open: (trigger?: 'api' | 'proactive') => void;
  close: () => void;
  toggle: () => void;
  isOpen: () => boolean;

  // Session management
  getSessionId: () => string;
  resetSession: () => void;

  // Message sending
  send: (message: string) => void;
  sendBotMessage: (message: string) => void;
  clearHistory: () => void;

  // Event system
  on: <T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>) => void;
  off: <T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>) => void;
  once: <T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>) => void;
  emit: <T extends N8nChatEventType>(event: T, payload: N8nChatEventPayloads[T]) => void;

  // Proactive messaging
  showMessage: (message: string) => void;
  triggerProactive: (trigger: ProactiveTrigger) => void;

  // Configuration (runtime only)
  setConfig: (config: Partial<RuntimeConfig>) => void;
  getConfig: () => RuntimeConfig;

  // Analytics helpers
  getMessageCount: () => number;
  getSessionDuration: () => number; // seconds

  // Utility
  destroy: () => void;
}

/**
 * Event emitter for widget events
 */
export class N8nChatEventEmitter {
  private listeners: Map<N8nChatEventType, Set<N8nChatEventListener<any>>> = new Map();
  private onceListeners: Map<N8nChatEventType, Set<N8nChatEventListener<any>>> = new Map();

  on<T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  once<T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>): void {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(callback);
  }

  off<T extends N8nChatEventType>(event: T, callback: N8nChatEventListener<T>): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.delete(callback);
    }
  }

  emit<T extends N8nChatEventType>(event: T, payload: N8nChatEventPayloads[T]): void {
    // Regular listeners
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[n8n Chat] Error in event listener for ${event}:`, error);
        }
      });
    }

    // Once listeners (execute and remove)
    const onceListeners = this.onceListeners.get(event);
    if (onceListeners) {
      onceListeners.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[n8n Chat] Error in once listener for ${event}:`, error);
        }
      });
      onceListeners.clear();
    }

    // Also dispatch a custom DOM event for vanilla JS integration
    if (typeof window !== 'undefined') {
      const customEvent = new CustomEvent(`n8nchat:${event}`, {
        detail: payload,
        bubbles: true,
      });
      document.dispatchEvent(customEvent);
    }
  }

  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
  }
}

/**
 * Create the API instance (called by the widget component)
 */
export function createN8nChatAPI(
  controls: {
    open: (trigger?: 'api' | 'proactive') => void;
    close: () => void;
    toggle: () => void;
    isOpen: () => boolean;
    getSessionId: () => string;
    resetSession: () => void;
    showMessage: (message: string) => void;
    triggerProactive: (trigger: ProactiveTrigger) => void;
    setConfig: (config: Partial<RuntimeConfig>) => void;
    getConfig: () => RuntimeConfig;
    getMessageCount: () => number;
    getSessionStartTime: () => number;
    send: (message: string) => void;
    sendBotMessage: (message: string) => void;
    clearHistory: () => void;
  },
  eventEmitter: N8nChatEventEmitter
): N8nChatAPI {
  return {
    version: '6.0.0',

    // State
    open: controls.open,
    close: controls.close,
    toggle: controls.toggle,
    isOpen: controls.isOpen,

    // Session
    getSessionId: controls.getSessionId,
    resetSession: controls.resetSession,

    // Messaging
    send: controls.send,
    sendBotMessage: controls.sendBotMessage,
    clearHistory: controls.clearHistory,

    // Events
    on: eventEmitter.on.bind(eventEmitter),
    off: eventEmitter.off.bind(eventEmitter),
    once: eventEmitter.once.bind(eventEmitter),
    emit: eventEmitter.emit.bind(eventEmitter),

    // Proactive
    showMessage: controls.showMessage,
    triggerProactive: controls.triggerProactive,

    // Config
    setConfig: controls.setConfig,
    getConfig: controls.getConfig,

    // Analytics
    getMessageCount: controls.getMessageCount,
    getSessionDuration: () => {
      const startTime = controls.getSessionStartTime();
      if (!startTime) return 0;
      return Math.floor((Date.now() - startTime) / 1000);
    },

    // Cleanup
    destroy: () => {
      eventEmitter.clear();
      if (typeof window !== 'undefined') {
        delete (window as any).N8nChat;
      }
    },
  };
}

/**
 * Global type declaration for window.N8nChat
 */
declare global {
  interface Window {
    N8nChat?: N8nChatAPI;
  }
}
