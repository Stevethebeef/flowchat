/**
 * BubbleWidget Component
 *
 * Floating bubble chat widget with trigger button and expandable panel.
 */

import React, { useCallback } from 'react';
import { useBubble } from '../../hooks/useBubble';
import { BubbleTrigger } from './BubbleTrigger';
import { BubblePanel } from './BubblePanel';
import { ChatWidget } from '../chat/ChatWidget';
import type { BubbleWidgetProps } from '../../types';

export const BubbleWidget: React.FC<BubbleWidgetProps> = ({
  webhookUrl,
  sessionId,
  config,
  context,
  onToggle,
}) => {
  const bubbleConfig = config.bubble;
  const autoOpenConfig = config.autoOpen;

  // Bubble state and behavior
  const {
    isOpen,
    unreadCount,
    position,
    toggle,
    open,
    close,
    incrementUnread,
    clearUnread,
  } = useBubble({
    bubbleConfig,
    autoOpenConfig,
    sessionId,
    onOpen: () => onToggle?.(true),
    onClose: () => onToggle?.(false),
  });

  // Position styles
  const positionStyles: React.CSSProperties = {
    position: 'fixed',
    zIndex: 999999,
    ...(bubbleConfig.position === 'bottom-right'
      ? { right: position.x, bottom: position.y }
      : { left: position.x, bottom: position.y }),
  };

  // Handle new message for unread badge
  const handleNewMessage = useCallback(() => {
    if (!isOpen) {
      incrementUnread();
    }
  }, [isOpen, incrementUnread]);

  return (
    <div
      className={`flowchat-bubble-widget ${isOpen ? 'flowchat-bubble-open' : ''}`}
      style={positionStyles}
      data-position={bubbleConfig.position}
    >
      {/* Trigger button */}
      <BubbleTrigger
        isOpen={isOpen}
        onClick={toggle}
        unreadCount={unreadCount}
        icon={bubbleConfig.icon}
        customIconUrl={bubbleConfig.customIconUrl}
        text={bubbleConfig.text}
        size={bubbleConfig.size}
        showUnreadBadge={bubbleConfig.showUnreadBadge}
        pulseAnimation={bubbleConfig.pulseAnimation && !isOpen}
      />

      {/* Chat panel */}
      {isOpen && (
        <BubblePanel position={bubbleConfig.position} onClose={close}>
          <ChatWidget
            webhookUrl={webhookUrl}
            sessionId={sessionId}
            config={config}
            context={context}
            onClose={close}
          />
        </BubblePanel>
      )}
    </div>
  );
};

export default BubbleWidget;
