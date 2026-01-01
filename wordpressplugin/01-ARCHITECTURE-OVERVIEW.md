# FlowChat Pro - Architecture Overview

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Technical Specification

---

## Executive Summary

FlowChat Pro is a premium WordPress plugin that integrates the **assistant-ui** React library with **n8n** automation workflows to create the most sophisticated embeddable chat experience available for WordPress.

### Core Value Proposition

- **Best-in-class UI**: Built on assistant-ui (400k+ npm downloads, Y Combinator backed)
- **Unlimited AI backends**: Connect to any LLM via n8n (OpenAI, Claude, Gemini, local models)
- **400+ integrations**: Chat connected to n8n's entire ecosystem
- **Self-hosted option**: Full data control for privacy-conscious users
- **Non-technical friendly**: Visual configuration, no coding required

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            WORDPRESS FRONTEND                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Shortcode  │  │  Gutenberg  │  │  Elementor  │  │  PHP Chat Loader    │ │
│  │  Handler    │  │   Block     │  │   Widget    │  │  (Enqueue + Mount)  │ │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘ │
│         │                │                │                     │           │
│         └────────────────┴────────────────┴─────────────────────┘           │
│                                    │                                        │
│                    ┌───────────────▼───────────────┐                        │
│                    │     React Application         │                        │
│                    │   (assistant-ui components)   │                        │
│                    │                               │                        │
│                    │  ┌─────────────────────────┐  │                        │
│                    │  │    FlowChat Runtime     │  │                        │
│                    │  │   (LocalRuntime based)  │  │                        │
│                    │  └───────────┬─────────────┘  │                        │
│                    │              │                │                        │
│                    │  ┌───────────▼─────────────┐  │                        │
│                    │  │  n8n Model Adapter      │  │                        │
│                    │  │  - Streaming handler    │  │                        │
│                    │  │  - Session management   │  │                        │
│                    │  │  - Attachment handler   │  │                        │
│                    │  │  - Error handling       │  │                        │
│                    │  └───────────┬─────────────┘  │                        │
│                    └──────────────│────────────────┘                        │
│                                   │                                         │
└───────────────────────────────────│─────────────────────────────────────────┘
                                    │ HTTPS/SSE
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              n8n BACKEND                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      Chat Trigger Node                               │    │
│  │  - Webhook URL endpoint                                             │    │
│  │  - Session ID handling                                              │    │
│  │  - Authentication (none/basic/bearer)                               │    │
│  │  - CORS configuration                                               │    │
│  │  - Streaming response mode                                          │    │
│  └───────────────────────────────────┬─────────────────────────────────┘    │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐    │
│  │                       AI Agent Node                                  │    │
│  │  - LLM connection (OpenAI, Claude, Gemini, Ollama, etc.)           │    │
│  │  - System prompt                                                    │    │
│  │  - Tools/Functions                                                  │    │
│  │  - Streaming output enabled                                         │    │
│  └───────────────────────────────────┬─────────────────────────────────┘    │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐    │
│  │                       Memory Node (Optional)                         │    │
│  │  - Session-based memory                                             │    │
│  │  - PostgreSQL/Redis/MongoDB storage                                 │    │
│  │  - Context window management                                        │    │
│  └───────────────────────────────────┬─────────────────────────────────┘    │
│                                      │                                      │
│  ┌───────────────────────────────────▼─────────────────────────────────┐    │
│  │                      400+ Integration Nodes                          │    │
│  │  - CRM tools, Email, Databases, APIs, etc.                          │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Technology Stack

### Frontend (WordPress)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| React | React 18.x | ^18.2.0 | UI Framework |
| Chat UI | @assistant-ui/react | Latest | Chat components |
| State | Zustand (via assistant-ui) | - | State management |
| Styling | Tailwind CSS | ^3.4.0 | Utility-first CSS |
| Build | @wordpress/scripts | Latest | WordPress-compatible builds |
| TypeScript | TypeScript | ^5.0.0 | Type safety |

### Backend (WordPress PHP)

| Component | Technology | Version | Purpose |
|-----------|------------|---------|---------|
| PHP | PHP | 7.4+ | Server-side logic |
| WordPress | WordPress | 5.8+ | CMS Platform |
| Database | MySQL/MariaDB | - | Data persistence |

### External Services

| Component | Technology | Purpose |
|-----------|------------|---------|
| n8n | n8n Cloud or Self-hosted | Workflow automation |
| LLM | Any (via n8n) | AI responses |

---

## Build System Architecture

### Decision: Hybrid Build Approach

After extensive research, we use a **hybrid build system**:

1. **@wordpress/scripts** for Gutenberg blocks
   - DependencyExtractionWebpackPlugin for WordPress compatibility
   - Automatic dependency extraction
   - Block.json support

2. **Vite** for React chat application
   - Faster development experience
   - Better tree-shaking
   - Modern ES modules
   - Bundle externals for WordPress React

```
/flowchat-pro/
├── package.json                 # Root package.json
├── vite.config.ts              # Vite config for React app
├── webpack.config.js           # Extended wp-scripts config
├── tsconfig.json               # TypeScript config
│
├── src/
│   ├── chat/                   # Chat React app (Vite)
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── runtime/
│   │   │   ├── n8n-adapter.ts
│   │   │   └── FlowChatRuntime.tsx
│   │   ├── components/
│   │   │   ├── ChatBubble.tsx
│   │   │   ├── ChatWindow.tsx
│   │   │   └── ...
│   │   └── styles/
│   │       └── tailwind.css
│   │
│   └── blocks/                 # Gutenberg blocks (wp-scripts)
│       └── flowchat-block/
│           ├── block.json
│           ├── edit.tsx
│           ├── save.tsx
│           └── index.tsx
│
├── build/                      # Vite output
│   ├── chat.js
│   ├── chat.css
│   └── assets/
│
├── blocks-build/               # wp-scripts output
│   └── flowchat-block/
│       ├── index.js
│       └── index.asset.php
│
└── includes/                   # PHP files
    ├── class-flowchat-loader.php
    ├── class-flowchat-admin.php
    └── ...
```

### React Version Handling

WordPress ships its own React. Our approach:

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM'
        }
      }
    }
  }
});
```

```php
// PHP enqueue with WordPress React as dependency
wp_enqueue_script(
    'flowchat-app',
    FLOWCHAT_PLUGIN_URL . 'build/chat.js',
    ['wp-element'], // WordPress React wrapper
    FLOWCHAT_VERSION,
    true
);
```

---

## Data Flow Architecture

### 1. Configuration Flow

```
WordPress Admin UI
       │
       ▼
wp_options table (JSON serialized)
       │
       ▼
PHP generates inline config
       │
       ▼
wp_localize_script() → window.flowchatConfig
       │
       ▼
React reads configuration on mount
```

### 2. Message Flow

```
User types message
       │
       ▼
React Composer captures input
       │
       ▼
n8n Adapter formats request
  - Adds session ID
  - Adds WordPress metadata
  - Adds authentication headers
       │
       ▼
fetch() to n8n webhook URL
       │
       ▼
n8n Chat Trigger receives request
       │
       ▼
AI Agent processes with context
       │
       ▼
Streaming response (SSE chunks)
       │
       ▼
n8n Adapter yields chunks to runtime
       │
       ▼
assistant-ui updates UI progressively
```

### 3. Session Management Flow

```
Page Load
    │
    ▼
Check localStorage for sessionId
    │
    ├─ Found → Use existing sessionId
    │
    └─ Not found → Generate new UUID
           │
           ▼
       Store in localStorage
           │
           ▼
       Include in all n8n requests
```

---

## Multi-Instance Architecture

FlowChat Pro supports multiple independent chat instances on the same page.

### Instance Isolation

```typescript
interface ChatInstance {
  id: string;                    // Unique instance ID
  configId: string;              // References saved configuration
  containerId: string;           // DOM container ID
  runtime: FlowChatRuntime;      // Isolated runtime
  sessionId: string;             // Per-instance session
}

// Global instance registry
const instances = new Map<string, ChatInstance>();
```

### DOM Structure

```html
<!-- Instance 1: Support Bot (Bubble) -->
<div id="flowchat-instance-abc123" 
     class="flowchat-container flowchat-bubble"
     data-config-id="support-bot">
</div>

<!-- Instance 2: Product Advisor (Inline) -->
<div id="flowchat-instance-def456" 
     class="flowchat-container flowchat-inline"
     data-config-id="product-advisor">
</div>
```

---

## Security Architecture

### Authentication Layers

```
┌─────────────────────────────────────────────────────────────────┐
│ Layer 1: WordPress Nonce                                        │
│ - All AJAX requests include wp_nonce                            │
│ - Prevents CSRF attacks                                         │
├─────────────────────────────────────────────────────────────────┤
│ Layer 2: Capability Checks                                       │
│ - Admin pages require 'manage_options'                          │
│ - Settings updates require capability verification              │
├─────────────────────────────────────────────────────────────────┤
│ Layer 3: n8n Authentication                                     │
│ - None: Public access                                           │
│ - Basic Auth: Username/password per configuration               │
│ - Bearer Token: API key authentication                          │
├─────────────────────────────────────────────────────────────────┤
│ Layer 4: Input Sanitization                                      │
│ - All user inputs sanitized (sanitize_text_field, esc_html)     │
│ - File uploads validated by type and size                       │
├─────────────────────────────────────────────────────────────────┤
│ Layer 5: Credential Storage                                      │
│ - API keys encrypted with libsodium                             │
│ - Never exposed in frontend JavaScript                          │
│ - Proxied through WordPress REST endpoint                       │
└─────────────────────────────────────────────────────────────────┘
```

### API Key Proxy Pattern

```php
// REST endpoint for proxying n8n requests
// Keeps API credentials server-side
register_rest_route('flowchat/v1', '/proxy', [
    'methods' => 'POST',
    'callback' => 'flowchat_proxy_request',
    'permission_callback' => function() {
        return wp_verify_nonce($_POST['_nonce'], 'flowchat_proxy');
    }
]);

function flowchat_proxy_request($request) {
    $config_id = sanitize_text_field($request['config_id']);
    $config = flowchat_get_config($config_id);
    
    // Add authentication headers server-side
    $headers = [];
    if ($config['auth_type'] === 'bearer') {
        $headers['Authorization'] = 'Bearer ' . flowchat_decrypt($config['api_key']);
    }
    
    // Forward to n8n
    return wp_remote_post($config['webhook_url'], [
        'headers' => $headers,
        'body' => $request['body']
    ]);
}
```

---

## Performance Architecture

### Lazy Loading Strategy

```php
// Only load React bundle when chat is needed
function flowchat_should_load() {
    global $post;
    
    // Check if shortcode is present
    if (has_shortcode($post->post_content, 'flowchat')) {
        return true;
    }
    
    // Check if block is present
    if (has_block('flowchat/chat', $post)) {
        return true;
    }
    
    // Check if global bubble is enabled
    $global_config = get_option('flowchat_global_bubble');
    if ($global_config && $global_config['enabled']) {
        return true;
    }
    
    return false;
}

add_action('wp_enqueue_scripts', function() {
    if (flowchat_should_load()) {
        wp_enqueue_script('flowchat-app');
        wp_enqueue_style('flowchat-styles');
    }
});
```

### Bundle Optimization

| Bundle | Contents | Target Size |
|--------|----------|-------------|
| chat.js | React app + assistant-ui | < 120KB gzipped |
| chat.css | Tailwind (purged) | < 15KB gzipped |
| admin.js | Admin UI components | < 50KB gzipped |
| admin.css | Admin styles | < 10KB gzipped |

### Caching Strategy

```php
// Cache configuration in transients
function flowchat_get_config($config_id) {
    $cache_key = 'flowchat_config_' . $config_id;
    $cached = get_transient($cache_key);
    
    if ($cached !== false) {
        return $cached;
    }
    
    $config = flowchat_load_config_from_db($config_id);
    set_transient($cache_key, $config, HOUR_IN_SECONDS);
    
    return $config;
}
```

---

## Database Schema

### Custom Tables

```sql
-- Chat configurations
CREATE TABLE {prefix}flowchat_configs (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    config LONGTEXT NOT NULL,  -- JSON serialized
    is_default TINYINT(1) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_slug (slug),
    INDEX idx_default (is_default)
) {charset_collate};

-- Chat sessions (optional, for server-side history)
CREATE TABLE {prefix}flowchat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id VARCHAR(36) NOT NULL,
    config_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    metadata LONGTEXT NULL,  -- JSON: page URL, user agent, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_activity DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    INDEX idx_user (user_id),
    FOREIGN KEY (config_id) REFERENCES {prefix}flowchat_configs(id) ON DELETE CASCADE
) {charset_collate};

-- Chat messages (optional, for server-side history)
CREATE TABLE {prefix}flowchat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content LONGTEXT NOT NULL,
    metadata LONGTEXT NULL,  -- JSON: attachments, tool calls, etc.
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_session (session_id),
    FOREIGN KEY (session_id) REFERENCES {prefix}flowchat_sessions(id) ON DELETE CASCADE
) {charset_collate};
```

---

## File Structure

```
flowchat-pro/
├── flowchat-pro.php                    # Main plugin file
├── uninstall.php                       # Cleanup on uninstall
├── readme.txt                          # WordPress readme
├── license.txt                         # License file
│
├── includes/
│   ├── class-flowchat-activator.php    # Activation hooks
│   ├── class-flowchat-deactivator.php  # Deactivation hooks
│   ├── class-flowchat-loader.php       # Hook loader
│   ├── class-flowchat-i18n.php         # Internationalization
│   ├── class-flowchat-config.php       # Configuration management
│   ├── class-flowchat-database.php     # Database operations
│   ├── class-flowchat-license.php      # License validation
│   └── class-flowchat-security.php     # Encryption/security
│
├── admin/
│   ├── class-flowchat-admin.php        # Admin controller
│   ├── class-flowchat-settings.php     # Settings page
│   ├── class-flowchat-configs-list.php # Configurations list table
│   ├── partials/
│   │   ├── admin-header.php
│   │   ├── admin-settings.php
│   │   └── admin-config-edit.php
│   ├── css/
│   │   └── admin.css
│   └── js/
│       └── admin.js
│
├── public/
│   ├── class-flowchat-public.php       # Public controller
│   ├── class-flowchat-shortcode.php    # Shortcode handler
│   └── class-flowchat-rest.php         # REST API endpoints
│
├── src/                                # TypeScript/React source
│   ├── chat/                           # Chat application
│   ├── admin/                          # Admin React components
│   └── blocks/                         # Gutenberg blocks
│
├── build/                              # Compiled chat assets
├── blocks-build/                       # Compiled block assets
├── admin-build/                        # Compiled admin assets
│
├── elementor/
│   └── class-flowchat-elementor-widget.php
│
├── languages/
│   └── flowchat-pro.pot
│
└── templates/
    ├── chat-templates/                 # Predefined chat styles
    └── email-templates/                # Notification emails
```

---

## Next Steps

1. **02-ADMIN-UI-SPECIFICATION.md** - Detailed admin interface design
2. **03-CHAT-INSTANCES-CONFIG.md** - Multi-instance configuration system
3. **04-REACT-COMPONENTS.md** - React component specifications
4. **05-N8N-RUNTIME-ADAPTER.md** - n8n integration implementation
5. **06-DATABASE-API.md** - Database schema and API endpoints
6. **07-LICENSING-SYSTEM.md** - License key and feature gating
7. **08-BUBBLE-SYSTEM.md** - Chat bubble behavior and states
8. **09-STYLING-THEMING.md** - CSS architecture and themes
9. **10-DEVELOPMENT-GUIDE.md** - Developer setup and workflow
