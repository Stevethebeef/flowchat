/**
 * FlowChat Frontend Entry Point
 *
 * Initializes chat widgets from WordPress-provided configuration.
 */

import { createRoot } from 'react-dom/client';
import { ChatWidget } from './components/chat/ChatWidget';
import { BubbleWidget } from './components/bubble/BubbleWidget';
import type { FlowChatInitConfig, InitResponse } from './types';
import './styles/chat.css';

/**
 * Initialize a FlowChat instance
 */
async function initFlowChat(config: FlowChatInitConfig): Promise<void> {
  const container = document.getElementById(config.containerId);
  if (!container) {
    console.error(`FlowChat: Container #${config.containerId} not found`);
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
      console.error('FlowChat: Failed to initialize', error.message || error);

      // Show error in container for debugging
      if (window.flowchatConfig?.debug) {
        container.innerHTML = `<div class="flowchat-error">${error.message || 'Failed to initialize'}</div>`;
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
        />
      );
    } else {
      root.render(
        <ChatWidget
          webhookUrl={data.webhookUrl}
          sessionId={data.sessionId}
          config={data.config}
          context={data.context}
        />
      );
    }

    // Log initialization in debug mode
    if (window.flowchatConfig?.debug) {
      console.log('FlowChat initialized:', {
        instanceId: config.instanceId,
        mode: config.mode,
        containerId: config.containerId,
      });
    }
  } catch (error) {
    console.error('FlowChat: Initialization error', error);
  }
}

/**
 * Auto-initialize from WordPress localized data
 */
function autoInit(): void {
  // Find all flowchatInit_* variables
  Object.keys(window).forEach((key) => {
    if (key.startsWith('flowchatInit_')) {
      const config = (window as Record<string, FlowChatInitConfig>)[key];
      if (config && config.containerId) {
        initFlowChat(config);
      }
    }

    // Also check for bubble configs
    if (key.startsWith('flowchatBubble_')) {
      const config = (window as Record<string, FlowChatInitConfig>)[key];
      if (config && config.containerId) {
        initFlowChat({ ...config, mode: 'bubble' });
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
window.FlowChat = {
  init: initFlowChat,
};

// Export components for external use
export { ChatWidget } from './components/chat/ChatWidget';
export { BubbleWidget } from './components/bubble/BubbleWidget';
export { N8nRuntimeAdapter } from './runtime/N8nRuntimeAdapter';
export * from './types';
