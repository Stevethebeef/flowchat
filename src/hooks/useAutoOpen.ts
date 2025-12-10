/**
 * useAutoOpen Hook
 *
 * Custom hook for managing auto-open trigger behavior for bubble widget.
 * Extracted from useBubble for reusability per 05-frontend-components.md spec.
 */

import { useEffect, useRef, useCallback } from 'react';

export interface AutoOpenTriggerConfig {
  enabled: boolean;
  trigger: 'delay' | 'scroll' | 'exit-intent' | 'idle' | 'time-on-page' | 'element-visible' | 'click';
  delay?: number;
  scrollPercent?: number;
  idleTime?: number;
  elementSelector?: string;
  oncePerSession?: boolean;
  oncePerDay?: boolean;
  skipIfInteracted?: boolean;
  excludeMobile?: boolean;
}

interface UseAutoOpenOptions {
  enabled: boolean;
  trigger: AutoOpenTriggerConfig['trigger'];
  delay?: number;
  scrollPercent?: number;
  idleTime?: number;
  elementSelector?: string;
  oncePerSession?: boolean;
  oncePerDay?: boolean;
  skipIfInteracted?: boolean;
  excludeMobile?: boolean;
  sessionKey: string;
  hasInteracted?: boolean;
  isOpen?: boolean;
  onTrigger: () => void;
}

interface UseAutoOpenReturn {
  hasTriggered: boolean;
  reset: () => void;
}

/**
 * Hook to manage auto-open behavior for bubble widget
 */
export function useAutoOpen({
  enabled,
  trigger,
  delay = 5000,
  scrollPercent = 50,
  idleTime = 30000,
  elementSelector,
  oncePerSession = true,
  oncePerDay = false,
  skipIfInteracted = true,
  excludeMobile = false,
  sessionKey,
  hasInteracted = false,
  isOpen = false,
  onTrigger,
}: UseAutoOpenOptions): UseAutoOpenReturn {
  const hasTriggeredRef = useRef(false);
  const cleanupRef = useRef<(() => void) | null>(null);

  // Check if should block auto-open
  const shouldBlock = useCallback((): boolean => {
    // Already triggered
    if (hasTriggeredRef.current) return true;

    // Already open
    if (isOpen) return true;

    // Skip if interacted
    if (skipIfInteracted && hasInteracted) return true;

    // Check mobile exclusion
    if (excludeMobile && typeof window !== 'undefined' && window.innerWidth <= 768) {
      return true;
    }

    // Check once per session
    if (oncePerSession) {
      try {
        const key = `flowchat_autoopen_${sessionKey}`;
        if (sessionStorage.getItem(key)) return true;
      } catch {
        // Ignore storage errors
      }
    }

    // Check once per day
    if (oncePerDay) {
      try {
        const key = `flowchat_autoopen_day_${sessionKey}`;
        const lastOpen = localStorage.getItem(key);
        if (lastOpen) {
          const lastDate = new Date(lastOpen).toDateString();
          const today = new Date().toDateString();
          if (lastDate === today) return true;
        }
      } catch {
        // Ignore storage errors
      }
    }

    return false;
  }, [isOpen, skipIfInteracted, hasInteracted, excludeMobile, oncePerSession, oncePerDay, sessionKey]);

  // Mark as triggered
  const markTriggered = useCallback(() => {
    hasTriggeredRef.current = true;

    if (oncePerSession) {
      try {
        sessionStorage.setItem(`flowchat_autoopen_${sessionKey}`, 'true');
      } catch {
        // Ignore storage errors
      }
    }

    if (oncePerDay) {
      try {
        localStorage.setItem(`flowchat_autoopen_day_${sessionKey}`, new Date().toISOString());
      } catch {
        // Ignore storage errors
      }
    }
  }, [oncePerSession, oncePerDay, sessionKey]);

  // Trigger auto-open
  const triggerAutoOpen = useCallback(() => {
    if (shouldBlock()) return;

    markTriggered();
    onTrigger();
  }, [shouldBlock, markTriggered, onTrigger]);

  // Reset function
  const reset = useCallback(() => {
    hasTriggeredRef.current = false;
    try {
      sessionStorage.removeItem(`flowchat_autoopen_${sessionKey}`);
      localStorage.removeItem(`flowchat_autoopen_day_${sessionKey}`);
    } catch {
      // Ignore storage errors
    }
  }, [sessionKey]);

  // Set up auto-open based on trigger type
  useEffect(() => {
    if (!enabled || hasTriggeredRef.current) return;

    // Clean up previous listeners
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }

    switch (trigger) {
      case 'delay': {
        const timeout = setTimeout(triggerAutoOpen, delay);
        cleanupRef.current = () => clearTimeout(timeout);
        break;
      }

      case 'scroll': {
        const handleScroll = () => {
          const scrollTop = window.scrollY;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const scrollPercentage = (scrollTop / docHeight) * 100;

          if (scrollPercentage >= scrollPercent) {
            triggerAutoOpen();
          }
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        cleanupRef.current = () => window.removeEventListener('scroll', handleScroll);
        break;
      }

      case 'exit-intent': {
        const handleMouseLeave = (e: MouseEvent) => {
          if (e.clientY <= 0) {
            triggerAutoOpen();
          }
        };

        document.addEventListener('mouseleave', handleMouseLeave);
        cleanupRef.current = () => document.removeEventListener('mouseleave', handleMouseLeave);
        break;
      }

      case 'idle': {
        let idleTimeout: ReturnType<typeof setTimeout>;
        const resetTimer = () => {
          clearTimeout(idleTimeout);
          idleTimeout = setTimeout(triggerAutoOpen, idleTime);
        };

        const events = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
        events.forEach((event) => {
          window.addEventListener(event, resetTimer, { passive: true });
        });

        resetTimer();

        cleanupRef.current = () => {
          clearTimeout(idleTimeout);
          events.forEach((event) => {
            window.removeEventListener(event, resetTimer);
          });
        };
        break;
      }

      case 'time-on-page': {
        const timeout = setTimeout(triggerAutoOpen, delay);
        cleanupRef.current = () => clearTimeout(timeout);
        break;
      }

      case 'element-visible': {
        if (!elementSelector) break;

        const observer = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (entry.isIntersecting) {
                triggerAutoOpen();
                observer.disconnect();
              }
            });
          },
          { threshold: 0.5 }
        );

        const element = document.querySelector(elementSelector);
        if (element) {
          observer.observe(element);
        }

        cleanupRef.current = () => observer.disconnect();
        break;
      }

      case 'click': {
        if (!elementSelector) break;

        const handleClick = () => triggerAutoOpen();
        const element = document.querySelector(elementSelector);
        if (element) {
          element.addEventListener('click', handleClick);
          cleanupRef.current = () => element.removeEventListener('click', handleClick);
        }
        break;
      }
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [enabled, trigger, delay, scrollPercent, idleTime, elementSelector, triggerAutoOpen]);

  return {
    hasTriggered: hasTriggeredRef.current,
    reset,
  };
}

export default useAutoOpen;
