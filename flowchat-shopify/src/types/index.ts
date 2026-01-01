import type { ProactiveTrigger } from '@/hooks';
import type { SupportedLocale, TranslationStrings } from '@/lib/i18n';

// Widget Configuration
export interface WidgetConfig {
  webhookUrl: string;
  enabled: boolean;
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  suggestedPrompts: string[];
  position: 'bottom-right' | 'bottom-left';
  primaryColor: string;
  theme: 'light' | 'dark' | 'auto';
  bubbleSize: number;
  bubbleIcon: 'chat' | 'message' | 'bot' | 'custom';
  autoOpen: boolean;
  autoOpenDelay: number;
  showOnMobile: boolean;
  enableVoice: boolean;
  enableFileUpload: boolean;
  // Privacy
  privacyMode: boolean;
  // Internationalization
  locale?: string;
  customTranslations?: Partial<TranslationStrings>;
  // Proactive triggers
  proactiveTriggers?: ProactiveTrigger[];
  // File upload settings
  fileUploadConfig?: {
    maxFileSize: number;
    allowedTypes: string[];
    maxFiles: number;
  };
}

// Re-export i18n types
export type { SupportedLocale, TranslationStrings };

// Shopify Context Types
export interface ShopContext {
  name: string;
  domain: string;
  permanent_domain: string;
  currency: string;
  money_format: string;
}

export interface CustomerContext {
  logged_in: boolean;
  id?: number;
  email?: string;
  first_name?: string;
  last_name?: string;
  tags?: string[];
  orders_count?: number;
  total_spent?: string;
}

export interface PageContext {
  type: string;
  url: string;
  full_url: string;
  title: string;
}

export interface ProductContext {
  id: number;
  title: string;
  handle: string;
  vendor: string;
  type: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  available: boolean;
  url: string;
  featured_image: string | null;
  tags: string[];
}

export interface CollectionContext {
  id: number;
  title: string;
  handle: string;
  description: string;
  products_count: number;
  url: string;
}

export interface CartContext {
  item_count: number;
  total_price: number;
  total_discount: number;
  items: CartItem[];
  currency: string;
  requires_shipping: boolean;
}

export interface CartItem {
  id: number;
  product_id: number;
  variant_id: number;
  title: string;
  quantity: number;
  price: number;
  line_price: number;
  sku: string;
  image: string | null;
  url: string;
}

export interface LocaleContext {
  language: string;
  country: string;
  currency: string;
}

// Complete context passed to n8n
export interface N8nChatContext {
  shop: ShopContext;
  customer: CustomerContext;
  page: PageContext;
  product: ProductContext | null;
  collection: CollectionContext | null;
  cart: CartContext | null;
  locale: LocaleContext;
  timestamp: string;
}

// Legacy alias
export type FlowChatContext = N8nChatContext;

// Widget Props
export interface N8nChatWidgetProps {
  config: WidgetConfig;
  context: N8nChatContext;
}

// Bubble Trigger Props
export interface BubbleTriggerProps {
  onClick: () => void;
  isOpen: boolean;
  size: number;
  icon: string;
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  hasUnread?: boolean;
  proactiveMessage?: string | null;
}

// Chat Panel Props
export interface ChatPanelProps {
  config: WidgetConfig;
  onClose: () => void;
  position: 'bottom-right' | 'bottom-left';
  proactiveMessage?: string | null;
  onMessageSent?: (content: string) => void;
  onMessageReceived?: (content: string) => void;
  enableVoice?: boolean;
  enableFileUpload?: boolean;
}

// Legacy alias
export type FlowChatWidgetProps = N8nChatWidgetProps;
