/**
 * Award-Winning Assistant Modal Component
 *
 * Uses assistant-ui primitives with polished animations and micro-interactions.
 */

import React, { useState } from 'react';
import {
  AssistantModalPrimitive,
  type AssistantModalPrimitiveRootProps,
} from '@assistant-ui/react';

// Icons
const ChatIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

interface AssistantModalProps extends AssistantModalPrimitiveRootProps {
  children: React.ReactNode;
  position?: 'bottom-right' | 'bottom-left';
  offsetX?: number;
  offsetY?: number;
  bubbleSize?: 'sm' | 'md' | 'lg';
  bubbleColor?: string;
  showPulse?: boolean;
  bubbleIcon?: React.ReactNode;
}

export const AssistantModal: React.FC<AssistantModalProps> = ({
  children,
  position = 'bottom-right',
  offsetX = 24,
  offsetY = 24,
  bubbleSize = 'md',
  bubbleColor,
  showPulse = true,
  bubbleIcon,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const positionStyles: React.CSSProperties = {
    [position.includes('right') ? 'right' : 'left']: offsetX,
    bottom: offsetY,
  };

  const sizeClasses = {
    sm: 'fc-w-12 fc-h-12',
    md: 'fc-w-14 fc-h-14',
    lg: 'fc-w-16 fc-h-16',
  };

  return (
    <AssistantModalPrimitive.Root open={isOpen} onOpenChange={setIsOpen} {...props}>
      {/* Trigger Button */}
      <AssistantModalPrimitive.Anchor
        className="fc-fixed fc-z-50"
        style={positionStyles}
      >
        <AssistantModalPrimitive.Trigger
          className={`
            fc-flex fc-items-center fc-justify-center fc-rounded-full fc-cursor-pointer
            fc-shadow-bubble hover:fc-shadow-bubble-hover
            fc-transition-all fc-duration-200
            hover:fc-scale-110 active:fc-scale-90
            fc-border-0 fc-outline-none
            ${sizeClasses[bubbleSize]}
            ${showPulse && !isOpen ? 'fc-animate-pulse-ring' : ''}
          `}
          style={{
            backgroundColor: bubbleColor || 'hsl(var(--aui-primary))',
            color: 'hsl(var(--aui-primary-foreground))',
          }}
        >
          {/* Icon with transition */}
          <span
            className={`
              fc-absolute fc-transition-all fc-duration-200
              ${isOpen ? 'fc-rotate-90 fc-scale-0' : 'fc-rotate-0 fc-scale-100'}
            `}
          >
            {bubbleIcon || <ChatIcon className="fc-w-6 fc-h-6" />}
          </span>
          <span
            className={`
              fc-absolute fc-transition-all fc-duration-200
              ${isOpen ? 'fc-rotate-0 fc-scale-100' : 'fc--rotate-90 fc-scale-0'}
            `}
          >
            <CloseIcon className="fc-w-6 fc-h-6" />
          </span>
        </AssistantModalPrimitive.Trigger>
      </AssistantModalPrimitive.Anchor>

      {/* Modal Content */}
      <AssistantModalPrimitive.Content
        className="
          fc-fixed fc-z-50
          fc-w-[400px] fc-h-[550px] fc-max-h-[calc(100vh-120px)]
          fc-rounded-2xl fc-overflow-hidden
          fc-shadow-chat fc-border fc-border-[hsl(var(--aui-border))]
          fc-bg-[hsl(var(--aui-background))]
          fc-outline-none
          data-[state=open]:fc-animate-slide-up
          data-[state=closed]:fc-animate-fade-out
          max-[480px]:fc-inset-0 max-[480px]:fc-w-full max-[480px]:fc-h-full
          max-[480px]:fc-max-h-full max-[480px]:fc-rounded-none
        "
        sideOffset={16}
        style={positionStyles}
      >
        {children}
      </AssistantModalPrimitive.Content>
    </AssistantModalPrimitive.Root>
  );
};

export default AssistantModal;
