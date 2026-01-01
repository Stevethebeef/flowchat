/**
 * n8n Chat Frontend Entry Point
 *
 * Initializes chat widgets from WordPress-provided configuration.
 */

import { createRoot } from 'react-dom/client';
import { ChatWidget } from './components/chat/ChatWidget';
import { BubbleWidget } from './components/bubble/BubbleWidget';
import type { N8nChatInitConfig, InitResponse } from './types';
import './styles/chat.css';

/**
 * Initialize an n8n Chat instance
 */
async function initN8nChat(config: N8nChatInitConfig): Promise<void> {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`n8n Chat: Container #${config.containerId} not found`);
    return;
  }

  try {
    // Fetch configuration from WordPress
    const response = await fetch(
      `${config.apiUrl}/init?instance_id=${encodeURIComponent(config.instanceId)}`,
      {
        headers: {
          'X-WP-Nonce': config.nonce,
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('n8n Chat: Failed to initialize', error.message || error);

      // Show error in container for debugging
      if (window.n8nChatConfig?.debug) {
        container.innerHTML = `<div class="n8n-chat-error">${error.message || 'Failed to initialize'}</div>`;
      }
      return;
    }

    const data: InitResponse = await response.json();

    // Create React root
    const root = createRoot(container);

    // Render based on mode
    if (config.mode === 'bubble') {
      root.render(
        <BubbleWidget
          webhookUrl={data.webhookUrl}
          sessionId={data.sessionId}
          config={data.config}
          context={data.context}
          apiUrl={config.apiUrl}
        />
      );
    } else {
      root.render(
        <ChatWidget
          webhookUrl={data.webhookUrl}
          sessionId={data.sessionId}
          config={data.config}
          context={data.context}
          apiUrl={config.apiUrl}
        />
      );
    }

    // Log initialization in debug mode
    if (window.n8nChatConfig?.debug) {
      console.log('n8n Chat initialized:', {
        instanceId: config.instanceId,
        mode: config.mode,
        containerId: config.containerId,
      });
    }
  } catch (error) {
    console.error('n8n Chat: Initialization error', error);
  }
}

/**
 * Auto-initialize from WordPress localized data
 */
function autoInit(): void {
  // Find all n8nChatInit_* variables
  Object.keys(window).forEach((key) => {
    if (key.startsWith('n8nChatInit_')) {
      const config = (window as Record<string, N8nChatInitConfig>)[key];
      if (config && config.containerId) {
        initN8nChat(config);
      }
    }

    // Also check for bubble configs
    if (key.startsWith('n8nChatBubble_')) {
      const config = (window as Record<string, N8nChatInitConfig>)[key];
      if (config && config.containerId) {
        initN8nChat({ ...config, mode: 'bubble' });
      }
    }
  });
}

// Auto-init on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', autoInit);
} else {
  autoInit();
}

// Export for manual initialization
window.N8nChat = {
  init: initN8nChat,
};

// Export components for external use
export { ChatWidget } from './components/chat/ChatWidget';
export { BubbleWidget } from './components/bubble/BubbleWidget';
export { N8nRuntimeAdapter } from './runtime/N8nRuntimeAdapter';
export * from './types';
