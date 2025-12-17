/**
 * useBubble Hook
 *
 * Custom hook for managing bubble widget state and auto-open behavior.
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type { AutoOpenConfig, BubbleConfig } from '../types';

interface UseBubbleOptions {
  bubbleConfig: BubbleConfig;
  autoOpenConfig: AutoOpenConfig;
  sessionId: string;
  onOpen?: () => void;
  onClose?: () => void;
}

interface UseBubbleReturn {
  isOpen: boolean;
  unreadCount: number;
  position: { x: number; y: number };
  toggle: () => void;
  open: () => void;
  close: () => void;
  incrementUnread: () => void;
  clearUnread: () => void;
}

export function useBubble({
  bubbleConfig,
  autoOpenConfig,
  sessionId,
  onOpen,
  onClose,
}: UseBubbleOptions): UseBubbleReturn {
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasAutoOpened, setHasAutoOpened] = useState(false);
  const hasInteractedRef = useRef(false);
  const autoOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Calculate position
  const position = {
    x: bubbleConfig.offsetX,
    y: bubbleConfig.offsetY,
  };

  // Check if auto-open should be blocked
  const shouldBlockAutoOpen = useCallback((): boolean => {
    const conditions = autoOpenConfig.conditions;

    // Check if already interacted
    if (conditions.skipIfInteracted && hasInteractedRef.current) {
      return true;
    }

    // Check once per session
    if (conditions.oncePerSession) {
      try {
        const key = `n8n_chat_autoopen_${sessionId}`;
        if (sessionStorage.getItem(key)) {
          return true;
        }
      } catch {
        // Ignore storage errors
      }
    }

    // Check once per day
    if (conditions.oncePerDay) {
      try {
        const key = `n8n_chat_autoopen_day_${sessionId}`;
        const lastOpen = localStorage.getItem(key);
        if (lastOpen) {
          const lastDate = new Date(lastOpen).toDateString();
          const today = new Date().toDateString();
          if (lastDate === today) {
            return true;
          }
        }
      } catch {
        // Ignore storage errors
      }
    }

    // Check mobile exclusion
    if (conditions.excludeMobile && window.innerWidth <= 768) {
      return true;
    }

    // Note: loggedInOnly and guestOnly are handled server-side

    return false;
  }, [autoOpenConfig.conditions, sessionId]);

  // Mark auto-open as triggered
  const markAutoOpened = useCallback(() => {
    setHasAutoOpened(true);

    const conditions = autoOpenConfig.conditions;

    if (conditions.oncePerSession) {
      try {
        sessionStorage.setItem(`n8n_chat_autoopen_${sessionId}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }

    if (conditions.oncePerDay) {
      try {
        localStorage.setItem(
          `n8n_chat_autoopen_day_${sessionId}`,
          new Date().toISOString()
        );
      } catch {
        // Ignore storage errors
      }
    }
  }, [autoOpenConfig.conditions, sessionId]);

  // Trigger auto-open
  const triggerAutoOpen = useCallback(() => {
    if (hasAutoOpened || isOpen || shouldBlockAutoOpen()) {
      return;
    }

    setIsOpen(true);
    markAutoOpened();
    onOpen?.();
  }, [hasAutoOpened, isOpen, shouldBlockAutoOpen, markAutoOpened, onOpen]);

  // Toggle
  const toggle = useCallback(() => {
    hasInteractedRef.current = true;
    setIsOpen((prev) => {
      const newState = !prev;
      if (newState) {
        setUnreadCount(0);
        onOpen?.();
      } else {
        onClose?.();
      }
      return newState;
    });
  }, [onOpen, onClose]);

  // Open
  const open = useCallback(() => {
    hasInteractedRef.current = true;
    if (!isOpen) {
      setIsOpen(true);
      setUnreadCount(0);
      onOpen?.();
    }
  }, [isOpen, onOpen]);

  // Close
  const close = useCallback(() => {
    if (isOpen) {
      setIsOpen(false);
      onClose?.();
    }
  }, [isOpen, onClose]);

  // Increment unread
  const incrementUnread = useCallback(() => {
    if (!isOpen) {
      setUnreadCount((prev) => prev + 1);
    }
  }, [isOpen]);

  // Clear unread
  const clearUnread = useCallback(() => {
    setUnreadCount(0);
  }, []);

  // Set up auto-open based on trigger type
  useEffect(() => {
    if (!autoOpenConfig.enabled || hasAutoOpened) {
      return;
    }

    const trigger = autoOpenConfig.trigger;

    // Delay trigger
    if (trigger === 'delay' && autoOpenConfig.delay) {
      autoOpenTimeoutRef.current = setTimeout(() => {
        triggerAutoOpen();
      }, autoOpenConfig.delay);

      return () => {
        if (autoOpenTimeoutRef.current) {
          clearTimeout(autoOpenTimeoutRef.current);
        }
      };
    }

    // Scroll trigger
    if (trigger === 'scroll' && autoOpenConfig.scrollPercentage) {
      const handleScroll = () => {
        const scrollTop = window.scrollY;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const scrollPercent = (scrollTop / docHeight) * 100;

        if (scrollPercent >= (autoOpenConfig.scrollPercentage || 50)) {
          triggerAutoOpen();
        }
      };

      window.addEventListener('scroll', handleScroll, { passive: true });

      return () => {
        window.removeEventListener('scroll', handleScroll);
      };
    }

    // Exit intent trigger
    if (trigger === 'exit-intent') {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerAutoOpen();
        }
      };

      document.addEventListener('mouseleave', handleMouseLeave);

      return () => {
        document.removeEventListener('mouseleave', handleMouseLeave);
      };
    }

    // Idle trigger
    if (trigger === 'idle' && autoOpenConfig.idleTime) {
      let idleTimeout: ReturnType<typeof setTimeout>;
      const resetTimer = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          triggerAutoOpen();
        }, autoOpenConfig.idleTime);
      };

      const events = ['mousemove', 'keydown', 'scroll', 'touchstart'];
      events.forEach((event) => {
        window.addEventListener(event, resetTimer, { passive: true });
      });

      resetTimer();

      return () => {
        clearTimeout(idleTimeout);
        events.forEach((event) => {
          window.removeEventListener(event, resetTimer);
        });
      };
    }
  }, [autoOpenConfig, hasAutoOpened, triggerAutoOpen]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (autoOpenTimeoutRef.current) {
        clearTimeout(autoOpenTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    unreadCount,
    position,
    toggle,
    open,
    close,
    incrementUnread,
    clearUnread,
  };
}

export default useBubble;
