# FlowChat - Database Schema

## Overview

FlowChat uses WordPress's native `wp_options` table for configuration storage, providing simplicity and compatibility with standard WordPress backup/migration tools. For premium features like chat history, a custom table is used for better performance with large datasets.

## Storage Strategy

| Data Type | Storage Method | Rationale |
|-----------|----------------|-----------|
| Instance configs | wp_options (JSON) | Simple, autoloaded, cached |
| Global settings | wp_options (JSON) | Plugin-wide defaults |
| Templates | wp_options (JSON) | Shared across instances |
| License data | wp_options (JSON) | Sensitive, server-side only |
| Chat history | Custom table | Performance, queries, pagination |

## wp_options Schema

### flowchat_instances

Stores all chat instance configurations as a JSON array.

```php
<?php
// Option: flowchat_instances
// Autoload: yes
// Type: JSON array

[
    {
        // Identity
        "id": "sales-bot",                    // Unique slug identifier
        "name": "Sales Assistant",             // Display name in admin
        "description": "Product inquiries",    // Admin description
        "created_at": "2024-01-15T10:30:00Z",
        "updated_at": "2024-01-20T14:45:00Z",
        
        // n8n Connection
        "endpoint": {
            "url": "https://n8n.example.com/webhook/xxx",
            "type": "chat_trigger",            // chat_trigger | webhook
            "streaming": true,
            "timeout": 60,                     // seconds
            "headers": {                       // Optional custom headers
                "X-Custom-Header": "value"
            }
        },
        
        // Authentication Passthrough
        "auth": {
            "pass_user_data": true,
            "include_fields": ["id", "email", "display_name", "roles"],
            "sign_requests": false,
            "signing_secret": ""               // Encrypted if set
        },
        
        // Behavior
        "behavior": {
            "welcome_message": "Hello! How can I help you today?",
            "placeholder_text": "Type your message...",
            "send_button_text": "Send",
            "typing_indicator": true,
            "show_timestamps": false,
            "auto_scroll": true,
            "sound_enabled": false,
            "markdown_enabled": true,
            "code_highlighting": true,
            "max_message_length": 4000,
            "rate_limit": {
                "enabled": false,
                "max_messages": 10,
                "window_seconds": 60
            }
        },
        
        // Features
        "features": {
            "file_upload": {
                "enabled": true,
                "max_size_mb": 10,
                "allowed_types": ["image/*", "application/pdf", ".doc", ".docx"],
                "max_files": 5
            },
            "voice_input": {
                "enabled": false,
                "language": "en-US"
            },
            "history": {
                "enabled": true,
                "max_messages": 100,
                "persist_across_sessions": true
            },
            "suggestions": {
                "enabled": true,
                "items": [
                    "What products do you offer?",
                    "How can I track my order?",
                    "I need help with returns"
                ]
            },
            "quick_actions": {
                "enabled": false,
                "actions": []
            }
        },
        
        // Appearance
        "appearance": {
            "template": "default",             // Template ID or "custom"
            "theme": "light",                  // light | dark | auto
            "colors": {
                "primary": "#0066cc",
                "primary_foreground": "#ffffff",
                "secondary": "#f5f5f5",
                "secondary_foreground": "#333333",
                "accent": "#00cc66",
                "background": "#ffffff",
                "surface": "#f9f9f9",
                "border": "#e0e0e0",
                "text": "#333333",
                "text_muted": "#666666",
                "user_bubble": "#0066cc",
                "user_bubble_text": "#ffffff",
                "assistant_bubble": "#f5f5f5",
                "assistant_bubble_text": "#333333",
                "error": "#cc0000",
                "success": "#00cc66"
            },
            "typography": {
                "font_family": "inherit",      // CSS font stack or "inherit"
                "font_size_base": "14px",
                "line_height": 1.5,
                "message_font_size": "14px",
                "timestamp_font_size": "11px"
            },
            "dimensions": {
                "width": "400px",
                "height": "600px",
                "max_width": "100%",
                "max_height": "80vh",
                "border_radius": "12px",
                "message_border_radius": "16px",
                "avatar_size": "32px",
                "input_height": "48px"
            },
            "spacing": {
                "message_gap": "12px",
                "container_padding": "16px"
            },
            "shadows": {
                "container": "0 4px 24px rgba(0,0,0,0.1)",
                "message": "none"
            },
            "avatar": {
                "show_assistant": true,
                "show_user": false,
                "assistant_image": "",         // URL or empty for default
                "assistant_fallback": "AI",    // Text fallback
                "user_image": "",
                "user_fallback": ""            // Empty = use initials
            },
            "custom_css": ""                   // Advanced: raw CSS override
        },
        
        // Display Context
        "display": {
            "mode": "inline",                  // inline | bubble | both
            "inline": {
                "container_class": "",
                "show_header": true,
                "show_footer": true,
                "expandable": false
            },
            "bubble": {
                "position": "bottom-right",    // bottom-right | bottom-left
                "offset_x": 20,
                "offset_y": 20,
                "icon": "chat",                // chat | message | custom
                "custom_icon_url": "",
                "badge_enabled": true,
                "auto_open": {
                    "enabled": false,
                    "trigger": "time",         // time | scroll | exit_intent
                    "delay_seconds": 10,
                    "scroll_percent": 50,
                    "once_per_session": true
                },
                "minimize_enabled": true,
                "fullscreen_enabled": true,
                "remember_state": true
            }
        },
        
        // Access Control
        "access": {
            "enabled": true,
            "require_login": false,
            "allowed_roles": [],               // Empty = all roles
            "show_on_pages": [],               // Empty = all pages
            "hide_on_pages": [],
            "show_conditions": []              // Future: advanced conditions
        },
        
        // Error Messages
        "errors": {
            "connection_failed": "Unable to connect. Please try again.",
            "timeout": "The response is taking too long. Please try again.",
            "rate_limited": "Please wait a moment before sending another message.",
            "workflow_error": "Something went wrong. Please try again later.",
            "file_too_large": "File is too large. Maximum size is {max_size}MB.",
            "file_type_not_allowed": "This file type is not allowed.",
            "generic": "An error occurred. Please try again."
        },
        
        // Metadata (for admin)
        "status": "active",                    // active | inactive | draft
        "usage_count": 0,                      // Message count (analytics)
        "last_used": null
    }
    // ... more instances
]
```

### flowchat_global_settings

Plugin-wide settings and defaults.

```php
<?php
// Option: flowchat_global_settings
// Autoload: yes
// Type: JSON object

{
    // Plugin Info
    "version": "1.0.0",
    "installed_at": "2024-01-15T10:00:00Z",
    
    // Default Instance Settings
    "defaults": {
        "endpoint": {
            "timeout": 60,
            "streaming": true
        },
        "behavior": {
            "typing_indicator": true,
            "markdown_enabled": true,
            "max_message_length": 4000
        },
        "appearance": {
            "template": "default",
            "theme": "light"
        }
    },
    
    // Branding
    "branding": {
        "show_powered_by": true,              // "Powered by FlowChat"
        "powered_by_text": "Powered by FlowChat",
        "powered_by_link": "https://flowchat.io",
        "custom_branding": ""                  // Premium: replace branding
    },
    
    // Global Bubble Settings
    "bubble": {
        "enabled": true,
        "default_instance": "",                // Instance ID for bubble
        "allow_instance_switching": true,
        "z_index": 9999
    },
    
    // Performance
    "performance": {
        "lazy_load": true,
        "preload_bubble": false,
        "cache_config": true,
        "cache_ttl": 3600                      // seconds
    },
    
    // Analytics (Premium)
    "analytics": {
        "enabled": false,
        "track_messages": true,
        "track_sessions": true,
        "retention_days": 90
    },
    
    // Advanced
    "advanced": {
        "debug_mode": false,
        "log_errors": true,
        "custom_hooks_enabled": true,
        "rest_api_enabled": true
    },
    
    // Admin UI Preferences
    "admin_ui": {
        "mode": "simple",                      // simple | advanced
        "show_tooltips": true,
        "sidebar_collapsed": false
    }
}
```

### flowchat_templates

Pre-built and custom templates.

```php
<?php
// Option: flowchat_templates
// Autoload: yes
// Type: JSON array

[
    {
        "id": "default",
        "name": "Default",
        "description": "Clean, modern chat interface",
        "category": "built-in",                // built-in | custom | imported
        "is_premium": false,
        "preview_image": "",
        "config": {
            // Partial config - merged with defaults
            "appearance": {
                "colors": {
                    "primary": "#0066cc"
                },
                "dimensions": {
                    "border_radius": "12px"
                }
            }
        }
    },
    {
        "id": "minimal",
        "name": "Minimal",
        "description": "Simple, distraction-free design",
        "category": "built-in",
        "is_premium": false,
        "preview_image": "",
        "config": {
            "appearance": {
                "colors": {
                    "primary": "#333333",
                    "assistant_bubble": "transparent"
                },
                "shadows": {
                    "container": "none"
                }
            }
        }
    },
    {
        "id": "gradient",
        "name": "Gradient",
        "description": "Modern gradient accents",
        "category": "built-in",
        "is_premium": true,
        "preview_image": "",
        "config": {
            "appearance": {
                "colors": {
                    "primary": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                }
            }
        }
    },
    {
        "id": "dark-mode",
        "name": "Dark Mode",
        "description": "Easy on the eyes",
        "category": "built-in",
        "is_premium": false,
        "preview_image": "",
        "config": {
            "appearance": {
                "theme": "dark",
                "colors": {
                    "background": "#1a1a1a",
                    "surface": "#2a2a2a",
                    "text": "#ffffff",
                    "border": "#333333"
                }
            }
        }
    }
    // ... more templates
]
```

### flowchat_license

License and feature activation data.

```php
<?php
// Option: flowchat_license
// Autoload: yes
// Type: JSON object

{
    "key": "",                                 // License key (encrypted)
    "status": "free",                          // free | active | expired | invalid
    "type": "free",                            // free | premium | lifetime
    "activated_at": null,
    "expires_at": null,
    "last_check": null,
    "features": {
        "multi_instance": false,
        "bubble": false,
        "history": false,
        "templates_premium": false,
        "analytics": false,
        "white_label": false,
        "priority_support": false
    },
    "site_url": "",                            // Registered site URL
    "customer_email": ""
}
```

## Custom Tables

### flowchat_history

Stores chat history for persistence (Premium feature).

```sql
CREATE TABLE {$wpdb->prefix}flowchat_history (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    instance_id VARCHAR(100) NOT NULL,
    session_id VARCHAR(100) NOT NULL,
    user_id BIGINT(20) UNSIGNED DEFAULT NULL,
    
    -- Message data
    message_id VARCHAR(100) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content LONGTEXT NOT NULL,
    
    -- Metadata
    metadata JSON DEFAULT NULL,
    attachments JSON DEFAULT NULL,
    
    -- Timestamps
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (id),
    KEY idx_instance_session (instance_id, session_id),
    KEY idx_user_id (user_id),
    KEY idx_created_at (created_at),
    UNIQUE KEY idx_message_id (message_id)
) {$charset_collate};
```

#### Message Metadata JSON Structure

```json
{
    "tokens": {
        "input": 150,
        "output": 200
    },
    "latency_ms": 1200,
    "model": "gpt-4",
    "workflow_id": "xxx",
    "page_url": "https://example.com/products",
    "page_title": "Our Products",
    "user_agent": "Mozilla/5.0...",
    "ip_hash": "abc123"
}
```

### flowchat_sessions

Tracks chat sessions for analytics (Premium feature).

```sql
CREATE TABLE {$wpdb->prefix}flowchat_sessions (
    id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
    session_id VARCHAR(100) NOT NULL,
    instance_id VARCHAR(100) NOT NULL,
    user_id BIGINT(20) UNSIGNED DEFAULT NULL,
    
    -- Session data
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at DATETIME DEFAULT NULL,
    message_count INT UNSIGNED DEFAULT 0,
    
    -- Context
    entry_page VARCHAR(500) DEFAULT NULL,
    referrer VARCHAR(500) DEFAULT NULL,
    user_agent VARCHAR(500) DEFAULT NULL,
    ip_hash VARCHAR(64) DEFAULT NULL,
    
    -- Device info
    device_type ENUM('desktop', 'tablet', 'mobile') DEFAULT NULL,
    browser VARCHAR(50) DEFAULT NULL,
    os VARCHAR(50) DEFAULT NULL,
    
    PRIMARY KEY (id),
    UNIQUE KEY idx_session_id (session_id),
    KEY idx_instance_id (instance_id),
    KEY idx_user_id (user_id),
    KEY idx_started_at (started_at)
) {$charset_collate};
```

## Database Operations

### PHP Helper Class

```php
<?php
namespace FlowChat\Database;

class Schema {
    
    const VERSION = '1.0.0';
    const OPTION_VERSION = 'flowchat_db_version';
    
    /**
     * Create or update database tables
     */
    public static function install(): void {
        global $wpdb;
        
        $charset_collate = $wpdb->get_charset_collate();
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        
        // History table
        $sql_history = "CREATE TABLE {$wpdb->prefix}flowchat_history (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            instance_id VARCHAR(100) NOT NULL,
            session_id VARCHAR(100) NOT NULL,
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,
            message_id VARCHAR(100) NOT NULL,
            role ENUM('user', 'assistant', 'system') NOT NULL,
            content LONGTEXT NOT NULL,
            metadata JSON DEFAULT NULL,
            attachments JSON DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (id),
            KEY idx_instance_session (instance_id, session_id),
            KEY idx_user_id (user_id),
            KEY idx_created_at (created_at),
            UNIQUE KEY idx_message_id (message_id)
        ) {$charset_collate};";
        
        dbDelta($sql_history);
        
        // Sessions table
        $sql_sessions = "CREATE TABLE {$wpdb->prefix}flowchat_sessions (
            id BIGINT(20) UNSIGNED NOT NULL AUTO_INCREMENT,
            session_id VARCHAR(100) NOT NULL,
            instance_id VARCHAR(100) NOT NULL,
            user_id BIGINT(20) UNSIGNED DEFAULT NULL,
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            ended_at DATETIME DEFAULT NULL,
            message_count INT UNSIGNED DEFAULT 0,
            entry_page VARCHAR(500) DEFAULT NULL,
            referrer VARCHAR(500) DEFAULT NULL,
            user_agent VARCHAR(500) DEFAULT NULL,
            ip_hash VARCHAR(64) DEFAULT NULL,
            device_type ENUM('desktop', 'tablet', 'mobile') DEFAULT NULL,
            browser VARCHAR(50) DEFAULT NULL,
            os VARCHAR(50) DEFAULT NULL,
            PRIMARY KEY (id),
            UNIQUE KEY idx_session_id (session_id),
            KEY idx_instance_id (instance_id),
            KEY idx_user_id (user_id),
            KEY idx_started_at (started_at)
        ) {$charset_collate};";
        
        dbDelta($sql_sessions);
        
        update_option(self::OPTION_VERSION, self::VERSION);
    }
    
    /**
     * Remove all plugin data
     */
    public static function uninstall(): void {
        global $wpdb;
        
        // Drop tables
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}flowchat_history");
        $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}flowchat_sessions");
        
        // Remove options
        delete_option('flowchat_instances');
        delete_option('flowchat_global_settings');
        delete_option('flowchat_templates');
        delete_option('flowchat_license');
        delete_option(self::OPTION_VERSION);
    }
    
    /**
     * Check if tables need updating
     */
    public static function needs_update(): bool {
        $current = get_option(self::OPTION_VERSION, '0.0.0');
        return version_compare($current, self::VERSION, '<');
    }
}
```

### Data Migration Utilities

```php
<?php
namespace FlowChat\Database;

class Migration {
    
    /**
     * Export all plugin data
     */
    public static function export(): array {
        global $wpdb;
        
        return [
            'version' => Schema::VERSION,
            'exported_at' => current_time('mysql'),
            'instances' => get_option('flowchat_instances', []),
            'settings' => get_option('flowchat_global_settings', []),
            'templates' => get_option('flowchat_templates', []),
            // Note: License data not exported for security
            'history_count' => (int) $wpdb->get_var(
                "SELECT COUNT(*) FROM {$wpdb->prefix}flowchat_history"
            )
        ];
    }
    
    /**
     * Import plugin data
     */
    public static function import(array $data): bool {
        if (empty($data['version'])) {
            return false;
        }
        
        if (!empty($data['instances'])) {
            update_option('flowchat_instances', $data['instances']);
        }
        
        if (!empty($data['settings'])) {
            update_option('flowchat_global_settings', $data['settings']);
        }
        
        if (!empty($data['templates'])) {
            // Merge with existing built-in templates
            $existing = get_option('flowchat_templates', []);
            $builtin = array_filter($existing, fn($t) => $t['category'] === 'built-in');
            $imported = array_filter($data['templates'], fn($t) => $t['category'] !== 'built-in');
            update_option('flowchat_templates', array_merge($builtin, $imported));
        }
        
        return true;
    }
    
    /**
     * Clean up old history entries
     */
    public static function cleanup_history(int $days = 90): int {
        global $wpdb;
        
        $cutoff = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        
        return $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}flowchat_history WHERE created_at < %s",
                $cutoff
            )
        );
    }
}
```

## Data Validation

### Instance Config Validation Schema

```php
<?php
namespace FlowChat\Validation;

class InstanceValidator {
    
    private static array $required_fields = [
        'id', 'name', 'endpoint.url'
    ];
    
    private static array $field_types = [
        'id' => 'string',
        'name' => 'string',
        'endpoint.url' => 'url',
        'endpoint.timeout' => 'integer',
        'endpoint.streaming' => 'boolean',
        'behavior.max_message_length' => 'integer',
        'features.file_upload.max_size_mb' => 'integer',
        'appearance.colors.*' => 'color',
        'appearance.dimensions.*' => 'css_value',
    ];
    
    public static function validate(array $config): array {
        $errors = [];
        
        // Check required fields
        foreach (self::$required_fields as $field) {
            if (!self::get_nested($config, $field)) {
                $errors[] = "Missing required field: {$field}";
            }
        }
        
        // Validate field types
        foreach (self::$field_types as $field => $type) {
            $value = self::get_nested($config, $field);
            if ($value !== null && !self::validate_type($value, $type)) {
                $errors[] = "Invalid type for {$field}: expected {$type}";
            }
        }
        
        // Custom validations
        if (!empty($config['id']) && !preg_match('/^[a-z0-9-]+$/', $config['id'])) {
            $errors[] = "ID must contain only lowercase letters, numbers, and hyphens";
        }
        
        return $errors;
    }
    
    private static function get_nested(array $arr, string $path) {
        $keys = explode('.', $path);
        $value = $arr;
        
        foreach ($keys as $key) {
            if ($key === '*') continue;
            if (!isset($value[$key])) return null;
            $value = $value[$key];
        }
        
        return $value;
    }
    
    private static function validate_type($value, string $type): bool {
        return match($type) {
            'string' => is_string($value),
            'integer' => is_int($value) || ctype_digit($value),
            'boolean' => is_bool($value),
            'url' => filter_var($value, FILTER_VALIDATE_URL) !== false,
            'color' => preg_match('/^(#[0-9a-fA-F]{3,8}|rgba?\(|hsla?\(|linear-gradient|inherit|transparent)/', $value),
            'css_value' => preg_match('/^(\d+(\.\d+)?(px|em|rem|%|vh|vw)|auto|inherit|none)$/', $value),
            default => true
        };
    }
}
```

## Performance Indexes

### Recommended Indexes

```sql
-- For history queries by session
CREATE INDEX idx_session_recent ON {prefix}flowchat_history 
    (session_id, created_at DESC);

-- For user history lookup
CREATE INDEX idx_user_recent ON {prefix}flowchat_history 
    (user_id, created_at DESC);

-- For analytics queries
CREATE INDEX idx_analytics ON {prefix}flowchat_sessions 
    (instance_id, started_at, message_count);
```

### Query Optimization Notes

1. **History Pagination**: Always use `id` for cursor-based pagination, not `created_at`
2. **Session Lookups**: Composite index on (instance_id, session_id) is critical
3. **Analytics**: Pre-aggregate data for dashboards, don't query raw tables
4. **Cleanup**: Run during off-peak hours, process in batches of 1000
