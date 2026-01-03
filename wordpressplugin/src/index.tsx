/**
 * n8n Chat Frontend Entry Point
 *
 * Initializes chat widgets from WordPress-provided configuration.
 */

import { createRoot } from 'react-dom/client';
import { ChatWidget } from './components/ui/ChatWidget';
import { BubbleWidget } from './components/ui/BubbleWidget';
import type { N8nChatInitConfig, InitResponse, N8nChatConfig } from './types';
// Import new Tailwind styles with assistant-ui integration
import './styles/tailwind.css';

/**
 * Deep merge two objects, with source values overriding target values
 */
function deepMerge<T extends Record<string, unknown>>(target: T, source: Partial<T>): T {
  const result = { ...target };

  for (const key of Object.keys(source) as Array<keyof T>) {
    const sourceValue = source[key];
    const targetValue = target[key];

    if (
      sourceValue !== undefined &&
      sourceValue !== null &&
      typeof sourceValue === 'object' &&
      !Array.isArray(sourceValue) &&
      targetValue !== undefined &&
      targetValue !== null &&
      typeof targetValue === 'object' &&
      !Array.isArray(targetValue)
    ) {
      // Recursively merge nested objects
      result[key] = deepMerge(
        targetValue as Record<string, unknown>,
        sourceValue as Record<string, unknown>
      ) as T[keyof T];
    } else if (sourceValue !== undefined) {
      // Override with source value
      result[key] = sourceValue as T[keyof T];
    }
  }

  return result;
}

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

    // Check for shortcode overrides and merge with fetched config
    const overridesKey = `n8nChatOverrides_${config.containerId}`;
    const overrides = (window as Record<string, Partial<N8nChatConfig>>)[overridesKey];

    let mergedConfig = data.config;
    if (overrides && typeof overrides === 'object') {
      mergedConfig = deepMerge(
        data.config as unknown as Record<string, unknown>,
        overrides as unknown as Record<string, unknown>
      ) as unknown as N8nChatConfig;

      // Log override merge in debug mode
      if (window.n8nChatConfig?.debug) {
        console.log('n8n Chat: Applied shortcode overrides', {
          containerId: config.containerId,
          overrides,
          mergedConfig,
        });
      }
    }

    // Create React root
    const root = createRoot(container);

    // Render based on mode
    if (config.mode === 'bubble') {
      root.render(
        <BubbleWidget
          webhookUrl={data.webhookUrl}
          sessionId={data.sessionId}
          config={mergedConfig}
          context={data.context}
          apiUrl={config.apiUrl}
        />
      );
    } else {
      root.render(
        <ChatWidget
          webhookUrl={data.webhookUrl}
          sessionId={data.sessionId}
          config={mergedConfig}
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
export { ChatWidget } from './components/ui/ChatWidget';
export { BubbleWidget } from './components/ui/BubbleWidget';
export { Thread } from './components/ui/Thread';
export { AssistantModal } from './components/ui/AssistantModal';
export { N8nRuntimeAdapter } from './runtime/N8nRuntimeAdapter';
export * from './types';
