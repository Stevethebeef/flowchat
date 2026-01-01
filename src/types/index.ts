/**
 * n8n Chat TypeScript Type Definitions
 */

// ============================================================================
// Instance Configuration Types
// ============================================================================

export interface N8nChatConfig {
  instanceId: string;
  name: string;
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  suggestedPrompts: string[];
  showHeader: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl: string;
  bubble: BubbleConfig;
  autoOpen: AutoOpenConfig;
  features: FeaturesConfig;
  fallback: FallbackConfig;
  rules?: RulesConfig;
  // Additional nested config groups
  appearance?: AppearanceConfig;
  connection?: ConnectionConfig;
  window?: WindowConfig;
  messages?: MessagesConfig;
  display?: DisplayConfig;
}

export interface RulesConfig {
  deviceTargeting?: {
    desktop?: boolean;
    tablet?: boolean;
    mobile?: boolean;
  };
  requireLogin?: boolean;
  pageTargeting?: {
    enabled: boolean;
    include?: string[];
    exclude?: string[];
  };
  schedule?: {
    enabled: boolean;
    days?: string[];
    startTime?: string;
    endTime?: string;
    timezone?: string;
  };
}

export interface AppearanceConfig {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  userBubbleColor: string;
  assistantBubbleColor: string;
  font?: string;
  fontSize?: number;
  borderRadius?: number;
  shadows?: boolean;
  stylePreset?: string;
  customCss?: string;
  theme?: 'light' | 'dark' | 'auto';
  avatarUrl?: string;
  avatar?: {
    type: 'default' | 'custom' | 'initials';
    url?: string;
    initials?: string;
  };
  colors?: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
}

export interface ConnectionConfig {
  webhookUrl: string;
  authType: 'none' | 'basic' | 'bearer';
  username?: string;
  password?: string;
  apiKey?: string;
  timeout?: number;
  enableStreaming: boolean;
}

export interface WindowConfig {
  width?: number;
  height?: number;
  showHeader: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl: string;
  chatTitle: string;
  placeholderText: string;
  welcomeMessage: string;
  suggestedPrompts: string[];
}

export interface MessagesConfig {
  enableFeedback: boolean;
  showTypingIndicator: boolean;
  enableHistory: boolean;
  historyRetentionDays?: number;
}

export interface DisplayConfig {
  mode: 'inline' | 'bubble' | 'both';
  bubble: BubbleConfig;
  autoOpen: AutoOpenConfig;
}

export interface BubbleConfig {
  enabled: boolean;
  showOnAllPages?: boolean;
  defaultInstance?: string;
  icon?: 'chat' | 'message' | 'help' | 'headphones' | 'sparkles' | 'camera' | 'custom';
  customIconUrl?: string;
  text?: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  offsetX?: number;
  offsetY?: number;
  size?: 'small' | 'medium' | 'large';
  showUnreadBadge?: boolean;
  pulseAnimation?: boolean;
}

export interface AutoOpenConfig {
  enabled: boolean;
  trigger: 'delay' | 'scroll' | 'exit-intent' | 'idle';
  delay?: number;
  scrollPercentage?: number;
  idleTime?: number;
  conditions: {
    oncePerSession: boolean;
    oncePerDay: boolean;
    skipIfInteracted: boolean;
    loggedInOnly: boolean;
    guestOnly: boolean;
    excludeMobile: boolean;
  };
}

export interface FeaturesConfig {
  fileUpload: boolean;
  fileTypes: string[];
  maxFileSize: number;
  voiceInput: boolean;
  showTypingIndicator: boolean;
  enableFeedback: boolean;
  enableHistory?: boolean;
}

export interface FallbackConfig {
  enabled: boolean;
  message: string;
  email?: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface ChatContext extends Record<string, unknown> {
  site: SiteContext;
  user: UserContext;
  page: PageContext;
  datetime: DateTimeContext;
  woocommerce?: WooCommerceContext;
  systemPrompt?: string;
}

export interface SiteContext {
  name: string;
  url: string;
  description: string;
  language: string;
  timezone: string;
}

export interface UserContext {
  isLoggedIn: boolean;
  id?: number;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

export interface PageContext {
  url: string;
  title: string;
  type: string;
  id?: number;
  slug?: string;
  excerpt?: string;
  content?: string;
  categories?: string[];
  tags?: string[];
  author?: string;
  archiveTitle?: string;
  searchQuery?: string;
}

export interface DateTimeContext {
  date: string;
  time: string;
  day: string;
  timestamp: number;
  iso: string;
}

export interface WooCommerceContext {
  cartTotal: string;
  cartCount: number;
  cartItems: Array<{
    name: string;
    quantity: number;
    price: string;
  }>;
  currency: string;
  isProductPage: boolean;
  isShopPage: boolean;
  isCartPage: boolean;
  isCheckoutPage: boolean;
}

// ============================================================================
// Message Types (Compatible with @assistant-ui/react)
// ============================================================================

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: MessageContent;
  createdAt: string;
  metadata?: MessageMetadata;
}

export interface MessageContent {
  parts: MessagePart[];
  toolCalls?: ToolCall[];
  toolResults?: ToolResult[];
}

export type MessagePart = TextPart | FilePart | ImagePart | AssistantImagePart;

export interface TextPart {
  type: 'text';
  text: string;
}

export interface FilePart {
  type: 'image' | 'file';
  url: string;
  filename: string;
  mimeType: string;
}

export interface ImagePart {
  type: 'image';
  image: string;
}

export interface AssistantImagePart {
  type: 'image';
  image: string;
}

export interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  toolCallId: string;
  output: unknown;
}

export interface MessageMetadata {
  duration?: number;
  model?: string;
  tokens?: {
    input: number;
    output: number;
  };
}

// ============================================================================
// Session Types
// ============================================================================

export interface ChatSession {
  uuid: string;
  instanceId: string;
  userId?: number;
  status: 'active' | 'closed' | 'archived';
  startedAt: string;
  lastActivityAt: string;
  closedAt?: string;
}

// ============================================================================
// API Types
// ============================================================================

export interface InitResponse {
  webhookUrl: string;
  sessionId: string;
  config: N8nChatConfig;
  context: ChatContext;
  messages: ChatMessage[];
}

export interface UploadResponse {
  success: boolean;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  expiresAt: string;
}

export interface ErrorResponse {
  error: string;
  message: string;
}

// ============================================================================
// Component Props Types
// ============================================================================

export interface ChatWidgetProps {
  webhookUrl: string;
  sessionId: string;
  config: N8nChatConfig;
  context: ChatContext;
  apiUrl: string;
  isPreview?: boolean;
  onClose?: () => void;
}

export interface BubbleWidgetProps extends ChatWidgetProps {
  onToggle?: (isOpen: boolean) => void;
}

export interface ChatHeaderProps {
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
}

export interface ChatMessagesProps {
  welcomeMessage: string;
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
}

export interface ChatInputProps {
  placeholder: string;
  disabled?: boolean;
  fileUpload?: boolean;
  fileTypes?: string[];
  maxFileSize?: number;
  onFileUpload?: (file: File) => Promise<UploadResponse>;
}

export interface ChatMessageProps {
  message: ChatMessage;
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl?: string;
}

// ============================================================================
// Global Config Types
// ============================================================================

export interface N8nChatGlobalConfig {
  version: string;
  debug: boolean;
  apiUrl?: string;
  apiBase?: string;
  nonce?: string;
}

export interface N8nChatInitConfig {
  containerId: string;
  instanceId: string;
  mode: 'inline' | 'bubble' | 'both';
  apiUrl: string;
  nonce: string;
}

// ============================================================================
// Type Aliases for UI Components
// ============================================================================

// Simplified config type for UI components
export type ChatConfig = N8nChatConfig;

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminInstance {
  id: string;
  name: string;
  webhookUrl: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'inactive' | 'draft';
  config: N8nChatConfig;
}

export interface AdminSettings {
  globalBubble: {
    enabled: boolean;
    showOnAllPages: boolean;
    defaultInstance: string;
  };
  performance: {
    lazyLoad: boolean;
    debounceMs: number;
    cacheEnabled: boolean;
  };
  privacy: {
    anonymizeIp: boolean;
    cookieConsent: boolean;
    dataRetentionDays: number;
  };
  advanced: {
    debugMode: boolean;
    customEndpoint: string;
    proxyEnabled: boolean;
  };
}
