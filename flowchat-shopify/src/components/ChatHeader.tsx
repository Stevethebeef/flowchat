/**
 * Chat Header Component
 * Title bar with close button
 * Supports i18n for accessibility labels
 */

import { Sparkles, X, Minus } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface ChatHeaderProps {
  title: string;
  onClose: () => void;
  onMinimize?: () => void;
}

export function ChatHeader({ title, onClose, onMinimize }: ChatHeaderProps) {
  const { t } = useI18n();

  return (
    <header className="fc-chat-header">
      <div className="fc-header-title">
        <span className="fc-header-avatar">
          <Sparkles size={18} />
        </span>
        <h2>{title}</h2>
      </div>

      <div className="fc-header-actions">
        {onMinimize && (
          <button
            className="fc-header-btn"
            onClick={onMinimize}
            aria-label={t.minimize}
          >
            <Minus size={18} />
          </button>
        )}
        <button
          className="fc-header-btn"
          onClick={onClose}
          aria-label={t.closeChat}
        >
          <X size={18} />
        </button>
      </div>
    </header>
  );
}
