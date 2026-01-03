/**
 * Award-Winning ChatWidget Component
 *
 * Main entry point for the polished chat experience.
 * Combines AssistantModal with Thread for a complete solution.
 */

import React, { useMemo } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from '@assistant-ui/react';
import { N8nRuntimeAdapter } from '../../runtime/N8nRuntimeAdapter';
import { AssistantModal } from './AssistantModal';
import { Thread } from './Thread';
import type { ChatConfig } from '../../types';

// Header component with close button
interface ChatHeaderProps {
  title?: string;
  onClose?: () => void;
  primaryColor?: string;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const ChatHeader: React.FC<ChatHeaderProps> = ({ title = 'Chat', onClose, primaryColor }) => (
  <div
    className="
      fc-flex fc-items-center fc-justify-between
      fc-px-4 fc-py-3
      fc-text-white
      fc-border-b fc-border-white/10
    "
    style={{ backgroundColor: primaryColor || 'hsl(var(--aui-primary))' }}
  >
    <h2 className="fc-text-base fc-font-semibold fc-m-0">{title}</h2>
    {onClose && (
      <button
        onClick={onClose}
        className="
          fc-flex fc-items-center fc-justify-center
          fc-w-8 fc-h-8 fc-rounded-lg
          fc-bg-white/10 hover:fc-bg-white/20
          fc-border-0 fc-cursor-pointer fc-text-inherit
          fc-transition-colors fc-duration-150
        "
        aria-label="Close chat"
      >
        <CloseIcon className="fc-w-5 fc-h-5" />
      </button>
    )}
  </div>
);

// Main ChatWidget Props
export interface ChatWidgetProps {
  webhookUrl: string;
  sessionId: string;
  config: ChatConfig;
  context?: Record<string, unknown>;
  apiUrl?: string;
  isPreview?: boolean;
  onClose?: () => void;
}

// Inner component that uses the runtime
const ChatWidgetInner: React.FC<{
  config: ChatConfig;
  onClose?: () => void;
  apiUrl?: string;
}> = ({ config, onClose, apiUrl }) => {
  return (
    <div className="fc-flex fc-flex-col fc-h-full fc-overflow-hidden">
      {config.showHeader && (
        <ChatHeader
          title={config.chatTitle}
          onClose={onClose}
          primaryColor={config.primaryColor}
        />
      )}
      <Thread
        welcomeMessage={config.welcomeMessage}
        placeholder={config.placeholderText}
        showVoiceInput={config.features?.voiceInput !== false}
        primaryColor={config.primaryColor}
        fileUpload={config.features?.fileUpload}
        fileTypes={config.features?.fileTypes}
        maxFileSize={config.features?.maxFileSize}
        apiUrl={apiUrl}
        instanceId={config.instanceId}
      />
    </div>
  );
};

// Main ChatWidget Component
export const ChatWidget: React.FC<ChatWidgetProps> = ({
  webhookUrl,
  sessionId,
  config,
  context = {},
  apiUrl,
  isPreview = false,
  onClose,
}) => {
  // Create adapter instance with proxy support
  const adapter = useMemo(
    () =>
      new N8nRuntimeAdapter({
        webhookUrl,
        sessionId,
        context,
        proxyUrl: apiUrl ? `${apiUrl}/proxy` : undefined,
        instanceId: config.instanceId,
        onError: (error) => {
          console.error('n8n Chat error:', error);
        },
      }),
    [webhookUrl, sessionId, context, apiUrl, config.instanceId]
  );

  // Create runtime
  const runtime = useLocalRuntime(adapter);

  // Theme class
  const themeClass = config.theme === 'dark' ? 'fc-dark' : '';

  // Generate CSS custom properties for all appearance settings (HIGH-004 fix)
  const themeStyles: React.CSSProperties = {
    '--fc-primary': config.primaryColor || '#3b82f6',
    '--fc-user-bubble': config.appearance?.userBubbleColor || config.primaryColor || '#3b82f6',
    '--fc-bot-bubble': config.appearance?.botBubbleColor || '#f3f4f6',
    '--fc-background': config.appearance?.backgroundColor || '#ffffff',
    '--fc-text': config.appearance?.textColor || '#1f2937',
    '--fc-font-family': config.appearance?.fontFamily || 'inherit',
    '--fc-font-size': config.appearance?.fontSize || '14px',
    '--fc-border-radius': `${config.appearance?.borderRadius || 12}px`,
    // Also set the aui-primary for assistant-ui compatibility
    '--aui-primary': config.primaryColor ? hexToHSL(config.primaryColor) : undefined,
  } as React.CSSProperties;

  return (
    <div
      className={`flowchat-widget aui-root ${themeClass}`}
      style={themeStyles}
      data-preview={isPreview}
    >
      <AssistantRuntimeProvider runtime={runtime}>
        <ChatWidgetInner config={config} onClose={onClose} apiUrl={apiUrl} />
      </AssistantRuntimeProvider>
    </div>
  );
};

// Helper to convert hex to HSL for CSS variables
function hexToHSL(hex: string): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');

  // Parse hex
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export default ChatWidget;
