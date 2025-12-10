/**
 * BubblePanel Component
 *
 * The expandable panel that contains the chat widget.
 */

import React, { useRef, useEffect, type ReactNode } from 'react';

interface BubblePanelProps {
  position: 'bottom-right' | 'bottom-left';
  onClose: () => void;
  children: ReactNode;
}

export const BubblePanel: React.FC<BubblePanelProps> = ({
  position,
  onClose,
  children,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        !panelRef.current.contains(event.target as Node)
      ) {
        // Check if click is on the trigger button
        const target = event.target as HTMLElement;
        if (target.closest('.flowchat-bubble-trigger')) {
          return;
        }
        onClose();
      }
    };

    // Handle escape key
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  // Focus trap
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    // Focus the panel on open
    const firstFocusable = panel.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    firstFocusable?.focus();
  }, []);

  return (
    <div
      ref={panelRef}
      className={`flowchat-bubble-panel flowchat-bubble-panel-${position}`}
      role="dialog"
      aria-modal="true"
      aria-label="Chat"
    >
      <div className="flowchat-bubble-panel-inner">
        {children}
      </div>
    </div>
  );
};

export default BubblePanel;
