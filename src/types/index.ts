/**
 * FlowChat TypeScript Type Definitions
 */

// ============================================================================
// Instance Configuration Types
// ============================================================================

export interface FlowChatConfig {
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
}

export interface BubbleConfig {
  enabled: boolean;
  icon: 'chat' | 'message' | 'help' | 'custom';
  customIconUrl?: string;
  text?: string;
  position: 'bottom-right' | 'bottom-left';
  offsetX: number;
  offsetY: number;
  size: 'small' | 'medium' | 'large';
  showUnreadBadge: boolean;
  pulseAnimation: boolean;
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
  showTypingIndicator: boolean;
  enableFeedback: boolean;
}

export interface FallbackConfig {
  enabled: boolean;
  message: string;
}

// ============================================================================
// Context Types
// ============================================================================

export interface ChatContext {
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
// Message Types
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

export type MessagePart = TextPart | FilePart;

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
  config: FlowChatConfig;
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
  config: FlowChatConfig;
  context: ChatContext;
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

export interface FlowChatGlobalConfig {
  version: string;
  debug: boolean;
}

export interface FlowChatInitConfig {
  containerId: string;
  instanceId: string;
  mode: 'inline' | 'bubble' | 'both';
  apiUrl: string;
  nonce: string;
}

// ============================================================================
// Admin Types
// ============================================================================

export interface AdminInstance extends FlowChatConfig {
  id: string;
  webhookUrl: string;
  isEnabled: boolean;
  isDefault: boolean;
  systemPrompt: string;
  customCss: string;
  colorSource: 'custom' | 'theme' | 'preset';
  stylePreset: string;
  targeting: TargetingConfig;
  access: AccessConfig;
  createdAt: string;
  updatedAt: string;
  sessionCount?: number;
  activeSessionCount?: number;
}

export interface TargetingConfig {
  enabled: boolean;
  priority: number;
  rules: TargetingRule[];
}

export interface TargetingRule {
  id: string;
  type: 'url_pattern' | 'post_type' | 'page_id' | 'category' | 'user_role';
  condition?: 'equals' | 'starts_with' | 'ends_with' | 'contains' | 'wildcard';
  value: string | string[];
}

export interface AccessConfig {
  requireLogin: boolean;
  allowedRoles: string[];
  deniedMessage: string;
}

export interface GlobalSettings {
  defaultInstance: string;
  enableHistory: boolean;
  historyRetentionDays: number;
  fileRetentionHours: number;
  enableAnalytics: boolean;
  customCss: string;
}

// ============================================================================
// Declare global window properties
// ============================================================================

declare global {
  interface Window {
    flowchatConfig: FlowChatGlobalConfig;
    FlowChat: {
      init: (config: FlowChatInitConfig) => Promise<void>;
    };
    [key: `flowchatInit_${string}`]: FlowChatInitConfig;
    [key: `flowchatBubble_${string}`]: FlowChatInitConfig;
  }
}

export {};
