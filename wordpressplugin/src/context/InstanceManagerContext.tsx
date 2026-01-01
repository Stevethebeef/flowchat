/**
 * InstanceManagerContext
 *
 * Manages multiple chat instances, their runtimes, and global bubble state.
 * Provides methods for mounting/unmounting instances and switching between them.
 */

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { N8nChatConfig, BubbleConfig } from '../types';

// ============================================================================
// Types
// ============================================================================

export interface InstanceConfig extends N8nChatConfig {
  id: string;
  name: string;
  description?: string;
}

export interface ActiveInstance {
  id: string;
  containerId: string;
  sessionId: string;
  state: InstanceState;
}

export interface InstanceState {
  isExpanded: boolean;
  inputValue: string;
  unreadCount: number;
}

export interface BubbleState {
  isOpen: boolean;
  isMinimized: boolean;
  activeInstanceId: string | null;
  unreadCounts: Record<string, number>;
  position: { x: number; y: number };
}

interface InstanceManagerState {
  availableInstances: Map<string, InstanceConfig>;
  activeInstances: Map<string, ActiveInstance>;
  bubbleState: BubbleState;
  isInitialized: boolean;
}

type InstanceManagerAction =
  | { type: 'INITIALIZE'; instances: InstanceConfig[] }
  | { type: 'MOUNT_INSTANCE'; containerId: string; instanceId: string; sessionId: string }
  | { type: 'UNMOUNT_INSTANCE'; containerId: string }
  | { type: 'UPDATE_INSTANCE_STATE'; containerId: string; state: Partial<InstanceState> }
  | { type: 'SET_BUBBLE_OPEN'; isOpen: boolean }
  | { type: 'SET_BUBBLE_MINIMIZED'; isMinimized: boolean }
  | { type: 'SWITCH_BUBBLE_INSTANCE'; instanceId: string }
  | { type: 'INCREMENT_UNREAD'; instanceId: string }
  | { type: 'CLEAR_UNREAD'; instanceId: string }
  | { type: 'SET_BUBBLE_POSITION'; position: { x: number; y: number } };

interface InstanceManagerContextValue extends InstanceManagerState {
  mountInstance: (containerId: string, instanceId: string) => void;
  unmountInstance: (containerId: string) => void;
  getInstanceConfig: (instanceId: string) => InstanceConfig | undefined;
  getActiveInstance: (containerId: string) => ActiveInstance | undefined;
  switchBubbleInstance: (instanceId: string) => void;
  setBubbleOpen: (isOpen: boolean) => void;
  setBubbleMinimized: (isMinimized: boolean) => void;
  incrementUnread: (instanceId: string) => void;
  clearUnread: (instanceId: string) => void;
  updateInstanceState: (containerId: string, state: Partial<InstanceState>) => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialBubbleState: BubbleState = {
  isOpen: false,
  isMinimized: false,
  activeInstanceId: null,
  unreadCounts: {},
  position: { x: 20, y: 20 },
};

const initialState: InstanceManagerState = {
  availableInstances: new Map(),
  activeInstances: new Map(),
  bubbleState: initialBubbleState,
  isInitialized: false,
};

// ============================================================================
// Storage Keys
// ============================================================================

const STORAGE_KEYS = {
  session: (id: string) => `n8n_chat_session_${id}`,
  history: (id: string) => `n8n_chat_history_${id}`,
  state: (id: string) => `n8n_chat_state_${id}`,
  unread: (id: string) => `n8n_chat_unread_${id}`,
  global: 'n8n_chat_global',
};

// ============================================================================
// Helpers
// ============================================================================

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function getOrCreateSessionId(instanceId: string): string {
  const storageKey = STORAGE_KEYS.session(instanceId);
  let sessionId = sessionStorage.getItem(storageKey);

  if (!sessionId) {
    sessionId = generateUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }

  return sessionId;
}

function saveInstanceState(instanceId: string, state: Partial<InstanceState>): void {
  const storageKey = STORAGE_KEYS.state(instanceId);
  const existing = JSON.parse(sessionStorage.getItem(storageKey) || '{}');
  sessionStorage.setItem(storageKey, JSON.stringify({ ...existing, ...state }));
}

function loadInstanceState(instanceId: string): Partial<InstanceState> | null {
  const storageKey = STORAGE_KEYS.state(instanceId);
  const stored = sessionStorage.getItem(storageKey);
  return stored ? JSON.parse(stored) : null;
}

function loadGlobalState(): Partial<BubbleState> | null {
  const stored = localStorage.getItem(STORAGE_KEYS.global);
  return stored ? JSON.parse(stored) : null;
}

function saveGlobalState(state: Partial<BubbleState>): void {
  const existing = loadGlobalState() || {};
  localStorage.setItem(STORAGE_KEYS.global, JSON.stringify({ ...existing, ...state }));
}

// ============================================================================
// Reducer
// ============================================================================

function instanceManagerReducer(
  state: InstanceManagerState,
  action: InstanceManagerAction
): InstanceManagerState {
  switch (action.type) {
    case 'INITIALIZE': {
      const availableInstances = new Map<string, InstanceConfig>();
      action.instances.forEach((instance) => {
        availableInstances.set(instance.id, instance);
      });

      // Load persisted bubble state
      const savedGlobal = loadGlobalState();

      return {
        ...state,
        availableInstances,
        isInitialized: true,
        bubbleState: {
          ...state.bubbleState,
          position: savedGlobal?.position || state.bubbleState.position,
        },
      };
    }

    case 'MOUNT_INSTANCE': {
      const newActiveInstances = new Map(state.activeInstances);
      const savedState = loadInstanceState(action.instanceId);

      newActiveInstances.set(action.containerId, {
        id: action.instanceId,
        containerId: action.containerId,
        sessionId: action.sessionId,
        state: {
          isExpanded: false,
          inputValue: '',
          unreadCount: 0,
          ...savedState,
        },
      });

      return {
        ...state,
        activeInstances: newActiveInstances,
      };
    }

    case 'UNMOUNT_INSTANCE': {
      const newActiveInstances = new Map(state.activeInstances);
      const instance = newActiveInstances.get(action.containerId);

      // Save state before unmounting
      if (instance) {
        saveInstanceState(instance.id, instance.state);
      }

      newActiveInstances.delete(action.containerId);

      return {
        ...state,
        activeInstances: newActiveInstances,
      };
    }

    case 'UPDATE_INSTANCE_STATE': {
      const newActiveInstances = new Map(state.activeInstances);
      const instance = newActiveInstances.get(action.containerId);

      if (instance) {
        newActiveInstances.set(action.containerId, {
          ...instance,
          state: { ...instance.state, ...action.state },
        });
      }

      return {
        ...state,
        activeInstances: newActiveInstances,
      };
    }

    case 'SET_BUBBLE_OPEN': {
      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          isOpen: action.isOpen,
          isMinimized: action.isOpen ? false : state.bubbleState.isMinimized,
        },
      };
    }

    case 'SET_BUBBLE_MINIMIZED': {
      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          isMinimized: action.isMinimized,
        },
      };
    }

    case 'SWITCH_BUBBLE_INSTANCE': {
      // Save current instance state before switching
      const currentInstanceId = state.bubbleState.activeInstanceId;
      if (currentInstanceId) {
        const currentInstance = Array.from(state.activeInstances.values()).find(
          (i) => i.id === currentInstanceId
        );
        if (currentInstance) {
          saveInstanceState(currentInstanceId, currentInstance.state);
        }
      }

      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          activeInstanceId: action.instanceId,
        },
      };
    }

    case 'INCREMENT_UNREAD': {
      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          unreadCounts: {
            ...state.bubbleState.unreadCounts,
            [action.instanceId]: (state.bubbleState.unreadCounts[action.instanceId] || 0) + 1,
          },
        },
      };
    }

    case 'CLEAR_UNREAD': {
      const newUnreadCounts = { ...state.bubbleState.unreadCounts };
      delete newUnreadCounts[action.instanceId];

      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          unreadCounts: newUnreadCounts,
        },
      };
    }

    case 'SET_BUBBLE_POSITION': {
      saveGlobalState({ position: action.position });

      return {
        ...state,
        bubbleState: {
          ...state.bubbleState,
          position: action.position,
        },
      };
    }

    default:
      return state;
  }
}

// ============================================================================
// Context
// ============================================================================

const InstanceManagerContext = createContext<InstanceManagerContextValue | null>(null);

// ============================================================================
// Provider
// ============================================================================

interface InstanceManagerProviderProps {
  children: ReactNode;
  instances?: InstanceConfig[];
  bubbleConfig?: BubbleConfig;
}

export function InstanceManagerProvider({
  children,
  instances = [],
  bubbleConfig,
}: InstanceManagerProviderProps): JSX.Element {
  const [state, dispatch] = useReducer(instanceManagerReducer, initialState);

  // Initialize with provided instances
  useEffect(() => {
    if (instances.length > 0 && !state.isInitialized) {
      dispatch({ type: 'INITIALIZE', instances });

      // Set default bubble instance if configured
      if (bubbleConfig?.enabled && bubbleConfig.defaultInstance) {
        dispatch({
          type: 'SWITCH_BUBBLE_INSTANCE',
          instanceId: bubbleConfig.defaultInstance,
        });
      }
    }
  }, [instances, bubbleConfig, state.isInitialized]);

  const mountInstance = useCallback((containerId: string, instanceId: string) => {
    const sessionId = getOrCreateSessionId(instanceId);
    dispatch({ type: 'MOUNT_INSTANCE', containerId, instanceId, sessionId });
  }, []);

  const unmountInstance = useCallback((containerId: string) => {
    dispatch({ type: 'UNMOUNT_INSTANCE', containerId });
  }, []);

  const getInstanceConfig = useCallback(
    (instanceId: string) => {
      return state.availableInstances.get(instanceId);
    },
    [state.availableInstances]
  );

  const getActiveInstance = useCallback(
    (containerId: string) => {
      return state.activeInstances.get(containerId);
    },
    [state.activeInstances]
  );

  const switchBubbleInstance = useCallback((instanceId: string) => {
    dispatch({ type: 'SWITCH_BUBBLE_INSTANCE', instanceId });
  }, []);

  const setBubbleOpen = useCallback((isOpen: boolean) => {
    dispatch({ type: 'SET_BUBBLE_OPEN', isOpen });
  }, []);

  const setBubbleMinimized = useCallback((isMinimized: boolean) => {
    dispatch({ type: 'SET_BUBBLE_MINIMIZED', isMinimized });
  }, []);

  const incrementUnread = useCallback((instanceId: string) => {
    dispatch({ type: 'INCREMENT_UNREAD', instanceId });
  }, []);

  const clearUnread = useCallback((instanceId: string) => {
    dispatch({ type: 'CLEAR_UNREAD', instanceId });
  }, []);

  const updateInstanceState = useCallback(
    (containerId: string, instanceState: Partial<InstanceState>) => {
      dispatch({ type: 'UPDATE_INSTANCE_STATE', containerId, state: instanceState });
    },
    []
  );

  const value: InstanceManagerContextValue = {
    ...state,
    mountInstance,
    unmountInstance,
    getInstanceConfig,
    getActiveInstance,
    switchBubbleInstance,
    setBubbleOpen,
    setBubbleMinimized,
    incrementUnread,
    clearUnread,
    updateInstanceState,
  };

  return (
    <InstanceManagerContext.Provider value={value}>
      {children}
    </InstanceManagerContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function useInstanceManager(): InstanceManagerContextValue {
  const context = useContext(InstanceManagerContext);

  if (!context) {
    throw new Error('useInstanceManager must be used within an InstanceManagerProvider');
  }

  return context;
}

// ============================================================================
// Utility Hooks
// ============================================================================

/**
 * Hook to check if an additional instance can be mounted (license check)
 */
export function useCanMountInstance(): boolean {
  const { activeInstances } = useInstanceManager();
  const features = (window as any).n8nChatFeatures || {};

  if (activeInstances.size === 0) {
    return true; // First instance always allowed
  }

  return features.multiInstance === true;
}

/**
 * Hook to get all available instances for switching
 */
export function useAvailableInstances(): InstanceConfig[] {
  const { availableInstances } = useInstanceManager();
  return Array.from(availableInstances.values());
}

/**
 * Hook to get bubble-specific state and actions
 */
export function useBubbleManager() {
  const {
    bubbleState,
    availableInstances,
    setBubbleOpen,
    setBubbleMinimized,
    switchBubbleInstance,
    clearUnread,
  } = useInstanceManager();

  const activeInstance = bubbleState.activeInstanceId
    ? availableInstances.get(bubbleState.activeInstanceId)
    : null;

  const totalUnread = Object.values(bubbleState.unreadCounts).reduce((a, b) => a + b, 0);

  return {
    isOpen: bubbleState.isOpen,
    isMinimized: bubbleState.isMinimized,
    activeInstanceId: bubbleState.activeInstanceId,
    activeInstance,
    unreadCounts: bubbleState.unreadCounts,
    totalUnread,
    position: bubbleState.position,
    open: () => setBubbleOpen(true),
    close: () => setBubbleOpen(false),
    toggle: () => setBubbleOpen(!bubbleState.isOpen),
    minimize: () => setBubbleMinimized(true),
    restore: () => setBubbleMinimized(false),
    switchInstance: switchBubbleInstance,
    clearUnread,
  };
}

export default InstanceManagerContext;
