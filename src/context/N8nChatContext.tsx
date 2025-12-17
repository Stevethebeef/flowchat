/**
 * N8n Chat Context Provider
 *
 * Provides global state and utilities for n8n Chat components.
 */

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { N8nChatConfig, ChatContext as ChatContextData, ChatMessage } from '../types';

interface N8nChatState {
  isOpen: boolean;
  isMinimized: boolean;
  isLoading: boolean;
  error: string | null;
  unreadCount: number;
  hasInteracted: boolean;
}

interface N8nChatContextValue {
  // Config
  config: N8nChatConfig | null;
  context: ChatContextData | null;
  webhookUrl: string | null;
  sessionId: string | null;
  apiUrl: string | null;

  // State
  state: N8nChatState;

  // Actions
  setConfig: (config: N8nChatConfig) => void;
  setContext: (context: ChatContextData) => void;
  setWebhookUrl: (url: string) => void;
  setSessionId: (id: string) => void;
  setApiUrl: (url: string) => void;
  setOpen: (isOpen: boolean) => void;
  setMinimized: (isMinimized: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  incrementUnread: () => void;
  clearUnread: () => void;
  markInteracted: () => void;
}

const N8nChatContext = createContext<N8nChatContextValue | null>(null);

interface N8nChatProviderProps {
  children: ReactNode;
  initialConfig?: N8nChatConfig;
  initialContext?: ChatContextData;
  initialWebhookUrl?: string;
  initialSessionId?: string;
  initialApiUrl?: string;
}

export function N8nChatProvider({
  children,
  initialConfig,
  initialContext,
  initialWebhookUrl,
  initialSessionId,
  initialApiUrl,
}: N8nChatProviderProps) {
  const [config, setConfig] = useState<N8nChatConfig | null>(initialConfig || null);
  const [context, setContext] = useState<ChatContextData | null>(initialContext || null);
  const [webhookUrl, setWebhookUrl] = useState<string | null>(initialWebhookUrl || null);
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null);
  const [apiUrl, setApiUrl] = useState<string | null>(initialApiUrl || null);

  const [state, setState] = useState<N8nChatState>({
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
        sessionStorage.setItem(`n8n-chat_interacted_${sessionId}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }
  }, [state.hasInteracted, sessionId]);

  // Load interaction state
  useEffect(() => {
    if (sessionId) {
      try {
        const interacted = sessionStorage.getItem(`n8n-chat_interacted_${sessionId}`);
        if (interacted === 'true') {
          setState((prev) => ({ ...prev, hasInteracted: true }));
        }
      } catch {
        // Ignore storage errors
      }
    }
  }, [sessionId]);

  const value: N8nChatContextValue = {
    config,
    context,
    webhookUrl,
    sessionId,
    apiUrl,
    state,
    setConfig,
    setContext,
    setWebhookUrl,
    setSessionId,
    setApiUrl,
    setOpen,
    setMinimized,
    setLoading,
    setError,
    incrementUnread,
    clearUnread,
    markInteracted,
  };

  return (
    <N8nChatContext.Provider value={value}>{children}</N8nChatContext.Provider>
  );
}

/**
 * Hook to access n8n Chat context
 */
export function useN8nChat(): N8nChatContextValue {
  const context = useContext(N8nChatContext);

  if (!context) {
    throw new Error('useN8nChat must be used within a N8nChatProvider');
  }

  return context;
}

/**
 * Hook to access just the config
 */
export function useN8nChatConfig(): N8nChatConfig | null {
  const { config } = useN8nChat();
  return config;
}

/**
 * Hook to access bubble state
 */
export function useBubbleState() {
  const { state, setOpen, setMinimized, clearUnread, markInteracted } = useN8nChat();

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

export default N8nChatContext;
