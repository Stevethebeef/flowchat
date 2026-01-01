/**
 * Main n8n Chat Widget Component
 * Uses Assistant UI with LocalRuntime for n8n integration
 * Includes proactive triggers, voice input, file upload, and JavaScript API
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type ChatModelAdapter,
} from '@assistant-ui/react';
import { BubbleTrigger } from './BubbleTrigger';
import { ChatPanel } from './ChatPanel';
import { createN8nChatModelAdapter } from '@/lib/n8nChatModelAdapter';
import {
  createN8nChatAPI,
  N8nChatEventEmitter,
  type RuntimeConfig,
} from '@/lib/api';
import { I18nProvider, isRTL, normalizeLocale } from '@/lib/i18n';
import {
  useProactiveTriggers,
  useAutoOpen,
  type ProactiveTrigger,
} from '@/hooks';
import type { N8nChatWidgetProps, N8nChatContext, CartContext } from '@/types';

const STORAGE_KEY_SESSION = 'n8n_chat_session_id';
const STORAGE_KEY_OPEN = 'n8n_chat_open';
const STORAGE_KEY_MESSAGE_COUNT = 'n8n_chat_message_count';
const STORAGE_KEY_SESSION_START = 'n8n_chat_session_start';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

async function fetchFreshCart(): Promise<CartContext | null> {
  try {
    const response = await fetch('/cart.js');
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}

export function N8nChatWidget({ config, context }: N8nChatWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [sessionId, setSessionId] = useState<string>('');
  const [currentContext, setCurrentContext] = useState<N8nChatContext>(context);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig>({
    primaryColor: config.primaryColor,
    theme: config.theme,
    position: config.position,
    welcomeMessage: config.welcomeMessage,
    placeholderText: config.placeholderText,
  });
  const [proactiveMessage, setProactiveMessage] = useState<string | null>(null);

  // Refs for API and event emitter
  const eventEmitterRef = useRef<N8nChatEventEmitter>(new N8nChatEventEmitter());
  const messageCountRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(0);
  const isOpenRef = useRef(isOpen);
  const runtimeRef = useRef<ReturnType<typeof useLocalRuntime> | null>(null);

  // Keep isOpenRef in sync
  useEffect(() => {
    isOpenRef.current = isOpen;
  }, [isOpen]);

  // Initialize session ID and session tracking
  useEffect(() => {
    let storedSessionId = localStorage.getItem(STORAGE_KEY_SESSION);
    const isNewSession = !storedSessionId;

    if (!storedSessionId) {
      storedSessionId = generateSessionId();
      localStorage.setItem(STORAGE_KEY_SESSION, storedSessionId);
    }
    setSessionId(storedSessionId);

    // Restore or initialize message count
    const storedCount = parseInt(localStorage.getItem(STORAGE_KEY_MESSAGE_COUNT) || '0', 10);
    messageCountRef.current = storedCount;

    // Restore or set session start time
    let startTime = parseInt(localStorage.getItem(STORAGE_KEY_SESSION_START) || '0', 10);
    if (!startTime) {
      startTime = Date.now();
      localStorage.setItem(STORAGE_KEY_SESSION_START, startTime.toString());
    }
    sessionStartTimeRef.current = startTime;

    // Restore open state
    const wasOpen = localStorage.getItem(STORAGE_KEY_OPEN) === 'true';
    if (wasOpen) {
      setIsOpen(true);
    }

    // Emit session start event
    eventEmitterRef.current.emit('session:start', {
      sessionId: storedSessionId,
      isNew: isNewSession,
    });
  }, []);

  // API helper functions
  const openWidget = useCallback((trigger: 'user' | 'auto' | 'api' | 'proactive' = 'api') => {
    setIsOpen(true);
    eventEmitterRef.current.emit('widget:open', { trigger });
  }, []);

  const closeWidget = useCallback((trigger: 'user' | 'api' | 'escape' = 'api') => {
    setIsOpen(false);
    eventEmitterRef.current.emit('widget:close', { trigger });
  }, []);

  const resetSession = useCallback(() => {
    const oldSessionId = sessionId;
    const newSessionId = generateSessionId();

    localStorage.setItem(STORAGE_KEY_SESSION, newSessionId);
    localStorage.setItem(STORAGE_KEY_MESSAGE_COUNT, '0');
    localStorage.setItem(STORAGE_KEY_SESSION_START, Date.now().toString());

    eventEmitterRef.current.emit('session:end', {
      sessionId: oldSessionId,
      messageCount: messageCountRef.current,
    });

    messageCountRef.current = 0;
    sessionStartTimeRef.current = Date.now();
    setSessionId(newSessionId);

    eventEmitterRef.current.emit('session:start', {
      sessionId: newSessionId,
      isNew: true,
    });
  }, [sessionId]);

  const showProactiveMessage = useCallback((message: string) => {
    setProactiveMessage(message);
    openWidget('proactive');
  }, [openWidget]);

  const triggerProactive = useCallback((trigger: ProactiveTrigger) => {
    if (trigger.message) {
      showProactiveMessage(trigger.message);
    } else {
      openWidget('proactive');
    }
    eventEmitterRef.current.emit('trigger:fired', { trigger });
  }, [openWidget, showProactiveMessage]);

  const incrementMessageCount = useCallback(() => {
    messageCountRef.current += 1;
    localStorage.setItem(STORAGE_KEY_MESSAGE_COUNT, messageCountRef.current.toString());
  }, []);

  // Send a user message programmatically
  // Note: Programmatic message sending requires direct thread access
  // This is a placeholder for future implementation
  const sendMessage = useCallback((message: string) => {
    console.warn('[n8n Chat] Programmatic message sending not yet implemented in v6.0.0');
    eventEmitterRef.current.emit('message:sent', {
      content: message,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Send a bot message (display only, doesn't go to n8n)
  // Note: Programmatic message display requires direct thread access
  const sendBotMessage = useCallback((message: string) => {
    console.warn('[n8n Chat] Programmatic bot message not yet implemented in v6.0.0');
    eventEmitterRef.current.emit('message:received', {
      content: message,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Clear conversation history
  // Note: Clearing history requires direct thread access
  const clearHistory = useCallback(() => {
    console.warn('[n8n Chat] Clear history not yet implemented in v6.0.0');
    messageCountRef.current = 0;
    localStorage.setItem(STORAGE_KEY_MESSAGE_COUNT, '0');
  }, []);

  // Expose global API
  useEffect(() => {
    if (!sessionId) return;

    const api = createN8nChatAPI(
      {
        open: openWidget,
        close: closeWidget,
        toggle: () => {
          if (isOpenRef.current) {
            closeWidget('api');
          } else {
            openWidget('api');
          }
        },
        isOpen: () => isOpenRef.current,
        getSessionId: () => sessionId,
        resetSession,
        showMessage: showProactiveMessage,
        triggerProactive,
        setConfig: (newConfig) => setRuntimeConfig((prev) => ({ ...prev, ...newConfig })),
        getConfig: () => runtimeConfig,
        getMessageCount: () => messageCountRef.current,
        getSessionStartTime: () => sessionStartTimeRef.current,
        send: sendMessage,
        sendBotMessage,
        clearHistory,
      },
      eventEmitterRef.current
    );

    window.N8nChat = api;

    // Emit ready event
    eventEmitterRef.current.emit('widget:ready', {
      version: '6.0.0',
      sessionId,
    });

    return () => {
      delete window.N8nChat;
    };
  }, [
    sessionId,
    runtimeConfig,
    openWidget,
    closeWidget,
    resetSession,
    showProactiveMessage,
    triggerProactive,
    sendMessage,
    sendBotMessage,
    clearHistory,
  ]);

  // Use auto-open hook
  useAutoOpen(
    config.autoOpen && !hasInteracted,
    config.autoOpenDelay,
    isOpen,
    () => openWidget('auto')
  );

  // Use proactive triggers hook
  useProactiveTriggers({
    triggers: config.proactiveTriggers || [],
    pageType: context.page.type,
    hasItemsInCart: Boolean(context.cart?.item_count && context.cart.item_count > 0),
    isOpen,
    onTrigger: triggerProactive,
  });

  // Persist open state
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_OPEN, isOpen.toString());
  }, [isOpen]);

  // Apply theme (using runtime config for dynamic updates)
  useEffect(() => {
    const root = document.getElementById('n8n-chat-widget-root');
    if (!root) return;

    const theme = runtimeConfig.theme || config.theme;
    let effectiveTheme = theme;
    if (theme === 'auto') {
      effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    root.setAttribute('data-theme', effectiveTheme);

    // Apply custom primary color
    const primaryColor = runtimeConfig.primaryColor || config.primaryColor;
    if (primaryColor) {
      root.style.setProperty('--fc-primary', primaryColor);
    }

    if (theme === 'auto') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handler = (e: MediaQueryListEvent) => {
        root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
  }, [config.theme, config.primaryColor, runtimeConfig.theme, runtimeConfig.primaryColor]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeWidget('escape');
        // Return focus to bubble
        const bubble = document.querySelector('.fc-bubble-trigger') as HTMLElement;
        bubble?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeWidget]);

  // Clear proactive message when user interacts
  useEffect(() => {
    if (hasInteracted && proactiveMessage) {
      setProactiveMessage(null);
    }
  }, [hasInteracted, proactiveMessage]);

  // Context refresh callback for fresh cart data
  const onContextRefresh = useCallback(async (): Promise<N8nChatContext> => {
    const freshCart = await fetchFreshCart();
    const updatedContext: N8nChatContext = {
      ...currentContext,
      cart: freshCart || currentContext.cart,
      timestamp: new Date().toISOString(),
    };
    setCurrentContext(updatedContext);
    return updatedContext;
  }, [currentContext]);

  // Create n8n ChatModelAdapter
  const chatModelAdapter = useMemo<ChatModelAdapter>(() => {
    if (!sessionId || !config.webhookUrl) {
      return {
        async *run() {
          yield { content: [{ type: 'text', text: 'Connecting...' }] };
        },
      };
    }

    return createN8nChatModelAdapter({
      webhookUrl: config.webhookUrl,
      sessionId,
      context: currentContext,
      onContextRefresh,
    });
  }, [config.webhookUrl, sessionId, currentContext, onContextRefresh]);

  // Create LocalRuntime with the adapter
  const runtime = useLocalRuntime(chatModelAdapter);

  // Store runtime ref for API access
  useEffect(() => {
    runtimeRef.current = runtime;
  }, [runtime]);

  const handleToggle = useCallback(() => {
    if (isOpen) {
      closeWidget('user');
    } else {
      openWidget('user');
    }
    setHasInteracted(true);
  }, [isOpen, openWidget, closeWidget]);

  const handleClose = useCallback(() => {
    closeWidget('user');
    setHasInteracted(true);
  }, [closeWidget]);

  // Handle message sent (for analytics)
  const handleMessageSent = useCallback((content: string) => {
    incrementMessageCount();
    eventEmitterRef.current.emit('message:sent', {
      content,
      timestamp: new Date().toISOString(),
    });
  }, [incrementMessageCount]);

  // Handle message received (for analytics)
  const handleMessageReceived = useCallback((content: string) => {
    eventEmitterRef.current.emit('message:received', {
      content,
      timestamp: new Date().toISOString(),
    });
  }, []);

  // Don't render if not configured
  if (!config.webhookUrl) {
    return null;
  }

  // Merge static config with runtime config
  const effectivePosition = runtimeConfig.position || config.position;
  const effectiveColor = runtimeConfig.primaryColor || config.primaryColor;

  // Get locale from Shopify context or config
  const effectiveLocale = config.locale || context.locale?.language || 'en';

  return (
    <I18nProvider
      locale={effectiveLocale}
      customTranslations={config.customTranslations}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <div
          className="fc-widget-container"
          data-position={effectivePosition}
          dir={isRTL(normalizeLocale(effectiveLocale)) ? 'rtl' : 'ltr'}
        >
          <BubbleTrigger
            onClick={handleToggle}
            isOpen={isOpen}
            size={config.bubbleSize}
            icon={config.bubbleIcon}
            primaryColor={effectiveColor}
            position={effectivePosition}
            proactiveMessage={proactiveMessage}
          />

          {isOpen && (
            <ChatPanel
              config={{
                ...config,
                welcomeMessage: runtimeConfig.welcomeMessage || config.welcomeMessage,
                placeholderText: runtimeConfig.placeholderText || config.placeholderText,
                primaryColor: effectiveColor,
              }}
              onClose={handleClose}
              position={effectivePosition}
              proactiveMessage={proactiveMessage}
              onMessageSent={handleMessageSent}
              onMessageReceived={handleMessageReceived}
              enableVoice={config.enableVoice}
              enableFileUpload={config.enableFileUpload}
            />
          )}
        </div>
      </AssistantRuntimeProvider>
    </I18nProvider>
  );
}

// Also export as FlowChatWidget for backwards compatibility
export { N8nChatWidget as FlowChatWidget };
