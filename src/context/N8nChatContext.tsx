/**
 * FlowChat Context Provider
 *
 * Provides global state and utilities for FlowChat components.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { FlowChatConfig, ChatContext as ChatContextData, ChatMessage } from '../types';

interface FlowChatState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  hasInteracted: boolean;
}

interface FlowChatContextValue {
  // Config
  config: FlowChatConfig | null;
  context: ChatContextData | null;
  webhookUrl: string | null;
  sessionId: string | null;

  // State
  state: FlowChatState;

  // Actions
  setConfig: (config: FlowChatConfig) => void;
  setContext: (context: ChatContextData) => void;
  setWebhookUrl: (url: string) => void;
  setSessionId: (id: string) => void;
  setOpen: (isOpen: boolean) => void;
  setMinimized: (isMinimized: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  markInteracted: () => void;
}

const FlowChatContext = createContext<FlowChatContextValue | null>(null);

interface FlowChatProviderProps {
  children: ReactNode;
  initialConfig?: FlowChatConfig;
  initialContext?: ChatContextData;
  initialWebhookUrl?: string;
  initialSessionId?: string;
}

export function FlowChatProvider({
  children,
  initialConfig,
  initialContext,
  initialWebhookUrl,
  initialSessionId,
}: FlowChatProviderProps) {
  const [config, setConfig] = useState<FlowChatConfig | null>(initialConfig || null);
  const [context, setContext] = useState<ChatContextData | null>(initialContext || null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(initialWebhookUrl || null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);

  const [state, setState] = useState<FlowChatState>({
    isOpen: false,
    isMinimized: false,
    isLoading: false,
    error: null,
    unreadCount: 0,
    hasInteracted: false,
  });

  // State setters
  const setOpen = useCallback((isOpen: boolean) => {
    setState((prev) => ({ ...prev, isOpen }));
    if (isOpen) {
      setState((prev) => ({ ...prev, unreadCount: 0 }));
    }
  }, []);

  const setMinimized = useCallback((isMinimized: boolean) => {
    setState((prev) => ({ ...prev, isMinimized }));
  }, []);

  const setLoading = useCallback((isLoading: boolean) => {
    setState((prev) => ({ ...prev, isLoading }));
  }, []);

  const setError = useCallback((error: string | null) => {
    setState((prev) => ({ ...prev, error }));
  }, []);

  const incrementUnread = useCallback(() => {
    setState((prev) => {
      if (prev.isOpen) return prev;
      return { ...prev, unreadCount: prev.unreadCount + 1 };
    });
  }, []);

  const clearUnread = useCallback(() => {
    setState((prev) => ({ ...prev, unreadCount: 0 }));
  }, []);

  const markInteracted = useCallback(() => {
    setState((prev) => ({ ...prev, hasInteracted: true }));
  }, []);

  // Persist interaction state
  useEffect(() => {
    if (state.hasInteracted && sessionId) {
      try {
        sessionStorage.setItem(`flowchat_interacted_${sessionId}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }
  }, [state.hasInteracted, sessionId]);

  // Load interaction state
  useEffect(() => {
    if (sessionId) {
      try {
        const interacted = sessionStorage.getItem(`flowchat_interacted_${sessionId}`);
        if (interacted === 'true') {
          setState((prev) => ({ ...prev, hasInteracted: true }));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [sessionId]);

  const value: FlowChatContextValue = {
    config,
    context,
    webhookUrl,
    sessionId,
    state,
    setConfig,
    setContext,
    setWebhookUrl,
    setSessionId,
    setOpen,
    setMinimized,
    setLoading,
    setError,
    incrementUnread,
    clearUnread,
    markInteracted,
  };

  return (
    <FlowChatContext.Provider value={value}>{children}</FlowChatContext.Provider>
  );
}

/**
 * Hook to access FlowChat context
 */
export function useFlowChat(): FlowChatContextValue {
  const context = useContext(FlowChatContext);

  if (!context) {
    throw new Error('useFlowChat must be used within a FlowChatProvider');
  }

  return context;
}

/**
 * Hook to access just the config
 */
export function useFlowChatConfig(): FlowChatConfig | null {
  const { config } = useFlowChat();
  return config;
}

/**
 * Hook to access bubble state
 */
export function useBubbleState() {
  const { state, setOpen, setMinimized, clearUnread, markInteracted } = useFlowChat();

  const toggle = useCallback(() => {
    setOpen(!state.isOpen);
    markInteracted();
  }, [state.isOpen, setOpen, markInteracted]);

  const open = useCallback(() => {
    setOpen(true);
    markInteracted();
  }, [setOpen, markInteracted]);

  const close = useCallback(() => {
    setOpen(false);
  }, [setOpen]);

  const minimize = useCallback(() => {
    setMinimized(true);
  }, [setMinimized]);

  const restore = useCallback(() => {
    setMinimized(false);
  }, [setMinimized]);

  return {
    isOpen: state.isOpen,
    isMinimized: state.isMinimized,
    unreadCount: state.unreadCount,
    hasInteracted: state.hasInteracted,
    toggle,
    open,
    close,
    minimize,
    restore,
    clearUnread,
  };
}

export default FlowChatContext;
