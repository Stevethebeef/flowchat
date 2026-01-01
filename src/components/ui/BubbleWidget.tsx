/**
 * Bubble Widget Component - Full-featured chat bubble using assistant-ui
 * Implements all backend settings from Display tab
 */

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  AssistantModalPrimitive,
} from '@assistant-ui/react';
import { N8nRuntimeAdapter } from '../../runtime/N8nRuntimeAdapter';
import { Thread } from './Thread';
import type { ChatConfig } from '../../types';

// ============================================================================
// Icon Components
// ============================================================================

const ChatIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const MessageIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const HelpIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const HeadphonesIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
    <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
  </svg>
);

const SparklesIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
    <path d="M5 3v4" />
    <path d="M19 17v4" />
    <path d="M3 5h4" />
    <path d="M17 19h4" />
  </svg>
);

const CameraIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
    <circle cx="12" cy="13" r="3" />
  </svg>
);

const CloseIcon: React.FC<{ size?: number }> = ({ size = 24 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

// Icon mapping
const iconComponents: Record<string, React.FC<{ size?: number }>> = {
  chat: ChatIcon,
  message: MessageIcon,
  help: HelpIcon,
  headphones: HeadphonesIcon,
  sparkles: SparklesIcon,
  camera: CameraIcon,
};

// ============================================================================
// Bubble Icon Component (handles icon selection + custom URL)
// ============================================================================

interface BubbleIconProps {
  icon?: string;
  customIconUrl?: string;
  size: number;
  isOpen: boolean;
}

const BubbleIcon: React.FC<BubbleIconProps> = ({ icon, customIconUrl, size, isOpen }) => {
  const [imgError, setImgError] = useState(false);

  if (isOpen) {
    return <CloseIcon size={size} />;
  }

  // Custom icon URL takes precedence
  if (customIconUrl && !imgError) {
    return (
      <img
        src={customIconUrl}
        alt="Chat"
        style={{ width: size, height: size, objectFit: 'contain' }}
        onError={() => setImgError(true)}
      />
    );
  }

  // Map icon name to component
  const IconComponent = iconComponents[icon || 'chat'] || ChatIcon;
  return <IconComponent size={size} />;
};

// ============================================================================
// Unread Badge Component
// ============================================================================

interface UnreadBadgeProps {
  count: number;
  show: boolean;
  primaryColor?: string;
}

const UnreadBadge: React.FC<UnreadBadgeProps> = ({ count, show, primaryColor }) => {
  if (!show || count === 0) return null;

  return (
    <span
      className="flowchat-unread-badge"
      style={primaryColor ? { backgroundColor: primaryColor } : undefined}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
};

// ============================================================================
// Bubble Text Label Component
// ============================================================================

interface BubbleTextProps {
  text?: string;
  isOpen: boolean;
  position?: string;
}

const BubbleText: React.FC<BubbleTextProps> = ({ text, isOpen, position }) => {
  if (!text || isOpen) return null;

  const isLeft = position?.includes('left');

  return (
    <span
      className="flowchat-bubble-text"
      style={{
        [isLeft ? 'marginLeft' : 'marginRight']: '12px',
        order: isLeft ? 1 : -1,
      }}
    >
      {text}
    </span>
  );
};

// ============================================================================
// Header Component
// ============================================================================

interface ChatHeaderProps {
  title?: string;
  onClose?: () => void;
  primaryColor?: string;
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title = 'Chat', onClose, primaryColor }) => (
  <div
    className="flowchat-header"
    style={primaryColor ? {
      background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}e6 100%)`,
    } : undefined}
  >
    <h2 className="flowchat-header-title">{title}</h2>
    {onClose && (
      <button
        onClick={onClose}
        className="flowchat-header-close"
        aria-label="Close chat"
      >
        <CloseIcon size={20} />
      </button>
    )}
  </div>
);

// ============================================================================
// Auto-Open Hook
// ============================================================================

interface AutoOpenConfig {
  enabled: boolean;
  trigger: 'delay' | 'scroll' | 'exit-intent' | 'idle';
  delay?: number;
  scrollPercentage?: number;
  idleTime?: number;
  conditions: {
    oncePerSession?: boolean;
    oncePerDay?: boolean;
    skipIfInteracted?: boolean;
    excludeMobile?: boolean;
  };
}

const useAutoOpen = (
  config: AutoOpenConfig | undefined,
  isOpen: boolean,
  setIsOpen: (open: boolean) => void,
  hasInteracted: boolean
) => {
  useEffect(() => {
    if (!config?.enabled || isOpen) return;

    const storageKey = 'flowchat_auto_opened';
    const dayKey = 'flowchat_auto_opened_day';

    // Check conditions
    if (config.conditions?.oncePerSession) {
      if (sessionStorage.getItem(storageKey)) return;
    }

    if (config.conditions?.oncePerDay) {
      const today = new Date().toDateString();
      if (localStorage.getItem(dayKey) === today) return;
    }

    if (config.conditions?.skipIfInteracted && hasInteracted) return;

    if (config.conditions?.excludeMobile && window.innerWidth < 768) return;

    const triggerOpen = () => {
      setIsOpen(true);
      if (config.conditions?.oncePerSession) {
        sessionStorage.setItem(storageKey, 'true');
      }
      if (config.conditions?.oncePerDay) {
        localStorage.setItem(dayKey, new Date().toDateString());
      }
    };

    // Delay trigger
    if (config.trigger === 'delay') {
      const timeout = setTimeout(triggerOpen, (config.delay || 5) * 1000);
      return () => clearTimeout(timeout);
    }

    // Scroll trigger
    if (config.trigger === 'scroll') {
      const handleScroll = () => {
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= (config.scrollPercentage || 50)) {
          triggerOpen();
          window.removeEventListener('scroll', handleScroll);
        }
      };
      window.addEventListener('scroll', handleScroll);
      return () => window.removeEventListener('scroll', handleScroll);
    }

    // Exit intent trigger
    if (config.trigger === 'exit-intent') {
      const handleMouseLeave = (e: MouseEvent) => {
        if (e.clientY <= 0) {
          triggerOpen();
          document.removeEventListener('mouseleave', handleMouseLeave);
        }
      };
      document.addEventListener('mouseleave', handleMouseLeave);
      return () => document.removeEventListener('mouseleave', handleMouseLeave);
    }

    // Idle trigger
    if (config.trigger === 'idle') {
      let idleTimeout: NodeJS.Timeout;
      const resetIdle = () => {
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(triggerOpen, (config.idleTime || 30) * 1000);
      };
      const events = ['mousemove', 'keydown', 'scroll', 'click'];
      events.forEach(event => document.addEventListener(event, resetIdle));
      resetIdle();
      return () => {
        clearTimeout(idleTimeout);
        events.forEach(event => document.removeEventListener(event, resetIdle));
      };
    }
  }, [config, isOpen, setIsOpen, hasInteracted]);
};

// ============================================================================
// Size Configuration
// ============================================================================

const sizeConfig = {
  small: { width: 48, height: 48, iconSize: 20 },
  medium: { width: 56, height: 56, iconSize: 24 },
  large: { width: 64, height: 64, iconSize: 28 },
};

// ============================================================================
// Props
// ============================================================================

export interface BubbleWidgetProps {
  webhookUrl: string;
  sessionId: string;
  config: ChatConfig;
  context?: Record<string, unknown>;
  apiUrl?: string;
}

// ============================================================================
// Inner Widget Component
// ============================================================================

const BubbleWidgetInner: React.FC<{
  config: ChatConfig;
}> = ({ config }) => {
  const bubble = config.bubble;
  const [isOpen, setIsOpen] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const size = sizeConfig[bubble.size || 'medium'];

  // Track user interaction
  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) {
      setHasInteracted(true);
      setUnreadCount(0); // Clear unread when opened
    }
  }, []);

  // Auto-open behavior
  useAutoOpen(config.autoOpen, isOpen, handleOpenChange, hasInteracted);

  // Position calculation - supports all 4 corners
  const isTop = bubble.position?.includes('top');
  const isLeft = bubble.position?.includes('left');

  // Bubble position styles
  const bubblePosition: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9999,
    [isLeft ? 'left' : 'right']: bubble.offsetX || 24,
    [isTop ? 'top' : 'bottom']: bubble.offsetY || 24,
  };

  // Window dimensions from config
  const windowWidth = config.window?.width || 400;
  const windowHeight = config.window?.height || 600;

  // Modal position styles - opens in correct direction based on bubble position
  const modalPosition: React.CSSProperties = {
    position: 'fixed',
    zIndex: 9998,
    [isLeft ? 'left' : 'right']: bubble.offsetX || 24,
    [isTop ? 'top' : 'bottom']: (bubble.offsetY || 24) + size.height + 16,
    width: `${Math.max(300, Math.min(windowWidth, window.innerWidth - 48))}px`,
    height: `${Math.max(400, Math.min(windowHeight, window.innerHeight - 120))}px`,
    maxWidth: 'calc(100vw - 48px)',
    maxHeight: isTop ? 'calc(100vh - 120px)' : 'calc(100vh - 120px)',
  };

  // Button styles
  const buttonStyle: React.CSSProperties = config.primaryColor ? {
    width: size.width,
    height: size.height,
    background: `linear-gradient(135deg, ${config.primaryColor} 0%, ${config.primaryColor}e6 100%)`,
  } : {
    width: size.width,
    height: size.height,
  };

  return (
    <AssistantModalPrimitive.Root open={isOpen} onOpenChange={handleOpenChange}>
      {/* Floating Trigger Button with Text Label */}
      <AssistantModalPrimitive.Anchor style={bubblePosition}>
        <div className="flowchat-bubble-container" style={{ display: 'flex', alignItems: 'center' }}>
          <BubbleText text={bubble.text} isOpen={isOpen} position={bubble.position} />
          <AssistantModalPrimitive.Trigger
            className={`flowchat-bubble-button ${bubble.pulseAnimation && !isOpen ? 'pulse' : ''}`}
            style={buttonStyle}
          >
            <BubbleIcon
              icon={bubble.icon}
              customIconUrl={bubble.customIconUrl}
              size={size.iconSize}
              isOpen={isOpen}
            />
            <UnreadBadge
              count={unreadCount}
              show={bubble.showUnreadBadge !== false}
              primaryColor={config.primaryColor}
            />
          </AssistantModalPrimitive.Trigger>
        </div>
      </AssistantModalPrimitive.Anchor>

      {/* Chat Modal */}
      <AssistantModalPrimitive.Content
        className="flowchat-modal"
        style={modalPosition}
        sideOffset={16}
      >
        {config.showHeader && (
          <ChatHeader
            title={config.chatTitle}
            onClose={() => handleOpenChange(false)}
            primaryColor={config.primaryColor}
          />
        )}
        <div style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <Thread
            welcomeMessage={config.welcomeMessage}
            placeholder={config.placeholderText}
            showVoiceInput={config.features?.voiceInput !== false}
            primaryColor={config.primaryColor}
            suggestedPrompts={config.suggestedPrompts}
            showTimestamp={config.showTimestamp}
            showAvatar={config.showAvatar !== false}
            avatarUrl={config.avatarUrl}
            showTypingIndicator={config.features?.showTypingIndicator !== false}
            fileUpload={config.features?.fileUpload}
            fileTypes={config.features?.fileTypes}
            maxFileSize={config.features?.maxFileSize}
            onNewMessage={() => {
              if (!isOpen) {
                setUnreadCount(prev => prev + 1);
              }
            }}
          />
        </div>
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

// ============================================================================
// Main Bubble Widget
// ============================================================================

export const BubbleWidget: React.FC<BubbleWidgetProps> = ({
  webhookUrl,
  sessionId,
  config,
  context = {},
  apiUrl,
}) => {
  // Device targeting check
  const deviceTargeting = config.rules?.deviceTargeting;
  if (deviceTargeting) {
    const width = window.innerWidth;
    const isMobile = width < 768;
    const isTablet = width >= 768 && width < 1024;
    const isDesktop = width >= 1024;

    if (isMobile && !deviceTargeting.mobile) return null;
    if (isTablet && !deviceTargeting.tablet) return null;
    if (isDesktop && !deviceTargeting.desktop) return null;
  }

  // Login requirement check
  if (config.rules?.requireLogin && !context?.user?.isLoggedIn) {
    return null;
  }

  // Create adapter
  const adapter = useMemo(
    () =>
      new N8nRuntimeAdapter({
        webhookUrl,
        sessionId,
        context,
        proxyUrl: apiUrl ? `${apiUrl}/proxy` : undefined,
        instanceId: config.instanceId,
        onError: (error) => {
          console.error('FlowChat error:', error);
        },
      }),
    [webhookUrl, sessionId, context, apiUrl, config.instanceId]
  );

  // Create runtime
  const runtime = useLocalRuntime(adapter);

  // Build CSS variables for theming
  const themeStyles: React.CSSProperties = {};
  if (config.appearance?.primaryColor) {
    themeStyles['--fc-primary' as string] = config.appearance.primaryColor;
  }
  if (config.appearance?.font) {
    themeStyles['--fc-font-family' as string] = config.appearance.font;
  }
  if (config.appearance?.fontSize) {
    themeStyles['--fc-font-size' as string] = `${config.appearance.fontSize}px`;
  }
  if (config.appearance?.borderRadius !== undefined) {
    themeStyles['--fc-border-radius' as string] = `${config.appearance.borderRadius}px`;
  }

  return (
    <div className="flowchat-widget" style={themeStyles}>
      <AssistantRuntimeProvider runtime={runtime}>
        <BubbleWidgetInner config={config} />
      </AssistantRuntimeProvider>
      {/* Custom CSS injection */}
      {config.appearance?.customCss && (
        <style dangerouslySetInnerHTML={{ __html: config.appearance.customCss }} />
      )}
    </div>
  );
};

export default BubbleWidget;
