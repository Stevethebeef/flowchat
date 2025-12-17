/**
 * N8nChatEventBus
 *
 * Cross-instance event communication system.
 * Allows instances to communicate with each other and external scripts
 * to hook into n8n Chat events.
 */

// ============================================================================
// Event Types
// ============================================================================

export type N8nChatEventType =
  | 'INSTANCE_READY'
  | 'INSTANCE_DESTROYED'
  | 'MESSAGE_SENT'
  | 'MESSAGE_RECEIVED'
  | 'MESSAGE_STREAMING'
  | 'MESSAGE_COMPLETE'
  | 'BUBBLE_OPENED'
  | 'BUBBLE_CLOSED'
  | 'BUBBLE_MINIMIZED'
  | 'BUBBLE_RESTORED'
  | 'INSTANCE_SWITCHED'
  | 'CONNECTION_ESTABLISHED'
  | 'CONNECTION_LOST'
  | 'CONNECTION_ERROR'
  | 'TYPING_STARTED'
  | 'TYPING_STOPPED'
  | 'FILE_UPLOAD_STARTED'
  | 'FILE_UPLOAD_COMPLETED'
  | 'FILE_UPLOAD_FAILED'
  | 'SESSION_STARTED'
  | 'SESSION_ENDED'
  | 'ERROR';

export interface N8nChatEvent {
  type: N8nChatEventType;
  instanceId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface InstanceReadyEvent extends N8nChatEvent {
  type: 'INSTANCE_READY';
  data: {
    containerId: string;
    sessionId: string;
  };
}

export interface InstanceDestroyedEvent extends N8nChatEvent {
  type: 'INSTANCE_DESTROYED';
  data: {
    containerId: string;
  };
}

export interface MessageSentEvent extends N8nChatEvent {
  type: 'MESSAGE_SENT';
  data: {
    messageId: string;
    content: string;
    hasAttachments: boolean;
  };
}

export interface MessageReceivedEvent extends N8nChatEvent {
  type: 'MESSAGE_RECEIVED';
  data: {
    messageId: string;
    content: string;
    isComplete: boolean;
  };
}

export interface BubbleOpenedEvent extends N8nChatEvent {
  type: 'BUBBLE_OPENED';
}

export interface BubbleClosedEvent extends N8nChatEvent {
  type: 'BUBBLE_CLOSED';
}

export interface InstanceSwitchedEvent extends N8nChatEvent {
  type: 'INSTANCE_SWITCHED';
  data: {
    from: string | null;
    to: string;
  };
}

export interface ConnectionErrorEvent extends N8nChatEvent {
  type: 'CONNECTION_ERROR';
  data: {
    error: string;
    code?: string;
    retryCount?: number;
  };
}

export interface ErrorEvent extends N8nChatEvent {
  type: 'ERROR';
  data: {
    error: string;
    code?: string;
    recoverable: boolean;
  };
}

// ============================================================================
// Event Listener Types
// ============================================================================

export type N8nChatEventListener<T extends N8nChatEvent = N8nChatEvent> = (event: T) => void;

export type N8nChatEventMap = {
  INSTANCE_READY: InstanceReadyEvent;
  INSTANCE_DESTROYED: InstanceDestroyedEvent;
  MESSAGE_SENT: MessageSentEvent;
  MESSAGE_RECEIVED: MessageReceivedEvent;
  MESSAGE_STREAMING: MessageReceivedEvent;
  MESSAGE_COMPLETE: MessageReceivedEvent;
  BUBBLE_OPENED: BubbleOpenedEvent;
  BUBBLE_CLOSED: BubbleClosedEvent;
  BUBBLE_MINIMIZED: N8nChatEvent;
  BUBBLE_RESTORED: N8nChatEvent;
  INSTANCE_SWITCHED: InstanceSwitchedEvent;
  CONNECTION_ESTABLISHED: N8nChatEvent;
  CONNECTION_LOST: N8nChatEvent;
  CONNECTION_ERROR: ConnectionErrorEvent;
  TYPING_STARTED: N8nChatEvent;
  TYPING_STOPPED: N8nChatEvent;
  FILE_UPLOAD_STARTED: N8nChatEvent;
  FILE_UPLOAD_COMPLETED: N8nChatEvent;
  FILE_UPLOAD_FAILED: N8nChatEvent;
  SESSION_STARTED: N8nChatEvent;
  SESSION_ENDED: N8nChatEvent;
  ERROR: ErrorEvent;
};

// ============================================================================
// Event Bus Class
// ============================================================================

export class N8nChatEventBus {
  private listeners: Map<string, Set<N8nChatEventListener>> = new Map();
  private history: N8nChatEvent[] = [];
  private maxHistorySize: number = 100;
  private debugMode: boolean = false;

  constructor(options?: { maxHistorySize?: number; debugMode?: boolean }) {
    this.maxHistorySize = options?.maxHistorySize ?? 100;
    this.debugMode = options?.debugMode ?? false;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends N8nChatEventType>(
    eventType: T,
    callback: N8nChatEventListener<N8nChatEventMap[T]>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback as N8nChatEventListener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback as N8nChatEventListener);
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: N8nChatEventListener): () => void {
    if (!this.listeners.has('*')) {
      this.listeners.set('*', new Set());
    }

    this.listeners.get('*')!.add(callback);

    return () => {
      this.listeners.get('*')?.delete(callback);
    };
  }

  /**
   * Subscribe to events from a specific instance
   */
  subscribeToInstance(
    instanceId: string,
    callback: N8nChatEventListener
  ): () => void {
    const key = `instance:${instanceId}`;

    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(callback);

    return () => {
      this.listeners.get(key)?.delete(callback);
    };
  }

  /**
   * Emit an event
   */
  emit<T extends N8nChatEventType>(
    type: T,
    instanceId: string,
    data?: N8nChatEventMap[T]['data']
  ): void {
    const event: N8nChatEvent = {
      type,
      instanceId,
      timestamp: Date.now(),
      data,
    };

    // Add to history
    this.addToHistory(event);

    // Debug logging
    if (this.debugMode) {
      console.log('[n8n Chat Event]', event);
    }

    // Notify type-specific listeners
    this.listeners.get(type)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[n8n Chat] Event listener error for ${type}:`, error);
      }
    });

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[n8n Chat] Wildcard event listener error:', error);
      }
    });

    // Notify instance-specific listeners
    const instanceKey = `instance:${instanceId}`;
    this.listeners.get(instanceKey)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[n8n Chat] Instance listener error for ${instanceId}:`, error);
      }
    });
  }

  /**
   * Get event history
   */
  getHistory(options?: {
    type?: N8nChatEventType;
    instanceId?: string;
    limit?: number;
  }): N8nChatEvent[] {
    let filtered = [...this.history];

    if (options?.type) {
      filtered = filtered.filter((e) => e.type === options.type);
    }

    if (options?.instanceId) {
      filtered = filtered.filter((e) => e.instanceId === options.instanceId);
    }

    if (options?.limit) {
      filtered = filtered.slice(-options.limit);
    }

    return filtered;
  }

  /**
   * Clear event history
   */
  clearHistory(): void {
    this.history = [];
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(eventType?: N8nChatEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(eventType?: N8nChatEventType): number {
    if (eventType) {
      return this.listeners.get(eventType)?.size ?? 0;
    }

    let total = 0;
    this.listeners.forEach((set) => {
      total += set.size;
    });
    return total;
  }

  /**
   * Enable/disable debug mode
   */
  setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * Add event to history with size limit
   */
  private addToHistory(event: N8nChatEvent): void {
    this.history.push(event);

    // Trim history if exceeds max size
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }
}

// ============================================================================
// Global Instance
// ============================================================================

// Create global event bus instance
const globalEventBus = new N8nChatEventBus({
  debugMode: (window as any).n8nChatDebug === true,
});

// Expose on window for external scripts
if (typeof window !== 'undefined') {
  (window as any).n8nChatEvents = globalEventBus;
}

export default globalEventBus;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convenience function to emit events
 */
export function emitEvent<T extends N8nChatEventType>(
  type: T,
  instanceId: string,
  data?: N8nChatEventMap[T]['data']
): void {
  globalEventBus.emit(type, instanceId, data);
}

/**
 * Convenience function to subscribe to events
 */
export function onEvent<T extends N8nChatEventType>(
  type: T,
  callback: N8nChatEventListener<N8nChatEventMap[T]>
): () => void {
  return globalEventBus.subscribe(type, callback);
}

/**
 * Convenience function to subscribe to all events
 */
export function onAnyEvent(callback: N8nChatEventListener): () => void {
  return globalEventBus.subscribeAll(callback);
}

// ============================================================================
// React Hook
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * React hook for subscribing to n8n Chat events
 */
export function useN8nChatEvent<T extends N8nChatEventType>(
  eventType: T,
  callback: N8nChatEventListener<N8nChatEventMap[T]>,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = globalEventBus.subscribe(eventType, (event) => {
      callbackRef.current(event as N8nChatEventMap[T]);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventType, ...deps]);
}

/**
 * React hook for subscribing to all events from a specific instance
 */
export function useInstanceEvents(
  instanceId: string,
  callback: N8nChatEventListener,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = globalEventBus.subscribeToInstance(instanceId, (event) => {
      callbackRef.current(event);
    });

    return unsubscribe;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [instanceId, ...deps]);
}
