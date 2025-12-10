# FlowChat Pro - Chat Instances & Configuration

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Technical Specification

---

## Overview

FlowChat Pro supports multiple independent chat configurations, each with its own n8n connection, styling, and behavior. This document defines the data structures, storage, and management of these configurations.

---

## Configuration Data Structure

### Master Configuration Schema

```typescript
interface FlowChatConfig {
  // === IDENTIFICATION ===
  id: string;                    // Database ID
  slug: string;                  // URL-safe identifier
  name: string;                  // Display name
  
  // === STATUS ===
  status: 'active' | 'inactive';
  isDefault: boolean;
  
  // === CONNECTION ===
  connection: ConnectionConfig;
  
  // === DISPLAY ===
  display: DisplayConfig;
  
  // === MESSAGES ===
  messages: MessagesConfig;
  
  // === APPEARANCE ===
  appearance: AppearanceConfig;
  
  // === FEATURES ===
  features: FeaturesConfig;
  
  // === DISPLAY RULES (Premium) ===
  rules?: DisplayRulesConfig;
  
  // === METADATA ===
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  createdBy: number;             // WordPress user ID
}
```

### Connection Configuration

```typescript
interface ConnectionConfig {
  // === n8n ENDPOINT ===
  webhookUrl: string;            // Required: n8n webhook URL
  
  // === AUTHENTICATION ===
  authType: 'none' | 'basic' | 'bearer';
  authCredentials?: {
    username?: string;           // For basic auth
    password?: string;           // For basic auth (encrypted)
    token?: string;              // For bearer auth (encrypted)
  };
  
  // === STREAMING ===
  streaming: boolean;            // Enable SSE streaming
  
  // === TIMEOUTS ===
  timeout: number;               // Request timeout in seconds (default: 30)
  
  // === n8n KEYS ===
  chatInputKey: string;          // Default: 'chatInput'
  sessionKey: string;            // Default: 'sessionId'
  
  // === ADVANCED ===
  customHeaders?: Record<string, string>;
}
```

### Display Configuration

```typescript
interface DisplayConfig {
  // === MODE ===
  mode: 'bubble' | 'inline' | 'sidebar' | 'fullpage';
  
  // === BUBBLE SETTINGS ===
  bubble?: {
    position: 'bottom-left' | 'bottom-right';
    icon: 'chat' | 'help' | 'message' | 'custom';
    customIconUrl?: string;
    size: 'small' | 'medium' | 'large';  // 48px, 60px, 72px
    offsetX: number;             // Pixels from edge (default: 20)
    offsetY: number;             // Pixels from bottom (default: 20)
    pulseAnimation: boolean;     // Attention animation
    notificationBadge: boolean;  // Show unread count
  };
  
  // === INLINE SETTINGS ===
  inline?: {
    containerSelector?: string;  // Custom container selector
    height: string;              // e.g., '500px', '100%'
    minHeight: string;
    maxHeight: string;
  };
  
  // === SIDEBAR SETTINGS ===
  sidebar?: {
    position: 'left' | 'right';
    width: string;               // e.g., '400px', '30%'
    overlay: boolean;            // Overlay or push content
    backdrop: boolean;           // Show backdrop on mobile
  };
  
  // === WINDOW DIMENSIONS ===
  window: {
    width: number;               // Pixels (320-600)
    height: number;              // Pixels (400-800)
    borderRadius: number;        // Pixels (default: 12)
  };
  
  // === BEHAVIOR ===
  behavior: {
    autoOpen: boolean;
    autoOpenDelay: number;       // Seconds before auto-open
    openOnExitIntent: boolean;
    rememberState: boolean;      // Remember open/closed
    allowFullscreen: boolean;
    closeOnEscape: boolean;
    closeOnOutsideClick: boolean;
  };
  
  // === MOBILE ===
  mobile: {
    fullscreenOnMobile: boolean;
    hideOnMobile: boolean;
    mobileBreakpoint: number;    // Default: 768
  };
}
```

### Messages Configuration

```typescript
interface MessagesConfig {
  // === WELCOME SCREEN ===
  welcome: {
    enabled: boolean;
    title: string;               // Window title
    message: string;             // Welcome message (markdown)
    avatarUrl?: string;
  };
  
  // === SUGGESTIONS ===
  suggestions: {
    enabled: boolean;
    items: string[];             // Max 4 suggestions
    showAfterWelcome: boolean;
    showAfterResponse: boolean;
  };
  
  // === INPUT ===
  input: {
    placeholder: string;
    maxLength: number;           // Character limit (default: 4000)
    showCharCount: boolean;
  };
  
  // === SYSTEM MESSAGES ===
  system: {
    typingIndicator: string;     // e.g., "Bot is typing..."
    connectionError: string;
    timeoutError: string;
    rateLimitError: string;
    offlineMessage: string;      // For scheduled hours
  };
  
  // === ATTACHMENTS ===
  attachments: {
    enabled: boolean;
    allowedTypes: string[];      // MIME types
    maxFileSize: number;         // MB
    maxFiles: number;            // Per message
  };
}
```

### Appearance Configuration

```typescript
interface AppearanceConfig {
  // === THEME PRESET ===
  theme: 'light' | 'dark' | 'minimal' | 'corporate' | 'friendly' | 'custom';
  
  // === COLORS ===
  colors: {
    primary: string;             // Hex color
    primaryForeground: string;
    userBubble: string;
    userBubbleForeground: string;
    botBubble: string;
    botBubbleForeground: string;
    background: string;
    foreground: string;
    headerBackground: string;
    headerForeground: string;
    border: string;
    inputBackground: string;
    inputBorder: string;
    inputForeground: string;
    accent: string;
    error: string;
    success: string;
  };
  
  // === TYPOGRAPHY ===
  typography: {
    fontFamily: 'system' | 'inter' | 'roboto' | 'open-sans' | 'lato' | string;
    fontSize: 'small' | 'medium' | 'large';  // 14px, 16px, 18px
    headerFontWeight: number;
    messageFontWeight: number;
  };
  
  // === AVATAR ===
  avatar: {
    enabled: boolean;
    type: 'none' | 'icon' | 'image';
    iconType?: 'robot' | 'sparkle' | 'chat';
    imageUrl?: string;
    size: number;                // Pixels
    shape: 'circle' | 'square' | 'rounded';
  };
  
  // === CUSTOM CSS ===
  customCss?: string;            // Premium feature
  
  // === ANIMATIONS ===
  animations: {
    enabled: boolean;
    messageAppear: 'fade' | 'slide' | 'none';
    typingIndicator: 'dots' | 'pulse' | 'wave';
    bubblePulse: boolean;
  };
}
```

### Features Configuration

```typescript
interface FeaturesConfig {
  // === CHAT FEATURES ===
  chat: {
    showTimestamps: boolean;
    showReadReceipts: boolean;
    allowCopy: boolean;
    allowRegenerate: boolean;
    enableMarkdown: boolean;
    enableCodeHighlight: boolean;
    enableLatex: boolean;
    enableMermaid: boolean;
  };
  
  // === SPEECH ===
  speech: {
    textToSpeech: boolean;
    speechToText: boolean;       // Premium
  };
  
  // === HISTORY ===
  history: {
    enabled: boolean;
    storageType: 'local' | 'session' | 'server' | 'n8n';
    maxMessages: number;         // Per session
    persistAcrossSessions: boolean;
    allowExport: boolean;        // Premium
    allowClear: boolean;
  };
  
  // === BRANDING ===
  branding: {
    showPoweredBy: boolean;      // "Powered by FlowChat"
    customBranding?: string;     // Premium: custom text/logo
  };
  
  // === ANALYTICS ===
  analytics: {
    enabled: boolean;            // Premium
    trackPageViews: boolean;
    trackConversations: boolean;
    trackResponses: boolean;
  };
}
```

### Display Rules Configuration (Premium)

```typescript
interface DisplayRulesConfig {
  // === PAGE TARGETING ===
  pages: {
    mode: 'all' | 'include' | 'exclude';
    rules: PageRule[];
  };
  
  // === USER TARGETING ===
  users: {
    showToLoggedOut: boolean;
    showToLoggedIn: boolean;
    roles: string[];             // WordPress roles
  };
  
  // === DEVICE TARGETING ===
  devices: {
    desktop: boolean;
    tablet: boolean;
    mobile: boolean;
  };
  
  // === SCHEDULE ===
  schedule?: {
    enabled: boolean;
    timezone: string;
    hours: {
      start: string;             // "09:00"
      end: string;               // "17:00"
    };
    days: number[];              // 0-6 (Sunday-Saturday)
    offlineMessage: string;
  };
  
  // === GEOLOCATION ===
  geo?: {
    enabled: boolean;
    mode: 'include' | 'exclude';
    countries: string[];         // ISO country codes
  };
}

interface PageRule {
  type: 'url_contains' | 'url_equals' | 'url_starts' | 'url_ends' |
        'url_regex' | 'page_id' | 'post_type' | 'taxonomy' | 'template';
  value: string;
  operator?: 'and' | 'or';
}
```

---

## Database Schema

### Configuration Table

```sql
CREATE TABLE {prefix}flowchat_configs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    
    -- Identification
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    
    -- Status
    status ENUM('active', 'inactive') DEFAULT 'inactive',
    is_default TINYINT(1) DEFAULT 0,
    
    -- Configuration (JSON)
    connection_config LONGTEXT NOT NULL,
    display_config LONGTEXT NOT NULL,
    messages_config LONGTEXT NOT NULL,
    appearance_config LONGTEXT NOT NULL,
    features_config LONGTEXT NOT NULL,
    rules_config LONGTEXT NULL,
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    created_by BIGINT UNSIGNED,
    
    -- Indexes
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_default (is_default)
    
) {charset_collate};
```

---

## PHP Configuration Class

```php
<?php
/**
 * FlowChat Configuration Manager
 */

namespace FlowChat;

class Config {
    
    /**
     * Get configuration by ID or slug
     */
    public static function get($identifier): ?array {
        global $wpdb;
        $table = $wpdb->prefix . 'flowchat_configs';
        
        // Check cache first
        $cache_key = 'flowchat_config_' . $identifier;
        $cached = wp_cache_get($cache_key, 'flowchat');
        if ($cached !== false) {
            return $cached;
        }
        
        // Determine if ID or slug
        $where = is_numeric($identifier) ? 'id = %d' : 'slug = %s';
        
        $row = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$table} WHERE {$where}",
                $identifier
            ),
            ARRAY_A
        );
        
        if (!$row) {
            return null;
        }
        
        // Parse JSON fields
        $config = self::parseRow($row);
        
        // Cache for 1 hour
        wp_cache_set($cache_key, $config, 'flowchat', HOUR_IN_SECONDS);
        
        return $config;
    }
    
    /**
     * Get all configurations
     */
    public static function getAll(array $args = []): array {
        global $wpdb;
        $table = $wpdb->prefix . 'flowchat_configs';
        
        $defaults = [
            'status' => null,
            'orderby' => 'name',
            'order' => 'ASC',
            'limit' => 100,
            'offset' => 0,
        ];
        
        $args = wp_parse_args($args, $defaults);
        
        $where = '1=1';
        $params = [];
        
        if ($args['status']) {
            $where .= ' AND status = %s';
            $params[] = $args['status'];
        }
        
        $orderby = sanitize_sql_orderby($args['orderby'] . ' ' . $args['order']);
        
        $sql = "SELECT * FROM {$table} WHERE {$where} ORDER BY {$orderby} LIMIT %d OFFSET %d";
        $params[] = $args['limit'];
        $params[] = $args['offset'];
        
        $rows = $wpdb->get_results(
            $wpdb->prepare($sql, ...$params),
            ARRAY_A
        );
        
        return array_map([self::class, 'parseRow'], $rows);
    }
    
    /**
     * Save configuration
     */
    public static function save(array $config): int {
        global $wpdb;
        $table = $wpdb->prefix . 'flowchat_configs';
        
        // Validate
        $config = self::validate($config);
        
        // Prepare data
        $data = [
            'name' => $config['name'],
            'slug' => $config['slug'] ?? sanitize_title($config['name']),
            'status' => $config['status'] ?? 'inactive',
            'is_default' => $config['isDefault'] ?? 0,
            'connection_config' => wp_json_encode($config['connection']),
            'display_config' => wp_json_encode($config['display']),
            'messages_config' => wp_json_encode($config['messages']),
            'appearance_config' => wp_json_encode($config['appearance']),
            'features_config' => wp_json_encode($config['features']),
            'rules_config' => isset($config['rules']) ? wp_json_encode($config['rules']) : null,
            'created_by' => get_current_user_id(),
        ];
        
        if (isset($config['id']) && $config['id']) {
            // Update
            $wpdb->update($table, $data, ['id' => $config['id']]);
            $id = $config['id'];
        } else {
            // Insert
            $wpdb->insert($table, $data);
            $id = $wpdb->insert_id;
        }
        
        // Clear cache
        self::clearCache($id);
        self::clearCache($data['slug']);
        
        return $id;
    }
    
    /**
     * Delete configuration
     */
    public static function delete($id): bool {
        global $wpdb;
        $table = $wpdb->prefix . 'flowchat_configs';
        
        $config = self::get($id);
        if (!$config) {
            return false;
        }
        
        $result = $wpdb->delete($table, ['id' => $id]);
        
        if ($result) {
            self::clearCache($id);
            self::clearCache($config['slug']);
        }
        
        return (bool) $result;
    }
    
    /**
     * Get default configuration
     */
    public static function getDefault(): ?array {
        global $wpdb;
        $table = $wpdb->prefix . 'flowchat_configs';
        
        $row = $wpdb->get_row(
            "SELECT * FROM {$table} WHERE is_default = 1 AND status = 'active' LIMIT 1",
            ARRAY_A
        );
        
        return $row ? self::parseRow($row) : null;
    }
    
    /**
     * Duplicate configuration
     */
    public static function duplicate($id): ?int {
        $config = self::get($id);
        if (!$config) {
            return null;
        }
        
        unset($config['id']);
        $config['name'] .= ' (Copy)';
        $config['slug'] .= '-copy-' . time();
        $config['isDefault'] = false;
        $config['status'] = 'inactive';
        
        return self::save($config);
    }
    
    /**
     * Parse database row
     */
    private static function parseRow(array $row): array {
        return [
            'id' => (int) $row['id'],
            'name' => $row['name'],
            'slug' => $row['slug'],
            'status' => $row['status'],
            'isDefault' => (bool) $row['is_default'],
            'connection' => json_decode($row['connection_config'], true),
            'display' => json_decode($row['display_config'], true),
            'messages' => json_decode($row['messages_config'], true),
            'appearance' => json_decode($row['appearance_config'], true),
            'features' => json_decode($row['features_config'], true),
            'rules' => $row['rules_config'] ? json_decode($row['rules_config'], true) : null,
            'createdAt' => $row['created_at'],
            'updatedAt' => $row['updated_at'],
            'createdBy' => (int) $row['created_by'],
        ];
    }
    
    /**
     * Validate configuration
     */
    private static function validate(array $config): array {
        // Required fields
        if (empty($config['name'])) {
            throw new \InvalidArgumentException('Name is required');
        }
        
        if (empty($config['connection']['webhookUrl'])) {
            throw new \InvalidArgumentException('Webhook URL is required');
        }
        
        // Sanitize webhook URL
        $config['connection']['webhookUrl'] = esc_url_raw(
            $config['connection']['webhookUrl']
        );
        
        // Apply defaults
        $config = self::applyDefaults($config);
        
        return $config;
    }
    
    /**
     * Apply default values
     */
    private static function applyDefaults(array $config): array {
        $defaults = self::getDefaults();
        
        $config['connection'] = array_merge(
            $defaults['connection'],
            $config['connection'] ?? []
        );
        
        $config['display'] = array_merge_recursive(
            $defaults['display'],
            $config['display'] ?? []
        );
        
        $config['messages'] = array_merge_recursive(
            $defaults['messages'],
            $config['messages'] ?? []
        );
        
        $config['appearance'] = array_merge_recursive(
            $defaults['appearance'],
            $config['appearance'] ?? []
        );
        
        $config['features'] = array_merge_recursive(
            $defaults['features'],
            $config['features'] ?? []
        );
        
        return $config;
    }
    
    /**
     * Get default configuration values
     */
    public static function getDefaults(): array {
        return [
            'connection' => [
                'authType' => 'none',
                'streaming' => true,
                'timeout' => 30,
                'chatInputKey' => 'chatInput',
                'sessionKey' => 'sessionId',
            ],
            'display' => [
                'mode' => 'bubble',
                'bubble' => [
                    'position' => 'bottom-right',
                    'icon' => 'chat',
                    'size' => 'medium',
                    'offsetX' => 20,
                    'offsetY' => 20,
                    'pulseAnimation' => false,
                    'notificationBadge' => true,
                ],
                'window' => [
                    'width' => 400,
                    'height' => 500,
                    'borderRadius' => 12,
                ],
                'behavior' => [
                    'autoOpen' => false,
                    'autoOpenDelay' => 5,
                    'openOnExitIntent' => false,
                    'rememberState' => true,
                    'allowFullscreen' => true,
                    'closeOnEscape' => true,
                    'closeOnOutsideClick' => false,
                ],
                'mobile' => [
                    'fullscreenOnMobile' => true,
                    'hideOnMobile' => false,
                    'mobileBreakpoint' => 768,
                ],
            ],
            'messages' => [
                'welcome' => [
                    'enabled' => true,
                    'title' => 'Chat with us',
                    'message' => 'Hi there! 👋 How can I help you today?',
                ],
                'suggestions' => [
                    'enabled' => true,
                    'items' => [],
                    'showAfterWelcome' => true,
                    'showAfterResponse' => false,
                ],
                'input' => [
                    'placeholder' => 'Type your message...',
                    'maxLength' => 4000,
                    'showCharCount' => false,
                ],
                'system' => [
                    'typingIndicator' => 'Typing...',
                    'connectionError' => 'Connection error. Please try again.',
                    'timeoutError' => 'Request timed out. Please try again.',
                    'rateLimitError' => 'Too many messages. Please wait a moment.',
                    'offlineMessage' => 'We are currently offline.',
                ],
                'attachments' => [
                    'enabled' => false,
                    'allowedTypes' => ['image/*'],
                    'maxFileSize' => 5,
                    'maxFiles' => 3,
                ],
            ],
            'appearance' => [
                'theme' => 'light',
                'colors' => [
                    'primary' => '#3B82F6',
                    'primaryForeground' => '#FFFFFF',
                    'userBubble' => '#3B82F6',
                    'userBubbleForeground' => '#FFFFFF',
                    'botBubble' => '#F3F4F6',
                    'botBubbleForeground' => '#1F2937',
                    'background' => '#FFFFFF',
                    'foreground' => '#1F2937',
                    'headerBackground' => '#3B82F6',
                    'headerForeground' => '#FFFFFF',
                    'border' => '#E5E7EB',
                    'inputBackground' => '#FFFFFF',
                    'inputBorder' => '#D1D5DB',
                    'inputForeground' => '#1F2937',
                    'accent' => '#3B82F6',
                    'error' => '#EF4444',
                    'success' => '#10B981',
                ],
                'typography' => [
                    'fontFamily' => 'system',
                    'fontSize' => 'medium',
                    'headerFontWeight' => 600,
                    'messageFontWeight' => 400,
                ],
                'avatar' => [
                    'enabled' => true,
                    'type' => 'icon',
                    'iconType' => 'robot',
                    'size' => 32,
                    'shape' => 'circle',
                ],
                'animations' => [
                    'enabled' => true,
                    'messageAppear' => 'fade',
                    'typingIndicator' => 'dots',
                    'bubblePulse' => false,
                ],
            ],
            'features' => [
                'chat' => [
                    'showTimestamps' => false,
                    'showReadReceipts' => false,
                    'allowCopy' => true,
                    'allowRegenerate' => false,
                    'enableMarkdown' => true,
                    'enableCodeHighlight' => true,
                    'enableLatex' => false,
                    'enableMermaid' => false,
                ],
                'speech' => [
                    'textToSpeech' => false,
                    'speechToText' => false,
                ],
                'history' => [
                    'enabled' => true,
                    'storageType' => 'local',
                    'maxMessages' => 100,
                    'persistAcrossSessions' => true,
                    'allowExport' => false,
                    'allowClear' => true,
                ],
                'branding' => [
                    'showPoweredBy' => true,
                ],
                'analytics' => [
                    'enabled' => false,
                ],
            ],
        ];
    }
    
    /**
     * Clear cache
     */
    private static function clearCache($identifier): void {
        wp_cache_delete('flowchat_config_' . $identifier, 'flowchat');
    }
    
    /**
     * Export configuration
     */
    public static function export($id): string {
        $config = self::get($id);
        if (!$config) {
            throw new \InvalidArgumentException('Configuration not found');
        }
        
        // Remove sensitive data
        unset($config['connection']['authCredentials']);
        unset($config['id']);
        unset($config['createdBy']);
        
        return wp_json_encode($config, JSON_PRETTY_PRINT);
    }
    
    /**
     * Import configuration
     */
    public static function import(string $json): int {
        $config = json_decode($json, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \InvalidArgumentException('Invalid JSON');
        }
        
        // Generate new slug
        $config['slug'] = sanitize_title($config['name']) . '-' . time();
        $config['status'] = 'inactive';
        $config['isDefault'] = false;
        
        return self::save($config);
    }
}
```

---

## Localization for Frontend

The configuration is passed to the frontend via `wp_localize_script`:

```php
<?php
function flowchat_localize_config($config_slug) {
    $config = \FlowChat\Config::get($config_slug);
    
    if (!$config) {
        return;
    }
    
    // Build frontend-safe config (no credentials)
    $frontend_config = [
        'id' => $config['id'],
        'slug' => $config['slug'],
        
        // Connection (without credentials)
        'webhookUrl' => admin_url('admin-ajax.php'), // Proxied
        'streaming' => $config['connection']['streaming'],
        'timeout' => $config['connection']['timeout'],
        'chatInputKey' => $config['connection']['chatInputKey'],
        'sessionKey' => $config['connection']['sessionKey'],
        
        // Display
        'display' => $config['display'],
        
        // Messages
        'messages' => $config['messages'],
        
        // Appearance
        'appearance' => $config['appearance'],
        
        // Features
        'features' => $config['features'],
        
        // WordPress context
        'context' => [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('flowchat_chat'),
            'pageUrl' => get_permalink(),
            'pageTitle' => get_the_title(),
            'userId' => get_current_user_id(),
            'userEmail' => is_user_logged_in() ? wp_get_current_user()->user_email : null,
            'userName' => is_user_logged_in() ? wp_get_current_user()->display_name : null,
        ],
    ];
    
    wp_localize_script(
        'flowchat-app',
        'flowchatConfig_' . $config['id'],
        $frontend_config
    );
}
```

---

## REST API Endpoints

```php
<?php
/**
 * Register REST API routes
 */
add_action('rest_api_init', function() {
    $namespace = 'flowchat/v1';
    
    // List configurations
    register_rest_route($namespace, '/configs', [
        'methods' => 'GET',
        'callback' => 'flowchat_api_list_configs',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Get single configuration
    register_rest_route($namespace, '/configs/(?P<id>[\d]+)', [
        'methods' => 'GET',
        'callback' => 'flowchat_api_get_config',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Create configuration
    register_rest_route($namespace, '/configs', [
        'methods' => 'POST',
        'callback' => 'flowchat_api_create_config',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Update configuration
    register_rest_route($namespace, '/configs/(?P<id>[\d]+)', [
        'methods' => 'PUT',
        'callback' => 'flowchat_api_update_config',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Delete configuration
    register_rest_route($namespace, '/configs/(?P<id>[\d]+)', [
        'methods' => 'DELETE',
        'callback' => 'flowchat_api_delete_config',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Duplicate configuration
    register_rest_route($namespace, '/configs/(?P<id>[\d]+)/duplicate', [
        'methods' => 'POST',
        'callback' => 'flowchat_api_duplicate_config',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Test connection
    register_rest_route($namespace, '/configs/(?P<id>[\d]+)/test', [
        'methods' => 'POST',
        'callback' => 'flowchat_api_test_connection',
        'permission_callback' => 'flowchat_api_can_manage',
    ]);
    
    // Chat proxy (public, with nonce)
    register_rest_route($namespace, '/chat', [
        'methods' => 'POST',
        'callback' => 'flowchat_api_chat_proxy',
        'permission_callback' => '__return_true',
    ]);
});

function flowchat_api_can_manage() {
    return current_user_can('manage_options');
}
```

---

## Next Document

→ **04-REACT-COMPONENTS.md** - React component specifications
