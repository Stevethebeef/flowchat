/**
 * Tooltip Component
 *
 * A reusable tooltip component that displays on hover.
 */

import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = 'top',
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState(position);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (isVisible && tooltipRef.current && wrapperRef.current) {
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const wrapperRect = wrapperRef.current.getBoundingClientRect();

      // Check if tooltip would overflow viewport and adjust position
      if (position === 'top' && tooltipRect.top < 0) {
        setTooltipPosition('bottom');
      } else if (position === 'bottom' && tooltipRect.bottom > window.innerHeight) {
        setTooltipPosition('top');
      } else if (position === 'left' && tooltipRect.left < 0) {
        setTooltipPosition('right');
      } else if (position === 'right' && tooltipRect.right > window.innerWidth) {
        setTooltipPosition('left');
      } else {
        setTooltipPosition(position);
      }
    }
  }, [isVisible, position]);

  return (
    <span
      ref={wrapperRef}
      className="n8n-chat-tooltip-wrapper"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <span
          ref={tooltipRef}
          className={`n8n-chat-tooltip n8n-chat-tooltip--${tooltipPosition}`}
          role="tooltip"
        >
          {content}
        </span>
      )}
    </span>
  );
};

export default Tooltip;
