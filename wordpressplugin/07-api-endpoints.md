# FlowChat - API Endpoints Specification

## Overview

This document specifies all REST API and AJAX endpoints for the FlowChat plugin. The API provides endpoints for admin configuration, frontend data access, and chat history management.

---

## 1. API Architecture

### 1.1 Endpoint Structure

```
WordPress REST API Base: /wp-json/flowchat/v1/

├── /instances                    # Instance management (Admin)
│   ├── GET     - List all instances
│   ├── POST    - Create instance
│   ├── GET     /{id}            - Get single instance
│   ├── PUT     /{id}            - Update instance
│   ├── DELETE  /{id}            - Delete instance
│   ├── POST    /{id}/duplicate  - Duplicate instance
│   └── POST    /reorder         - Reorder instances
│
├── /settings                     # Global settings (Admin)
│   ├── GET     - Get all settings
│   └── PUT     - Update settings
│
├── /templates                    # Template management (Admin)
│   ├── GET     - List templates
│   ├── POST    - Create custom template
│   ├── PUT     /{id}            - Update template
│   └── DELETE  /{id}            - Delete template
│
├── /license                      # License management (Admin)
│   ├── GET     - Get license status
│   ├── POST    /activate        - Activate license
│   └── POST    /deactivate      - Deactivate license
│
├── /config                       # Frontend configuration (Public)
│   └── GET     - Get config for page
│
├── /history                      # Chat history (Premium)
│   ├── GET     /{instance}      - Get history for instance
│   ├── POST    /{instance}      - Save message
│   └── DELETE  /{instance}      - Clear history
│
└── /analytics                    # Analytics (Premium)
    ├── GET     /overview        - Dashboard stats
    └── GET     /sessions        - Session data
```

### 1.2 Authentication & Authorization

```php
/**
 * Permission callback definitions
 */
class FlowChat_API_Permissions {
    
    /**
     * Admin-only endpoints
     */
    public static function admin_only() {
        return current_user_can('manage_options');
    }
    
    /**
     * Editor and above
     */
    public static function editor_or_above() {
        return current_user_can('edit_posts');
    }
    
    /**
     * Logged-in users
     */
    public static function logged_in() {
        return is_user_logged_in();
    }
    
    /**
     * Public (with nonce validation)
     */
    public static function public_access() {
        return true; // Nonce validated separately
    }
    
    /**
     * Premium feature check
     */
    public static function premium_required() {
        return self::admin_only() && FlowChat_License::is_premium();
    }
}
```

### 1.3 Response Format

All API responses follow a consistent format:

```typescript
// Success response
interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    total?: number;
    page?: number;
    per_page?: number;
  };
}

// Error response
interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}
```

---

## 2. Instance Management Endpoints

### 2.1 List Instances

```
GET /wp-json/flowchat/v1/instances
```

**Permission**: `manage_options`

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | `all` | Filter by status: all, active, inactive |
| `orderby` | string | `order` | Sort by: order, name, created |
| `order` | string | `asc` | Sort direction: asc, desc |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "sales-bot",
      "name": "Sales Assistant",
      "description": "Helps customers with product questions",
      "status": "active",
      "order": 1,
      "endpoint": {
        "webhookUrl": "https://n8n.example.com/webhook/xxx",
        "streaming": true,
        "timeout": 30000
      },
      "created_at": "2024-01-15T10:30:00Z",
      "updated_at": "2024-01-20T14:45:00Z"
    }
  ],
  "meta": {
    "total": 3,
    "limit": {
      "current": 3,
      "max": null
    }
  }
}
```

**PHP Implementation**:
```php
/**
 * GET /instances
 */
public function get_instances(WP_REST_Request $request) {
    $instances = FlowChat_Instance_Manager::get_all();
    
    // Apply filters
    $status = $request->get_param('status');
    if ($status && $status !== 'all') {
        $instances = array_filter($instances, function($i) use ($status) {
            return $i['status'] === $status;
        });
    }
    
    // Apply sorting
    $orderby = $request->get_param('orderby') ?: 'order';
    $order = $request->get_param('order') ?: 'asc';
    
    usort($instances, function($a, $b) use ($orderby, $order) {
        $cmp = $a[$orderby] <=> $b[$orderby];
        return $order === 'desc' ? -$cmp : $cmp;
    });
    
    // Check license limits
    $license = FlowChat_License::get_status();
    $limit = $license['is_premium'] ? null : 1;
    
    return new WP_REST_Response([
        'success' => true,
        'data' => array_values($instances),
        'meta' => [
            'total' => count($instances),
            'limit' => [
                'current' => count($instances),
                'max' => $limit,
            ],
        ],
    ], 200);
}
```

### 2.2 Create Instance

```
POST /wp-json/flowchat/v1/instances
```

**Permission**: `manage_options`

**Request Body**:
```json
{
  "name": "Support Bot",
  "description": "Customer support chatbot",
  "endpoint": {
    "webhookUrl": "https://n8n.example.com/webhook/support",
    "streaming": true,
    "timeout": 30000,
    "authentication": {
      "enabled": true,
      "type": "header",
      "headerName": "X-API-Key",
      "headerValue": "secret-key"
    }
  },
  "behavior": {
    "welcomeMessage": "Hello! How can I help you today?",
    "placeholder": "Type your message...",
    "showTimestamps": true
  },
  "features": {
    "fileUpload": false,
    "history": true,
    "suggestions": ["Track my order", "Return policy"]
  },
  "appearance": {
    "template": "modern",
    "theme": "light",
    "primaryColor": "#0073aa"
  },
  "display": {
    "modes": ["bubble"],
    "bubblePosition": "bottom-right"
  },
  "access": {
    "requireLogin": false,
    "allowedRoles": []
  }
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "support-bot",
    "name": "Support Bot",
    "status": "active",
    ...
  }
}
```

**Validation Rules**:
```php
/**
 * Instance validation schema
 */
class FlowChat_Instance_Validator {
    
    public static function get_schema() {
        return [
            'name' => [
                'required' => true,
                'type' => 'string',
                'minLength' => 1,
                'maxLength' => 100,
                'sanitize' => 'sanitize_text_field',
            ],
            'endpoint.webhookUrl' => [
                'required' => true,
                'type' => 'url',
                'pattern' => '/^https?:\/\//',
            ],
            'endpoint.timeout' => [
                'type' => 'integer',
                'minimum' => 5000,
                'maximum' => 120000,
                'default' => 30000,
            ],
            'behavior.welcomeMessage' => [
                'type' => 'string',
                'maxLength' => 500,
                'sanitize' => 'wp_kses_post',
            ],
            'appearance.primaryColor' => [
                'type' => 'string',
                'pattern' => '/^#[0-9A-Fa-f]{6}$/',
            ],
            // ... more validation rules
        ];
    }
    
    public static function validate($data, $partial = false) {
        $errors = [];
        $schema = self::get_schema();
        
        foreach ($schema as $field => $rules) {
            $value = self::get_nested_value($data, $field);
            
            // Required check (only for full validation)
            if (!$partial && !empty($rules['required']) && $value === null) {
                $errors[$field][] = sprintf('%s is required', $field);
                continue;
            }
            
            if ($value === null) continue;
            
            // Type validation
            if (!self::validate_type($value, $rules['type'] ?? 'string')) {
                $errors[$field][] = sprintf('%s must be of type %s', $field, $rules['type']);
            }
            
            // Pattern validation
            if (!empty($rules['pattern']) && !preg_match($rules['pattern'], $value)) {
                $errors[$field][] = sprintf('%s format is invalid', $field);
            }
            
            // Length validation
            if (!empty($rules['minLength']) && strlen($value) < $rules['minLength']) {
                $errors[$field][] = sprintf('%s must be at least %d characters', $field, $rules['minLength']);
            }
            
            if (!empty($rules['maxLength']) && strlen($value) > $rules['maxLength']) {
                $errors[$field][] = sprintf('%s must not exceed %d characters', $field, $rules['maxLength']);
            }
        }
        
        return empty($errors) ? true : $errors;
    }
}
```

### 2.3 Get Single Instance

```
GET /wp-json/flowchat/v1/instances/{id}
```

**Permission**: `manage_options`

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sales-bot",
    "name": "Sales Assistant",
    "description": "Helps customers with product questions",
    "status": "active",
    "order": 1,
    "endpoint": { ... },
    "behavior": { ... },
    "features": { ... },
    "appearance": { ... },
    "display": { ... },
    "access": { ... },
    "errors": { ... },
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-20T14:45:00Z"
  }
}
```

**Error Response** (404):
```json
{
  "success": false,
  "error": {
    "code": "instance_not_found",
    "message": "Instance with ID 'xyz' not found"
  }
}
```

### 2.4 Update Instance

```
PUT /wp-json/flowchat/v1/instances/{id}
```

**Permission**: `manage_options`

**Request Body** (partial update supported):
```json
{
  "name": "Updated Name",
  "endpoint": {
    "timeout": 45000
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "sales-bot",
    "name": "Updated Name",
    ...
  }
}
```

### 2.5 Delete Instance

```
DELETE /wp-json/flowchat/v1/instances/{id}
```

**Permission**: `manage_options`

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": true,
    "id": "sales-bot"
  }
}
```

### 2.6 Duplicate Instance

```
POST /wp-json/flowchat/v1/instances/{id}/duplicate
```

**Permission**: `manage_options`

**Request Body** (optional):
```json
{
  "name": "Sales Bot (Copy)"
}
```

**Response** (201 Created):
```json
{
  "success": true,
  "data": {
    "id": "sales-bot-copy",
    "name": "Sales Bot (Copy)",
    ...
  }
}
```

### 2.7 Reorder Instances

```
POST /wp-json/flowchat/v1/instances/reorder
```

**Permission**: `manage_options`

**Request Body**:
```json
{
  "order": ["support-bot", "sales-bot", "faq-bot"]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "reordered": true
  }
}
```

---

## 3. Global Settings Endpoints

### 3.1 Get Settings

```
GET /wp-json/flowchat/v1/settings
```

**Permission**: `manage_options`

**Response**:
```json
{
  "success": true,
  "data": {
    "defaults": {
      "streaming": true,
      "timeout": 30000,
      "theme": "light",
      "showTimestamps": true
    },
    "branding": {
      "poweredBy": true,
      "customBranding": ""
    },
    "bubble": {
      "defaultEnabled": true,
      "globalPosition": "bottom-right",
      "showOnMobile": true,
      "mobileBreakpoint": 768
    },
    "performance": {
      "lazyLoad": true,
      "preloadBubble": false,
      "cacheConfig": true
    },
    "analytics": {
      "enabled": false,
      "trackConversations": false
    }
  }
}
```

### 3.2 Update Settings

```
PUT /wp-json/flowchat/v1/settings
```

**Permission**: `manage_options`

**Request Body** (partial update):
```json
{
  "defaults": {
    "timeout": 45000
  },
  "bubble": {
    "globalPosition": "bottom-left"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "updated": true,
    "settings": { ... }
  }
}
```

---

## 4. Template Endpoints

### 4.1 List Templates

```
GET /wp-json/flowchat/v1/templates
```

**Permission**: `manage_options`

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `type` | string | Filter: all, builtin, custom |

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "modern",
      "name": "Modern",
      "description": "Clean, contemporary design",
      "type": "builtin",
      "preview": "https://example.com/previews/modern.png",
      "styles": {
        "borderRadius": "12px",
        "fontFamily": "Inter, sans-serif",
        ...
      }
    },
    {
      "id": "custom-brand",
      "name": "Brand Template",
      "type": "custom",
      "styles": { ... }
    }
  ]
}
```

### 4.2 Create Custom Template

```
POST /wp-json/flowchat/v1/templates
```

**Permission**: `manage_options` + Premium

**Request Body**:
```json
{
  "name": "Brand Template",
  "description": "Custom branded template",
  "styles": {
    "borderRadius": "8px",
    "fontFamily": "Roboto, sans-serif",
    "primaryColor": "#ff6600",
    "backgroundColor": "#ffffff",
    "userMessageBg": "#ff6600",
    "assistantMessageBg": "#f5f5f5"
  }
}
```

### 4.3 Update Template

```
PUT /wp-json/flowchat/v1/templates/{id}
```

**Permission**: `manage_options`

**Note**: Only custom templates can be updated.

### 4.4 Delete Template

```
DELETE /wp-json/flowchat/v1/templates/{id}
```

**Permission**: `manage_options`

**Note**: Only custom templates can be deleted.

---

## 5. License Endpoints

### 5.1 Get License Status

```
GET /wp-json/flowchat/v1/license
```

**Permission**: `manage_options`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "active",
    "is_premium": true,
    "license_key": "****-****-****-ABCD",
    "expires_at": "2025-01-15T00:00:00Z",
    "features": [
      "unlimited_instances",
      "chat_history",
      "custom_templates",
      "analytics",
      "priority_support"
    ],
    "limits": {
      "instances": null
    }
  }
}
```

### 5.2 Activate License

```
POST /wp-json/flowchat/v1/license/activate
```

**Permission**: `manage_options`

**Request Body**:
```json
{
  "license_key": "XXXX-XXXX-XXXX-XXXX"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "activated": true,
    "status": "active",
    "expires_at": "2025-01-15T00:00:00Z",
    "features": [ ... ]
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": {
    "code": "invalid_license",
    "message": "The license key is invalid or has expired"
  }
}
```

### 5.3 Deactivate License

```
POST /wp-json/flowchat/v1/license/deactivate
```

**Permission**: `manage_options`

**Response**:
```json
{
  "success": true,
  "data": {
    "deactivated": true,
    "status": "inactive"
  }
}
```

---

## 6. Frontend Configuration Endpoint

### 6.1 Get Page Configuration

```
GET /wp-json/flowchat/v1/config
```

**Permission**: Public (nonce validated)

**Headers**:
```
X-WP-Nonce: {nonce}
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `page_id` | number | Current page/post ID |
| `url` | string | Current page URL |
| `instance` | string | Specific instance ID (optional) |

**Response**:
```json
{
  "success": true,
  "data": {
    "instances": {
      "sales-bot": {
        "id": "sales-bot",
        "name": "Sales Assistant",
        "endpoint": {
          "webhookUrl": "https://n8n.example.com/webhook/xxx",
          "streaming": true,
          "timeout": 30000,
          "authentication": {
            "enabled": false
          }
        },
        "behavior": {
          "welcomeMessage": "Hello! How can I help?",
          "placeholder": "Type a message...",
          "showTimestamps": true,
          "enableMarkdown": true
        },
        "features": {
          "fileUpload": false,
          "voiceInput": false,
          "history": false,
          "suggestions": ["Product info", "Pricing"]
        },
        "appearance": {
          "template": "modern",
          "theme": "light",
          "primaryColor": "#0073aa",
          "borderRadius": "12px",
          "fontFamily": "inherit"
        },
        "display": {
          "modes": ["bubble"],
          "bubblePosition": "bottom-right",
          "bubbleIcon": "chat",
          "bubbleLabel": "Chat with us"
        }
      }
    },
    "wpContext": {
      "user": {
        "id": 1,
        "email": "user@example.com",
        "displayName": "John Doe",
        "roles": ["subscriber"],
        "isLoggedIn": true
      },
      "page": {
        "id": 42,
        "title": "Products",
        "url": "https://example.com/products",
        "postType": "page"
      },
      "site": {
        "name": "My Store",
        "url": "https://example.com",
        "language": "en-US"
      }
    },
    "apiEndpoints": {
      "base": "https://example.com/wp-json/flowchat/v1",
      "nonce": "abc123..."
    },
    "premium": {
      "enabled": true,
      "features": ["history", "analytics"]
    }
  }
}
```

**PHP Implementation**:
```php
/**
 * Get frontend configuration
 */
public function get_frontend_config(WP_REST_Request $request) {
    $page_id = $request->get_param('page_id');
    $url = $request->get_param('url');
    $instance_id = $request->get_param('instance');
    
    // Get applicable instances for this page
    $all_instances = FlowChat_Instance_Manager::get_all();
    $applicable = [];
    
    foreach ($all_instances as $instance) {
        if ($instance['status'] !== 'active') continue;
        
        // Check page visibility rules
        if (!$this->is_instance_visible($instance, $page_id, $url)) continue;
        
        // Check access rules
        if (!$this->check_access($instance)) continue;
        
        // If specific instance requested, filter
        if ($instance_id && $instance['id'] !== $instance_id) continue;
        
        // Prepare config (remove sensitive data)
        $applicable[$instance['id']] = $this->prepare_instance_for_frontend($instance);
    }
    
    // Build WordPress context
    $wp_context = [
        'user' => $this->get_user_context(),
        'page' => $this->get_page_context($page_id, $url),
        'site' => $this->get_site_context(),
    ];
    
    return new WP_REST_Response([
        'success' => true,
        'data' => [
            'instances' => $applicable,
            'wpContext' => $wp_context,
            'apiEndpoints' => [
                'base' => rest_url('flowchat/v1'),
                'nonce' => wp_create_nonce('wp_rest'),
            ],
            'premium' => FlowChat_License::get_frontend_features(),
        ],
    ], 200);
}

/**
 * Check if instance should be visible on page
 */
private function is_instance_visible($instance, $page_id, $url) {
    $rules = $instance['display']['visibility'] ?? [];
    
    if (empty($rules)) return true; // No rules = show everywhere
    
    $mode = $rules['mode'] ?? 'all';
    
    switch ($mode) {
        case 'all':
            return true;
            
        case 'include':
            return $this->matches_page_rules($rules['pages'] ?? [], $page_id, $url);
            
        case 'exclude':
            return !$this->matches_page_rules($rules['pages'] ?? [], $page_id, $url);
            
        default:
            return true;
    }
}
```

---

## 7. Chat History Endpoints (Premium)

### 7.1 Get History

```
GET /wp-json/flowchat/v1/history/{instance_id}
```

**Permission**: Logged in + Premium

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `session_id` | string | - | Filter by session |
| `limit` | number | 50 | Max messages |
| `before` | string | - | Cursor for pagination |

**Response**:
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "msg_123",
        "role": "user",
        "content": "Hello!",
        "created_at": "2024-01-15T10:30:00Z"
      },
      {
        "id": "msg_124",
        "role": "assistant",
        "content": "Hi there! How can I help you today?",
        "created_at": "2024-01-15T10:30:05Z"
      }
    ],
    "has_more": true,
    "cursor": "msg_122"
  }
}
```

### 7.2 Save Message

```
POST /wp-json/flowchat/v1/history/{instance_id}
```

**Permission**: Logged in + Premium

**Request Body**:
```json
{
  "session_id": "user1_abc123",
  "messages": [
    {
      "id": "msg_125",
      "role": "user",
      "content": "Thanks!",
      "created_at": "2024-01-15T10:35:00Z"
    },
    {
      "id": "msg_126",
      "role": "assistant", 
      "content": "You're welcome!",
      "created_at": "2024-01-15T10:35:03Z"
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "saved": 2
  }
}
```

### 7.3 Clear History

```
DELETE /wp-json/flowchat/v1/history/{instance_id}
```

**Permission**: Logged in + Premium

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `session_id` | string | Clear specific session (optional) |

**Response**:
```json
{
  "success": true,
  "data": {
    "deleted": 42
  }
}
```

---

## 8. Analytics Endpoints (Premium)

### 8.1 Overview Stats

```
GET /wp-json/flowchat/v1/analytics/overview
```

**Permission**: `manage_options` + Premium

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `period` | string | `7d` | Time period: 24h, 7d, 30d, 90d |
| `instance` | string | all | Filter by instance |

**Response**:
```json
{
  "success": true,
  "data": {
    "period": "7d",
    "metrics": {
      "total_conversations": 156,
      "total_messages": 892,
      "unique_users": 78,
      "avg_messages_per_conversation": 5.7
    },
    "by_instance": {
      "sales-bot": {
        "conversations": 89,
        "messages": 534
      },
      "support-bot": {
        "conversations": 67,
        "messages": 358
      }
    },
    "trend": {
      "conversations": [
        { "date": "2024-01-08", "count": 18 },
        { "date": "2024-01-09", "count": 22 },
        ...
      ]
    }
  }
}
```

### 8.2 Session Data

```
GET /wp-json/flowchat/v1/analytics/sessions
```

**Permission**: `manage_options` + Premium

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `instance` | string | Filter by instance |
| `page` | number | Page number |
| `per_page` | number | Items per page (max 100) |

**Response**:
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "id": "sess_123",
        "instance_id": "sales-bot",
        "user_id": 42,
        "started_at": "2024-01-15T10:30:00Z",
        "ended_at": "2024-01-15T10:45:00Z",
        "message_count": 8,
        "page_url": "/products"
      }
    ]
  },
  "meta": {
    "total": 156,
    "page": 1,
    "per_page": 20,
    "total_pages": 8
  }
}
```

---

## 9. AJAX Fallback Endpoints

For environments where REST API is restricted, AJAX fallbacks are provided:

### 9.1 AJAX Actions

```php
// Frontend config (public)
add_action('wp_ajax_flowchat_get_config', [$this, 'ajax_get_config']);
add_action('wp_ajax_nopriv_flowchat_get_config', [$this, 'ajax_get_config']);

// History (logged in only)
add_action('wp_ajax_flowchat_get_history', [$this, 'ajax_get_history']);
add_action('wp_ajax_flowchat_save_history', [$this, 'ajax_save_history']);

// Admin operations
add_action('wp_ajax_flowchat_admin_instances', [$this, 'ajax_admin_instances']);
add_action('wp_ajax_flowchat_admin_settings', [$this, 'ajax_admin_settings']);
```

### 9.2 AJAX Request Format

```javascript
// Example: Get config via AJAX
const response = await fetch(flowchatConfig.ajaxUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
  },
  body: new URLSearchParams({
    action: 'flowchat_get_config',
    nonce: flowchatConfig.nonce,
    page_id: '42',
  }),
});
```

---

## 10. Error Codes Reference

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `unauthorized` | 401 | Not authenticated |
| `forbidden` | 403 | Insufficient permissions |
| `not_found` | 404 | Resource not found |
| `validation_error` | 400 | Invalid request data |
| `instance_not_found` | 404 | Instance doesn't exist |
| `instance_limit_reached` | 403 | Free tier limit exceeded |
| `premium_required` | 403 | Premium feature requested |
| `invalid_license` | 400 | License key invalid |
| `license_expired` | 403 | License has expired |
| `duplicate_id` | 409 | Instance ID already exists |
| `server_error` | 500 | Internal server error |

---

## 11. Rate Limiting

```php
/**
 * Rate limiting for API endpoints
 */
class FlowChat_Rate_Limiter {
    
    private static $limits = [
        'config' => ['requests' => 60, 'window' => 60],      // 60/min
        'history_read' => ['requests' => 30, 'window' => 60], // 30/min
        'history_write' => ['requests' => 10, 'window' => 60], // 10/min
        'admin' => ['requests' => 100, 'window' => 60],       // 100/min
    ];
    
    public static function check($endpoint_type, $identifier) {
        $key = "flowchat_rate_{$endpoint_type}_{$identifier}";
        $limit = self::$limits[$endpoint_type] ?? self::$limits['admin'];
        
        $current = get_transient($key) ?: ['count' => 0, 'start' => time()];
        
        // Reset if window expired
        if (time() - $current['start'] > $limit['window']) {
            $current = ['count' => 0, 'start' => time()];
        }
        
        // Check limit
        if ($current['count'] >= $limit['requests']) {
            return false;
        }
        
        // Increment
        $current['count']++;
        set_transient($key, $current, $limit['window']);
        
        return true;
    }
}
```

---

## 12. Security Considerations

### 12.1 Input Sanitization

All inputs are sanitized before processing:

```php
/**
 * Sanitize instance data
 */
public static function sanitize_instance_data($data) {
    return [
        'name' => sanitize_text_field($data['name'] ?? ''),
        'description' => sanitize_textarea_field($data['description'] ?? ''),
        'endpoint' => [
            'webhookUrl' => esc_url_raw($data['endpoint']['webhookUrl'] ?? ''),
            'streaming' => (bool) ($data['endpoint']['streaming'] ?? true),
            'timeout' => absint($data['endpoint']['timeout'] ?? 30000),
        ],
        'behavior' => [
            'welcomeMessage' => wp_kses_post($data['behavior']['welcomeMessage'] ?? ''),
            'placeholder' => sanitize_text_field($data['behavior']['placeholder'] ?? ''),
        ],
        'appearance' => [
            'primaryColor' => sanitize_hex_color($data['appearance']['primaryColor'] ?? '#0073aa'),
            'customCss' => wp_strip_all_tags($data['appearance']['customCss'] ?? ''),
        ],
        // ... more sanitization
    ];
}
```

### 12.2 Output Escaping

All outputs are escaped before rendering:

```php
// In REST responses - data is JSON encoded (safe)
// In admin templates - use esc_html(), esc_attr(), esc_url()
```

### 12.3 Capability Checks

Every admin endpoint verifies capabilities:

```php
if (!current_user_can('manage_options')) {
    return new WP_Error('forbidden', 'Insufficient permissions', ['status' => 403]);
}
```
