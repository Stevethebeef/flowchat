/**
 * n8n Chat Widget Entry Point
 * Initializes the chat widget when the DOM is ready
 */

import { createRoot } from 'react-dom/client';
import { N8nChatWidget } from './components/N8nChatWidget';
import type { WidgetConfig, N8nChatContext, ShopContext, CustomerContext, PageContext, ProductContext, CollectionContext, LocaleContext } from './types';
import './styles/main.css';

function parseJsonAttribute<T>(element: HTMLElement, attr: string, fallback: T): T {
  const value = element.getAttribute(attr);
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    console.warn(`[n8n Chat] Failed to parse ${attr}:`, value);
    return fallback;
  }
}

async function fetchCartContext(cartUrl: string) {
  try {
    const response = await fetch(cartUrl);
    if (!response.ok) return null;
    const cart = await response.json();
    // Strip sensitive data - cart token should never be sent externally
    const { token, ...safeCart } = cart;
    return {
      item_count: safeCart.item_count || 0,
      total_price: safeCart.total_price || 0,
      total_discount: safeCart.total_discount || 0,
      currency: safeCart.currency || 'USD',
      requires_shipping: safeCart.requires_shipping || false,
      items: (safeCart.items || []).map((item: Record<string, unknown>) => ({
        id: item.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        title: item.title,
        quantity: item.quantity,
        price: item.price,
        line_price: item.line_price,
        sku: item.sku,
        image: item.image,
        url: item.url,
      })),
    };
  } catch {
    console.warn('[n8n Chat] Failed to fetch cart');
    return null;
  }
}

async function initWidget() {
  // Support both old and new root IDs
  const root = document.getElementById('n8n-chat-widget-root') ||
               document.getElementById('flowchat-widget-root');

  if (!root) {
    console.warn('[n8n Chat] Widget root element not found');
    return;
  }

  // Parse privacy mode from data attribute
  const privacyMode = root.getAttribute('data-privacy-mode') === 'true';

  const config = parseJsonAttribute<WidgetConfig>(root, 'data-config', {
    webhookUrl: '',
    enabled: false,
    welcomeMessage: 'Hi! How can I help you today?',
    placeholderText: 'Type your message...',
    chatTitle: 'Chat with us',
    suggestedPrompts: [],
    position: 'bottom-right',
    primaryColor: '#3b82f6',
    theme: 'auto',
    bubbleSize: 56,
    bubbleIcon: 'chat',
    autoOpen: false,
    autoOpenDelay: 10,
    showOnMobile: true,
    enableVoice: false,
    enableFileUpload: false,
    privacyMode: privacyMode,
  });

  if (!config.enabled || !config.webhookUrl) {
    console.log('[n8n Chat] Widget disabled or no webhook URL configured');
    return;
  }

  const shop = parseJsonAttribute<ShopContext>(root, 'data-shop', {
    name: '',
    domain: '',
    permanent_domain: '',
    currency: 'USD',
    money_format: '${{amount}}',
  });

  const customer = parseJsonAttribute<CustomerContext>(root, 'data-customer', {
    logged_in: false,
  });

  const page = parseJsonAttribute<PageContext>(root, 'data-page', {
    type: 'index',
    url: window.location.pathname,
    full_url: window.location.href,
    title: document.title,
  });

  const product = parseJsonAttribute<ProductContext | null>(root, 'data-product', null);
  const collection = parseJsonAttribute<CollectionContext | null>(root, 'data-collection', null);
  const locale = parseJsonAttribute<LocaleContext>(root, 'data-locale', {
    language: 'en',
    country: 'US',
    currency: 'USD',
  });

  const cartUrl = root.getAttribute('data-cart-url') || '/cart.js';
  const cart = await fetchCartContext(cartUrl);

  const context: N8nChatContext = {
    shop,
    customer,
    page,
    product,
    collection,
    cart,
    locale,
    timestamp: new Date().toISOString(),
  };

  config.suggestedPrompts = config.suggestedPrompts
    .filter((p) => p && p.trim())
    .slice(0, 4);

  const reactRoot = createRoot(root);
  reactRoot.render(<N8nChatWidget config={config} context={context} />);

  console.log('[n8n Chat] Widget initialized', { config, context });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initWidget);
} else {
  initWidget();
}
