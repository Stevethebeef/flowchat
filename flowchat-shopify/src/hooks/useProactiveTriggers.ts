/**
 * Proactive Trigger Hooks for n8n Chat Widget
 * Handles exit intent, scroll depth, time-based, and idle triggers
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface ProactiveTrigger {
  type: 'exit_intent' | 'scroll_depth' | 'time_on_page' | 'idle_time' | 'cart_abandonment';
  enabled: boolean;
  message?: string;
  delay?: number; // seconds
  threshold?: number; // percentage for scroll, seconds for time/idle
  showOnce?: boolean;
  pageTypes?: string[]; // restrict to specific page types
}

export interface UseProactiveTriggersOptions {
  triggers: ProactiveTrigger[];
  pageType: string;
  hasItemsInCart: boolean;
  isOpen: boolean;
  onTrigger: (trigger: ProactiveTrigger) => void;
}

interface TriggerState {
  exitIntentFired: boolean;
  scrollDepthFired: boolean;
  timeOnPageFired: boolean;
  idleTimeFired: boolean;
  cartAbandonmentFired: boolean;
}

const STORAGE_KEY = 'n8n_chat_triggers_fired';

function getStoredTriggerState(): TriggerState {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    // Ignore storage errors
  }
  return {
    exitIntentFired: false,
    scrollDepthFired: false,
    timeOnPageFired: false,
    idleTimeFired: false,
    cartAbandonmentFired: false,
  };
}

function storeTriggerState(state: TriggerState): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Hook for managing proactive chat triggers
 */
export function useProactiveTriggers({
  triggers,
  pageType,
  hasItemsInCart,
  isOpen,
  onTrigger,
}: UseProactiveTriggersOptions): void {
  const [triggerState, setTriggerState] = useState<TriggerState>(getStoredTriggerState);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timeOnPageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  // Helper to check if trigger should fire on current page
  const shouldTriggerOnPage = useCallback(
    (trigger: ProactiveTrigger): boolean => {
      if (!trigger.pageTypes || trigger.pageTypes.length === 0) {
        return true;
      }
      return trigger.pageTypes.includes(pageType);
    },
    [pageType]
  );

  // Helper to fire a trigger
  const fireTrigger = useCallback(
    (trigger: ProactiveTrigger, stateKey: keyof TriggerState) => {
      if (isOpen) return; // Don't trigger if chat is already open
      if (trigger.showOnce && triggerState[stateKey]) return; // Already fired

      onTrigger(trigger);

      if (trigger.showOnce) {
        setTriggerState((prev) => {
          const newState = { ...prev, [stateKey]: true };
          storeTriggerState(newState);
          return newState;
        });
      }
    },
    [isOpen, triggerState, onTrigger]
  );

  // Exit Intent Detection
  useEffect(() => {
    const exitIntentTrigger = triggers.find(
      (t) => t.type === 'exit_intent' && t.enabled && shouldTriggerOnPage(t)
    );

    if (!exitIntentTrigger) return;

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves through the top of the viewport
      if (e.clientY <= 0) {
        fireTrigger(exitIntentTrigger, 'exitIntentFired');
      }
    };

    // Add delay before enabling to prevent false triggers on page load
    const timeout = setTimeout(() => {
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [triggers, shouldTriggerOnPage, fireTrigger]);

  // Scroll Depth Detection
  useEffect(() => {
    const scrollTrigger = triggers.find(
      (t) => t.type === 'scroll_depth' && t.enabled && shouldTriggerOnPage(t)
    );

    if (!scrollTrigger) return;

    const threshold = scrollTrigger.threshold || 50; // Default 50%

    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight <= 0) return;

      const scrollPercentage = (window.scrollY / scrollHeight) * 100;

      if (scrollPercentage >= threshold) {
        fireTrigger(scrollTrigger, 'scrollDepthFired');
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [triggers, shouldTriggerOnPage, fireTrigger]);

  // Time on Page Detection
  useEffect(() => {
    const timeTrigger = triggers.find(
      (t) => t.type === 'time_on_page' && t.enabled && shouldTriggerOnPage(t)
    );

    if (!timeTrigger) return;

    const delay = (timeTrigger.threshold || 30) * 1000; // Default 30 seconds

    timeOnPageTimerRef.current = setTimeout(() => {
      fireTrigger(timeTrigger, 'timeOnPageFired');
    }, delay);

    return () => {
      if (timeOnPageTimerRef.current) {
        clearTimeout(timeOnPageTimerRef.current);
      }
    };
  }, [triggers, shouldTriggerOnPage, fireTrigger]);

  // Idle Time Detection
  useEffect(() => {
    const idleTrigger = triggers.find(
      (t) => t.type === 'idle_time' && t.enabled && shouldTriggerOnPage(t)
    );

    if (!idleTrigger) return;

    const idleThreshold = (idleTrigger.threshold || 60) * 1000; // Default 60 seconds

    const resetIdleTimer = () => {
      lastActivityRef.current = Date.now();

      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }

      idleTimerRef.current = setTimeout(() => {
        fireTrigger(idleTrigger, 'idleTimeFired');
      }, idleThreshold);
    };

    // Activity events to track
    const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    activityEvents.forEach((event) => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // Start the initial timer
    resetIdleTimer();

    return () => {
      activityEvents.forEach((event) => {
        document.removeEventListener(event, resetIdleTimer);
      });
      if (idleTimerRef.current) {
        clearTimeout(idleTimerRef.current);
      }
    };
  }, [triggers, shouldTriggerOnPage, fireTrigger]);

  // Cart Abandonment Detection (exit intent when cart has items)
  useEffect(() => {
    const cartTrigger = triggers.find(
      (t) => t.type === 'cart_abandonment' && t.enabled && shouldTriggerOnPage(t)
    );

    if (!cartTrigger || !hasItemsInCart) return;

    const handleBeforeUnload = (_e: BeforeUnloadEvent) => {
      // Note: We can't show our custom UI here, but we can set a flag
      // The actual message will be shown via exit intent
      fireTrigger(cartTrigger, 'cartAbandonmentFired');
    };

    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0) {
        fireTrigger(cartTrigger, 'cartAbandonmentFired');
      }
    };

    // Add delay before enabling
    const timeout = setTimeout(() => {
      window.addEventListener('beforeunload', handleBeforeUnload);
      document.addEventListener('mouseleave', handleMouseLeave);
    }, 2000);

    return () => {
      clearTimeout(timeout);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [triggers, hasItemsInCart, shouldTriggerOnPage, fireTrigger]);
}

/**
 * Hook for auto-open functionality
 */
export function useAutoOpen(
  enabled: boolean,
  delay: number,
  isOpen: boolean,
  onOpen: () => void
): void {
  const hasAutoOpenedRef = useRef(false);

  useEffect(() => {
    if (!enabled || hasAutoOpenedRef.current || isOpen) return;

    const timer = setTimeout(() => {
      hasAutoOpenedRef.current = true;
      onOpen();
    }, delay * 1000);

    return () => clearTimeout(timer);
  }, [enabled, delay, isOpen, onOpen]);
}

/**
 * Reset trigger state (useful for testing or admin purposes)
 */
export function resetTriggerState(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}
