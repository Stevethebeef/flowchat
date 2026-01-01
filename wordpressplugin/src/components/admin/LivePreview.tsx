/**
 * LivePreview Component
 *
 * Renders a live preview of the chat widget within the admin editor.
 * Uses shadow DOM for style isolation.
 */

import React, { useRef, useEffect, useState } from 'react';
import type { AdminInstance } from '../../types';

interface LivePreviewProps {
  instance: Partial<AdminInstance>;
  mode: 'desktop' | 'mobile';
}

export const LivePreview: React.FC<LivePreviewProps> = ({ instance, mode }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const [previewKey, setPreviewKey] = useState(0);

  // Force re-render when instance changes significantly
  useEffect(() => {
    setPreviewKey((prev) => prev + 1);
  }, [
    instance.primaryColor,
    instance.appearance?.userBubbleColor,
    instance.appearance?.botBubbleColor,
    instance.appearance?.backgroundColor,
    instance.appearance?.textColor,
    instance.appearance?.headerBackground,
    instance.appearance?.fontFamily,
    instance.appearance?.fontSize,
    instance.appearance?.borderRadius,
    instance.bubble?.enabled,
    instance.bubble?.position,
    instance.bubble?.size,
    instance.bubble?.icon,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    // Create shadow DOM if not exists
    if (!shadowRef.current) {
      shadowRef.current = containerRef.current.attachShadow({ mode: 'open' });
    }

    const shadow = shadowRef.current;
    const appearance = instance.appearance || {};
    const bubble = instance.bubble || {};
    const isBubble = bubble.enabled;

    // Get font family
    const getFontFamily = () => {
      switch (appearance.fontFamily) {
        case 'inter':
          return "'Inter', sans-serif";
        case 'roboto':
          return "'Roboto', sans-serif";
        case 'open-sans':
          return "'Open Sans', sans-serif";
        case 'lato':
          return "'Lato', sans-serif";
        case 'poppins':
          return "'Poppins', sans-serif";
        default:
          return '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      }
    };

    // Get font size
    const getFontSize = () => {
      switch (appearance.fontSize) {
        case 'small':
          return '14px';
        case 'large':
          return '18px';
        default:
          return '16px';
      }
    };

    // Generate CSS
    const css = `
      :host {
        display: block;
        width: 100%;
        height: 100%;
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      .preview-container {
        width: 100%;
        height: 100%;
        background: #e5e5e5;
        border-radius: 8px;
        display: flex;
        align-items: ${isBubble ? 'flex-end' : 'center'};
        justify-content: ${isBubble ? 'flex-end' : 'center'};
        padding: ${isBubble ? '24px' : '16px'};
        position: relative;
        overflow: hidden;
      }

      .preview-container.is-mobile {
        max-width: 375px;
        margin: 0 auto;
      }

      /* Chat Window */
      .chat-window {
        background: ${appearance.backgroundColor || '#ffffff'};
        border-radius: ${appearance.borderRadius || 12}px;
        box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
        display: flex;
        flex-direction: column;
        overflow: hidden;
        font-family: ${getFontFamily()};
        font-size: ${getFontSize()};
        color: ${appearance.textColor || '#1f2937'};
        transition: all 0.2s ease;
      }

      .chat-window.inline-mode {
        width: 100%;
        height: 100%;
        max-width: 400px;
        max-height: 500px;
      }

      .chat-window.bubble-mode {
        width: 350px;
        height: 450px;
        max-height: 80%;
      }

      .chat-window.is-mobile {
        width: 100%;
        max-width: 100%;
        height: 400px;
      }

      /* Header */
      .chat-header {
        background: ${appearance.headerBackground || instance.primaryColor || '#3b82f6'};
        color: white;
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .chat-header-avatar {
        width: 36px;
        height: 36px;
        background: rgba(255, 255, 255, 0.2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 18px;
      }

      .chat-header-avatar img {
        width: 100%;
        height: 100%;
        border-radius: 50%;
        object-fit: cover;
      }

      .chat-header-title {
        font-weight: 600;
        font-size: 15px;
      }

      .chat-header-close {
        margin-left: auto;
        background: none;
        border: none;
        color: white;
        cursor: pointer;
        opacity: 0.8;
        font-size: 20px;
      }

      /* Messages */
      .chat-messages {
        flex: 1;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 12px;
        overflow-y: auto;
        background: ${appearance.backgroundColor || '#ffffff'};
      }

      .chat-message {
        max-width: 80%;
        padding: 10px 14px;
        border-radius: ${Math.max(8, (appearance.borderRadius || 12) - 4)}px;
        line-height: 1.4;
      }

      .chat-message.bot {
        background: ${appearance.botBubbleColor || '#f3f4f6'};
        color: ${appearance.textColor || '#1f2937'};
        align-self: flex-start;
        border-bottom-left-radius: 4px;
      }

      .chat-message.user {
        background: ${appearance.userBubbleColor || instance.primaryColor || '#3b82f6'};
        color: white;
        align-self: flex-end;
        border-bottom-right-radius: 4px;
      }

      /* Input */
      .chat-input {
        padding: 12px 16px;
        border-top: 1px solid #e5e7eb;
        display: flex;
        gap: 8px;
        background: ${appearance.backgroundColor || '#ffffff'};
      }

      .chat-input input {
        flex: 1;
        border: 1px solid #d1d5db;
        border-radius: ${Math.max(4, (appearance.borderRadius || 12) / 2)}px;
        padding: 10px 14px;
        font-size: inherit;
        font-family: inherit;
        outline: none;
      }

      .chat-input input:focus {
        border-color: ${instance.primaryColor || '#3b82f6'};
        box-shadow: 0 0 0 2px ${instance.primaryColor || '#3b82f6'}20;
      }

      .chat-input button {
        background: ${instance.primaryColor || '#3b82f6'};
        color: white;
        border: none;
        border-radius: ${Math.max(4, (appearance.borderRadius || 12) / 2)}px;
        padding: 10px 16px;
        cursor: pointer;
        font-weight: 500;
      }

      /* Bubble Trigger */
      .bubble-trigger {
        position: absolute;
        bottom: 24px;
        right: 24px;
        width: ${bubble.size === 'small' ? '48px' : bubble.size === 'large' ? '64px' : '56px'};
        height: ${bubble.size === 'small' ? '48px' : bubble.size === 'large' ? '64px' : '56px'};
        border-radius: 50%;
        background: ${instance.primaryColor || '#3b82f6'};
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        font-size: ${bubble.size === 'small' ? '20px' : bubble.size === 'large' ? '28px' : '24px'};
        animation: ${bubble.pulseAnimation !== false ? 'pulse 2s infinite' : 'none'};
      }

      .bubble-trigger.bottom-left {
        right: auto;
        left: 24px;
      }

      .bubble-trigger.top-right {
        bottom: auto;
        top: 24px;
      }

      .bubble-trigger.top-left {
        bottom: auto;
        top: 24px;
        right: auto;
        left: 24px;
      }

      @keyframes pulse {
        0% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
        50% { box-shadow: 0 4px 20px rgba(0, 0, 0, 0.25); }
        100% { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); }
      }

      /* Welcome Screen */
      .welcome-screen {
        padding: 24px;
        text-align: center;
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }

      .welcome-title {
        font-size: 1.25em;
        font-weight: 600;
        color: ${appearance.textColor || '#1f2937'};
      }

      .welcome-message {
        color: #6b7280;
        line-height: 1.5;
      }

      .welcome-suggestions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        justify-content: center;
        margin-top: 8px;
      }

      .welcome-suggestion {
        background: ${appearance.botBubbleColor || '#f3f4f6'};
        border: 1px solid #e5e7eb;
        border-radius: 16px;
        padding: 8px 14px;
        font-size: 0.875em;
        cursor: pointer;
        transition: background 0.15s;
      }

      .welcome-suggestion:hover {
        background: #e5e7eb;
      }
    `;

    // Get bubble icon
    const getBubbleIcon = () => {
      switch (bubble.icon) {
        case 'robot':
          return '🤖';
        case 'help':
          return '❓';
        case 'support':
          return '🎧';
        case 'sparkle':
          return '✨';
        case 'custom':
          return bubble.customIconUrl ? `<img src="${bubble.customIconUrl}" alt="" style="width: 60%; height: 60%;" />` : '💬';
        default:
          return '💬';
      }
    };

    // Generate HTML
    const html = `
      <style>${css}</style>
      <div class="preview-container ${mode === 'mobile' ? 'is-mobile' : ''}">
        ${
          isBubble
            ? `
          <div class="chat-window bubble-mode ${mode === 'mobile' ? 'is-mobile' : ''}">
            ${
              instance.showHeader !== false
                ? `
            <div class="chat-header">
              <div class="chat-header-avatar">
                ${instance.avatarUrl ? `<img src="${instance.avatarUrl}" alt="" />` : '🤖'}
              </div>
              <span class="chat-header-title">${instance.chatTitle || 'Chat'}</span>
              <button class="chat-header-close">×</button>
            </div>
            `
                : ''
            }
            ${
              instance.messages?.showWelcomeScreen !== false
                ? `
            <div class="welcome-screen">
              <div class="welcome-title">${instance.chatTitle || 'How can we help?'}</div>
              <div class="welcome-message">${instance.welcomeMessage || 'Hi! 👋 How can I help you today?'}</div>
              ${
                (instance.suggestedPrompts || []).length > 0
                  ? `
              <div class="welcome-suggestions">
                ${(instance.suggestedPrompts || [])
                  .filter((p: string) => p)
                  .map((p: string) => `<button class="welcome-suggestion">${p}</button>`)
                  .join('')}
              </div>
              `
                  : ''
              }
            </div>
            `
                : `
            <div class="chat-messages">
              <div class="chat-message bot">${instance.welcomeMessage || 'Hi! How can I help you today?'}</div>
              <div class="chat-message user">I have a question about pricing</div>
              <div class="chat-message bot">Of course! I'd be happy to help with pricing info.</div>
            </div>
            `
            }
            <div class="chat-input">
              <input type="text" placeholder="${instance.placeholderText || 'Type your message...'}" readonly />
              <button>Send</button>
            </div>
          </div>
          <div class="bubble-trigger ${bubble.position || 'bottom-right'}">
            ${getBubbleIcon()}
          </div>
        `
            : `
          <div class="chat-window inline-mode ${mode === 'mobile' ? 'is-mobile' : ''}">
            ${
              instance.showHeader !== false
                ? `
            <div class="chat-header">
              <div class="chat-header-avatar">
                ${instance.avatarUrl ? `<img src="${instance.avatarUrl}" alt="" />` : '🤖'}
              </div>
              <span class="chat-header-title">${instance.chatTitle || 'Chat'}</span>
            </div>
            `
                : ''
            }
            <div class="chat-messages">
              <div class="chat-message bot">${instance.welcomeMessage || 'Hi! How can I help you today?'}</div>
              <div class="chat-message user">I have a question about pricing</div>
              <div class="chat-message bot">Of course! I'd be happy to help with pricing info.</div>
            </div>
            <div class="chat-input">
              <input type="text" placeholder="${instance.placeholderText || 'Type your message...'}" readonly />
              <button>Send</button>
            </div>
          </div>
        `
        }
      </div>
    `;

    shadow.innerHTML = html;
  }, [instance, mode, previewKey]);

  return (
    <div
      ref={containerRef}
      className="n8n-chat-live-preview"
      aria-label="Chat widget preview"
    />
  );
};

export default LivePreview;
