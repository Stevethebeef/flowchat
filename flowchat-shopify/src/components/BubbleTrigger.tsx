/**
 * Bubble Trigger Component
 * Floating button that opens the chat panel
 * Supports i18n for accessibility labels
 */

import { MessageCircle, Mail, HelpCircle, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import type { BubbleTriggerProps } from '@/types';

type IconName = 'chat' | 'message' | 'help' | 'sparkle';

const iconComponents = {
  chat: MessageCircle,
  message: Mail,
  help: HelpCircle,
  sparkle: Sparkles,
};

export function BubbleTrigger({
  onClick,
  isOpen,
  size,
  icon,
  primaryColor,
  position,
  hasUnread = false,
}: BubbleTriggerProps) {
  const { t } = useI18n();
  const iconKey = icon as IconName;
  const IconComponent = isOpen ? X : (iconComponents[iconKey] || MessageCircle);
  const iconSize = Math.round(size * 0.43); // Icon size relative to bubble

  return (
    <button
      className="fc-bubble-trigger"
      onClick={onClick}
      aria-label={isOpen ? t.closeChat : t.openChat}
      aria-expanded={isOpen}
      style={{
        '--fc-bubble-size': `${size}px`,
        '--fc-primary': primaryColor,
        [position === 'bottom-left' ? 'left' : 'right']: 'var(--fc-bubble-offset-x, 20px)',
      } as React.CSSProperties}
    >
      <span className="fc-bubble-icon">
        <IconComponent size={iconSize} />
      </span>

      {/* Pulse animation ring */}
      {!isOpen && (
        <span className="fc-bubble-pulse" aria-hidden="true" />
      )}

      {/* Unread badge */}
      {!isOpen && hasUnread && (
        <span className="fc-bubble-badge" aria-label={t.newMessage}>
          <span className="fc-badge-dot" />
        </span>
      )}
    </button>
  );
}
