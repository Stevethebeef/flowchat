/**
 * FlowChatEventBus
 *
 * Cross-instance event communication system.
 * Allows instances to communicate with each other and external scripts
 * to hook into FlowChat events.
 */

// ============================================================================
// Event Types
// ============================================================================

export type FlowChatEventType =
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

export interface FlowChatEvent {
  type: FlowChatEventType;
  instanceId: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface InstanceReadyEvent extends FlowChatEvent {
  type: 'INSTANCE_READY';
  data: {
    containerId: string;
    sessionId: string;
  };
}

export interface InstanceDestroyedEvent extends FlowChatEvent {
  type: 'INSTANCE_DESTROYED';
  data: {
    containerId: string;
  };
}

export interface MessageSentEvent extends FlowChatEvent {
  type: 'MESSAGE_SENT';
  data: {
    messageId: string;
    content: string;
    hasAttachments: boolean;
  };
}

export interface MessageReceivedEvent extends FlowChatEvent {
  type: 'MESSAGE_RECEIVED';
  data: {
    messageId: string;
    content: string;
    isComplete: boolean;
  };
}

export interface BubbleOpenedEvent extends FlowChatEvent {
  type: 'BUBBLE_OPENED';
}

export interface BubbleClosedEvent extends FlowChatEvent {
  type: 'BUBBLE_CLOSED';
}

export interface InstanceSwitchedEvent extends FlowChatEvent {
  type: 'INSTANCE_SWITCHED';
  data: {
    from: string | null;
    to: string;
  };
}

export interface ConnectionErrorEvent extends FlowChatEvent {
  type: 'CONNECTION_ERROR';
  data: {
    error: string;
    code?: string;
    retryCount?: number;
  };
}

export interface ErrorEvent extends FlowChatEvent {
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

export type FlowChatEventListener<T extends FlowChatEvent = FlowChatEvent> = (event: T) => void;

export type FlowChatEventMap = {
  INSTANCE_READY: InstanceReadyEvent;
  INSTANCE_DESTROYED: InstanceDestroyedEvent;
  MESSAGE_SENT: MessageSentEvent;
  MESSAGE_RECEIVED: MessageReceivedEvent;
  MESSAGE_STREAMING: MessageReceivedEvent;
  MESSAGE_COMPLETE: MessageReceivedEvent;
  BUBBLE_OPENED: BubbleOpenedEvent;
  BUBBLE_CLOSED: BubbleClosedEvent;
  BUBBLE_MINIMIZED: FlowChatEvent;
  BUBBLE_RESTORED: FlowChatEvent;
  INSTANCE_SWITCHED: InstanceSwitchedEvent;
  CONNECTION_ESTABLISHED: FlowChatEvent;
  CONNECTION_LOST: FlowChatEvent;
  CONNECTION_ERROR: ConnectionErrorEvent;
  TYPING_STARTED: FlowChatEvent;
  TYPING_STOPPED: FlowChatEvent;
  FILE_UPLOAD_STARTED: FlowChatEvent;
  FILE_UPLOAD_COMPLETED: FlowChatEvent;
  FILE_UPLOAD_FAILED: FlowChatEvent;
  SESSION_STARTED: FlowChatEvent;
  SESSION_ENDED: FlowChatEvent;
  ERROR: ErrorEvent;
};

// ============================================================================
// Event Bus Class
// ============================================================================

export class FlowChatEventBus {
  private listeners: Map<string, Set<FlowChatEventListener>> = new Map();
  private history: FlowChatEvent[] = [];
  private maxHistorySize: number = 100;
  private debugMode: boolean = false;

  constructor(options?: { maxHistorySize?: number; debugMode?: boolean }) {
    this.maxHistorySize = options?.maxHistorySize ?? 100;
    this.debugMode = options?.debugMode ?? false;
  }

  /**
   * Subscribe to a specific event type
   */
  subscribe<T extends FlowChatEventType>(
    eventType: T,
    callback: FlowChatEventListener<FlowChatEventMap[T]>
  ): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }

    this.listeners.get(eventType)!.add(callback as FlowChatEventListener);

    // Return unsubscribe function
    return () => {
      this.listeners.get(eventType)?.delete(callback as FlowChatEventListener);
    };
  }

  /**
   * Subscribe to all events
   */
  subscribeAll(callback: FlowChatEventListener): () => void {
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
    callback: FlowChatEventListener
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
  emit<T extends FlowChatEventType>(
    type: T,
    instanceId: string,
    data?: FlowChatEventMap[T]['data']
  ): void {
    const event: FlowChatEvent = {
      type,
      instanceId,
      timestamp: Date.now(),
      data,
    };

    // Add to history
    this.addToHistory(event);

    // Debug logging
    if (this.debugMode) {
      console.log('[FlowChat Event]', event);
    }

    // Notify type-specific listeners
    this.listeners.get(type)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[FlowChat] Event listener error for ${type}:`, error);
      }
    });

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('[FlowChat] Wildcard event listener error:', error);
      }
    });

    // Notify instance-specific listeners
    const instanceKey = `instance:${instanceId}`;
    this.listeners.get(instanceKey)?.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error(`[FlowChat] Instance listener error for ${instanceId}:`, error);
      }
    });
  }

  /**
   * Get event history
   */
  getHistory(options?: {
    type?: FlowChatEventType;
    instanceId?: string;
    limit?: number;
  }): FlowChatEvent[] {
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
  removeAllListeners(eventType?: FlowChatEventType): void {
    if (eventType) {
      this.listeners.delete(eventType);
    } else {
      this.listeners.clear();
    }
  }

  /**
   * Get listener count for debugging
   */
  getListenerCount(eventType?: FlowChatEventType): number {
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
  private addToHistory(event: FlowChatEvent): void {
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
const globalEventBus = new FlowChatEventBus({
  debugMode: (window as any).flowchatDebug === true,
});

// Expose on window for external scripts
if (typeof window !== 'undefined') {
  (window as any).flowchatEvents = globalEventBus;
}

export default globalEventBus;

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Convenience function to emit events
 */
export function emitEvent<T extends FlowChatEventType>(
  type: T,
  instanceId: string,
  data?: FlowChatEventMap[T]['data']
): void {
  globalEventBus.emit(type, instanceId, data);
}

/**
 * Convenience function to subscribe to events
 */
export function onEvent<T extends FlowChatEventType>(
  type: T,
  callback: FlowChatEventListener<FlowChatEventMap[T]>
): () => void {
  return globalEventBus.subscribe(type, callback);
}

/**
 * Convenience function to subscribe to all events
 */
export function onAnyEvent(callback: FlowChatEventListener): () => void {
  return globalEventBus.subscribeAll(callback);
}

// ============================================================================
// React Hook
// ============================================================================

import { useEffect, useRef } from 'react';

/**
 * React hook for subscribing to FlowChat events
 */
export function useFlowChatEvent<T extends FlowChatEventType>(
  eventType: T,
  callback: FlowChatEventListener<FlowChatEventMap[T]>,
  deps: React.DependencyList = []
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    const unsubscribe = globalEventBus.subscribe(eventType, (event) => {
      callbackRef.current(event as FlowChatEventMap[T]);
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
  callback: FlowChatEventListener,
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
