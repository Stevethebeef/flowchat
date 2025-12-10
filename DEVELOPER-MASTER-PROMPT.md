# FlowChat Developer Master Prompt

## Instructions for Claude Code

You are building **FlowChat**, a WordPress plugin that connects AI chat widgets to n8n automation workflows. This document provides all context needed to start development.

---

## Quick Start

```bash
# 1. Create plugin directory
mkdir flowchat && cd flowchat

# 2. Initialize
npm init -y
composer init --no-interaction

# 3. Install dependencies
npm install react react-dom @assistant-ui/react
npm install -D @wordpress/scripts @vitejs/plugin-react vite typescript @types/react @types/react-dom concurrently

# 4. Create main plugin file and start building
```

---

## Project Overview

**FlowChat** is a WordPress plugin that:
1. Displays AI-powered chat widgets on WordPress sites
2. Connects directly to n8n webhooks for AI processing
3. Supports multiple chat instances with different configs
4. Offers inline and floating bubble display modes

### Key Architecture Decisions

| Decision | Implementation |
|----------|----------------|
| **Streaming** | Browser connects directly to n8n (not through PHP) |
| **Auth** | WordPress validates access, then gives webhook URL to browser |
| **Chat Library** | @assistant-ui/react |
| **Build System** | Vite for frontend, wp-scripts for admin |
| **File Uploads** | Temporary storage with auto-cleanup (NOT Media Library) |

### Data Flow

```
Page Load:
Browser → WordPress REST API → Returns {webhookUrl, config, sessionId}

Chat Messages:
Browser ←→ n8n Webhook (SSE streaming, WordPress not involved)
```

---

## File Structure to Create

```
flowchat/
├── flowchat.php                      # START HERE
├── uninstall.php
├── composer.json
├── package.json
├── vite.config.ts
├── tsconfig.json
│
├── includes/
│   ├── autoload.php
│   ├── class-plugin.php
│   ├── class-activator.php
│   ├── class-deactivator.php
│   │
│   ├── admin/
│   │   ├── class-admin.php
│   │   └── class-menu.php
│   │
│   ├── api/
│   │   ├── class-public-endpoints.php
│   │   └── class-admin-endpoints.php
│   │
│   ├── core/
│   │   ├── class-instance-manager.php
│   │   ├── class-session-manager.php
│   │   ├── class-context-builder.php
│   │   └── class-file-handler.php
│   │
│   ├── frontend/
│   │   ├── class-frontend.php
│   │   ├── class-shortcode.php
│   │   └── class-assets.php
│   │
│   └── database/
│       └── class-schema.php
│
├── src/
│   ├── index.ts                      # Frontend entry
│   ├── admin-index.ts                # Admin entry
│   │
│   ├── runtime/
│   │   └── N8nRuntimeAdapter.ts      # CRITICAL - chat backend
│   │
│   ├── components/
│   │   ├── chat/
│   │   │   ├── ChatWidget.tsx
│   │   │   ├── ChatHeader.tsx
│   │   │   ├── ChatMessages.tsx
│   │   │   ├── ChatMessage.tsx
│   │   │   ├── ChatInput.tsx
│   │   │   └── TypingIndicator.tsx
│   │   │
│   │   ├── bubble/
│   │   │   ├── BubbleWidget.tsx
│   │   │   ├── BubbleTrigger.tsx
│   │   │   └── BubblePanel.tsx
│   │   │
│   │   └── admin/
│   │       ├── App.tsx
│   │       ├── InstanceList.tsx
│   │       ├── InstanceEditor.tsx
│   │       └── Preview.tsx
│   │
│   ├── hooks/
│   │   ├── useChat.ts
│   │   └── useBubble.ts
│   │
│   ├── context/
│   │   └── FlowChatContext.tsx
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── styles/
│       ├── chat.css
│       └── admin.css
│
└── assets/
    └── templates/                    # Built-in template JSON files
```

---

## Step-by-Step Build Order

### Step 1: Plugin Bootstrap

Create `flowchat.php`:

```php
<?php
/**
 * Plugin Name: FlowChat
 * Description: AI Chat for WordPress via n8n
 * Version: 1.0.0
 * Requires PHP: 8.0
 * Requires at least: 6.0
 */

if (!defined('ABSPATH')) exit;

define('FLOWCHAT_VERSION', '1.0.0');
define('FLOWCHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FLOWCHAT_PLUGIN_URL', plugin_dir_url(__FILE__));

require_once FLOWCHAT_PLUGIN_DIR . 'includes/autoload.php';

register_activation_hook(__FILE__, ['FlowChat\\Activator', 'activate']);
register_deactivation_hook(__FILE__, ['FlowChat\\Deactivator', 'deactivate']);

add_action('plugins_loaded', function() {
    FlowChat\Plugin::get_instance();
});
```

### Step 2: Autoloader

Create `includes/autoload.php`:

```php
<?php
spl_autoload_register(function($class) {
    $prefix = 'FlowChat\\';
    if (strncmp($prefix, $class, strlen($prefix)) !== 0) return;
    
    $relative = substr($class, strlen($prefix));
    $path = str_replace('\\', '/', $relative);
    $parts = explode('/', $path);
    $filename = array_pop($parts);
    $filename = 'class-' . strtolower(preg_replace('/([a-z])([A-Z])/', '$1-$2', $filename)) . '.php';
    
    $file = FLOWCHAT_PLUGIN_DIR . 'includes/' . strtolower(implode('/', $parts)) . '/' . $filename;
    if (file_exists($file)) require $file;
});
```

### Step 3: Main Plugin Class

Create `includes/class-plugin.php`:

```php
<?php
namespace FlowChat;

class Plugin {
    private static $instance = null;
    
    public static function get_instance(): self {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }
    
    private function load_dependencies(): void {
        // Core
        new Core\Instance_Manager();
        new Core\Session_Manager();
        
        // Frontend
        new Frontend\Frontend();
        new Frontend\Shortcode();
        new Frontend\Assets();
        
        // API
        new API\Public_Endpoints();
        
        // Admin
        if (is_admin()) {
            new Admin\Admin();
            new Admin\Menu();
            new API\Admin_Endpoints();
        }
    }
    
    private function init_hooks(): void {
        add_action('init', [$this, 'load_textdomain']);
    }
    
    public function load_textdomain(): void {
        load_plugin_textdomain('flowchat', false, dirname(plugin_basename(__FILE__)) . '/languages');
    }
}
```

### Step 4: Database Schema

Create `includes/class-activator.php`:

```php
<?php
namespace FlowChat;

class Activator {
    public static function activate(): void {
        self::create_tables();
        self::set_defaults();
        flush_rewrite_rules();
    }
    
    private static function create_tables(): void {
        global $wpdb;
        $charset = $wpdb->get_charset_collate();
        
        $sql = "
        CREATE TABLE {$wpdb->prefix}flowchat_sessions (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL UNIQUE,
            instance_id VARCHAR(64) NOT NULL,
            user_id BIGINT UNSIGNED DEFAULT NULL,
            status ENUM('active','closed') DEFAULT 'active',
            started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_activity_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_instance (instance_id),
            INDEX idx_user (user_id)
        ) $charset;
        
        CREATE TABLE {$wpdb->prefix}flowchat_messages (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT UNSIGNED NOT NULL,
            session_uuid VARCHAR(36) NOT NULL,
            role ENUM('user','assistant','system') NOT NULL,
            content JSON NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            INDEX idx_session_uuid (session_uuid),
            FOREIGN KEY (session_id) REFERENCES {$wpdb->prefix}flowchat_sessions(id) ON DELETE CASCADE
        ) $charset;
        ";
        
        require_once ABSPATH . 'wp-admin/includes/upgrade.php';
        dbDelta($sql);
        
        update_option('flowchat_db_version', '1.0.0');
    }
    
    private static function set_defaults(): void {
        if (!get_option('flowchat_instances')) {
            update_option('flowchat_instances', []);
        }
        if (!get_option('flowchat_global_settings')) {
            update_option('flowchat_global_settings', [
                'enable_history' => true,
                'file_retention_hours' => 24,
            ]);
        }
    }
}
```

### Step 5: Instance Manager

Create `includes/core/class-instance-manager.php`:

```php
<?php
namespace FlowChat\Core;

class Instance_Manager {
    
    public function get_all_instances(): array {
        return get_option('flowchat_instances', []);
    }
    
    public function get_instance(string $id): ?array {
        $instances = $this->get_all_instances();
        return $instances[$id] ?? null;
    }
    
    public function create_instance(array $data): string {
        $id = 'inst_' . wp_generate_uuid4();
        $instance = array_merge($this->get_defaults(), $data, [
            'id' => $id,
            'createdAt' => current_time('c'),
            'updatedAt' => current_time('c'),
        ]);
        
        $instances = $this->get_all_instances();
        $instances[$id] = $instance;
        update_option('flowchat_instances', $instances);
        
        return $id;
    }
    
    public function update_instance(string $id, array $data): bool {
        $instances = $this->get_all_instances();
        if (!isset($instances[$id])) return false;
        
        $instances[$id] = array_merge($instances[$id], $data, [
            'updatedAt' => current_time('c'),
        ]);
        
        return update_option('flowchat_instances', $instances);
    }
    
    public function delete_instance(string $id): bool {
        $instances = $this->get_all_instances();
        if (!isset($instances[$id])) return false;
        
        unset($instances[$id]);
        return update_option('flowchat_instances', $instances);
    }
    
    public function get_defaults(): array {
        return [
            'name' => 'New Chat',
            'webhookUrl' => '',
            'isEnabled' => false,
            'theme' => 'light',
            'primaryColor' => '#3b82f6',
            'welcomeMessage' => 'Hi! 👋 How can I help you today?',
            'placeholderText' => 'Type your message...',
            'chatTitle' => 'Chat',
            'showHeader' => true,
            'showTimestamp' => false,
            'showAvatar' => true,
            'bubble' => [
                'enabled' => false,
                'icon' => 'chat',
                'position' => 'bottom-right',
                'offsetX' => 24,
                'offsetY' => 24,
            ],
            'autoOpen' => [
                'enabled' => false,
                'trigger' => 'delay',
                'delay' => 5000,
            ],
            'access' => [
                'requireLogin' => false,
                'allowedRoles' => [],
            ],
            'features' => [
                'fileUpload' => false,
                'showTypingIndicator' => true,
            ],
        ];
    }
}
```

### Step 6: Public REST API

Create `includes/api/class-public-endpoints.php`:

```php
<?php
namespace FlowChat\API;

use FlowChat\Core\Instance_Manager;
use FlowChat\Core\Session_Manager;
use FlowChat\Core\Context_Builder;

class Public_Endpoints {
    
    public function __construct() {
        add_action('rest_api_init', [$this, 'register_routes']);
    }
    
    public function register_routes(): void {
        register_rest_route('flowchat/v1', '/init', [
            'methods' => 'GET',
            'callback' => [$this, 'init_chat'],
            'permission_callback' => '__return_true',
            'args' => [
                'instance_id' => ['required' => true, 'type' => 'string'],
            ],
        ]);
    }
    
    public function init_chat(\WP_REST_Request $request): \WP_REST_Response {
        $instance_id = $request->get_param('instance_id');
        
        $instance_manager = new Instance_Manager();
        $instance = $instance_manager->get_instance($instance_id);
        
        if (!$instance) {
            return new \WP_REST_Response(['error' => 'Instance not found'], 404);
        }
        
        if (!$instance['isEnabled']) {
            return new \WP_REST_Response(['error' => 'Instance disabled'], 403);
        }
        
        // Check access
        if (!$this->check_access($instance)) {
            return new \WP_REST_Response(['error' => 'Access denied'], 403);
        }
        
        // Create/get session
        $session_manager = new Session_Manager();
        $session_id = $session_manager->get_or_create_session($instance_id);
        
        // Build context
        $context_builder = new Context_Builder();
        $context = $context_builder->build_context($instance);
        
        // Return config (including webhook URL - this is the key!)
        return new \WP_REST_Response([
            'webhookUrl' => $instance['webhookUrl'],
            'sessionId' => $session_id,
            'config' => $this->get_frontend_config($instance),
            'context' => $context,
        ]);
    }
    
    private function check_access(array $instance): bool {
        $access = $instance['access'] ?? [];
        
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return false;
        }
        
        if (!empty($access['allowedRoles'])) {
            $user = wp_get_current_user();
            if (!array_intersect($access['allowedRoles'], $user->roles)) {
                return false;
            }
        }
        
        return true;
    }
    
    private function get_frontend_config(array $instance): array {
        // Only return what frontend needs (not webhookUrl, that's separate)
        return [
            'theme' => $instance['theme'],
            'primaryColor' => $instance['primaryColor'],
            'welcomeMessage' => $instance['welcomeMessage'],
            'placeholderText' => $instance['placeholderText'],
            'chatTitle' => $instance['chatTitle'],
            'showHeader' => $instance['showHeader'],
            'showTimestamp' => $instance['showTimestamp'],
            'showAvatar' => $instance['showAvatar'],
            'bubble' => $instance['bubble'],
            'features' => $instance['features'],
        ];
    }
}
```

### Step 7: Shortcode

Create `includes/frontend/class-shortcode.php`:

```php
<?php
namespace FlowChat\Frontend;

use FlowChat\Core\Instance_Manager;

class Shortcode {
    
    public function __construct() {
        add_shortcode('flowchat', [$this, 'render']);
    }
    
    public function render($atts): string {
        $atts = shortcode_atts([
            'id' => '',
            'mode' => 'inline', // inline, bubble, both
            'width' => '100%',
            'height' => '500px',
        ], $atts);
        
        $instance_id = $atts['id'];
        
        // If no ID, get default instance
        if (empty($instance_id)) {
            $instance_manager = new Instance_Manager();
            $instances = $instance_manager->get_all_instances();
            foreach ($instances as $id => $inst) {
                if (!empty($inst['isDefault']) && $inst['isEnabled']) {
                    $instance_id = $id;
                    break;
                }
            }
        }
        
        if (empty($instance_id)) {
            return '<!-- FlowChat: No instance configured -->';
        }
        
        // Enqueue assets
        wp_enqueue_script('flowchat-frontend');
        wp_enqueue_style('flowchat-frontend');
        
        // Render container
        $container_id = 'flowchat-' . esc_attr($instance_id);
        
        $style = '';
        if ($atts['mode'] === 'inline') {
            $style = sprintf(
                'width:%s;height:%s;',
                esc_attr($atts['width']),
                esc_attr($atts['height'])
            );
        }
        
        // Pass config to JS
        wp_localize_script('flowchat-frontend', 'flowchatInit_' . str_replace('-', '_', $instance_id), [
            'containerId' => $container_id,
            'instanceId' => $instance_id,
            'mode' => $atts['mode'],
            'apiUrl' => rest_url('flowchat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);
        
        return sprintf(
            '<div id="%s" class="flowchat-container flowchat-mode-%s" style="%s"></div>',
            esc_attr($container_id),
            esc_attr($atts['mode']),
            $style
        );
    }
}
```

### Step 8: Frontend Assets

Create `includes/frontend/class-assets.php`:

```php
<?php
namespace FlowChat\Frontend;

class Assets {
    
    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
    }
    
    public function register_assets(): void {
        // React (from WordPress)
        wp_register_script(
            'flowchat-react',
            includes_url('js/dist/vendor/react.min.js'),
            [],
            null,
            true
        );
        
        wp_register_script(
            'flowchat-react-dom',
            includes_url('js/dist/vendor/react-dom.min.js'),
            ['flowchat-react'],
            null,
            true
        );
        
        // Main frontend bundle
        wp_register_script(
            'flowchat-frontend',
            FLOWCHAT_PLUGIN_URL . 'build/frontend/chat.js',
            ['flowchat-react', 'flowchat-react-dom'],
            FLOWCHAT_VERSION,
            true
        );
        
        wp_register_style(
            'flowchat-frontend',
            FLOWCHAT_PLUGIN_URL . 'build/frontend/chat.css',
            [],
            FLOWCHAT_VERSION
        );
    }
}
```

### Step 9: N8nRuntimeAdapter (CRITICAL)

Create `src/runtime/N8nRuntimeAdapter.ts`:

```typescript
import type {
  ChatModelAdapter,
  ChatModelRunOptions,
  ChatModelRunResult,
} from '@assistant-ui/react';

interface N8nConfig {
  webhookUrl: string;
  sessionId: string;
  context: Record<string, unknown>;
}

export class N8nRuntimeAdapter implements ChatModelAdapter {
  private config: N8nConfig;
  private abortController: AbortController | null = null;

  constructor(config: N8nConfig) {
    this.config = config;
  }

  async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    this.abortController = new AbortController();

    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId: this.config.sessionId,
        messages: options.messages.map(m => ({
          role: m.role,
          content: m.content.filter(c => c.type === 'text').map(c => c.text).join(''),
        })),
        context: this.config.context,
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const contentType = response.headers.get('content-type') || '';
    
    if (contentType.includes('text/event-stream')) {
      yield* this.handleSSE(response);
    } else {
      yield* this.handleJSON(response);
    }
  }

  private async *handleSSE(response: Response): AsyncGenerator<ChatModelRunResult> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No body');

    const decoder = new TextDecoder();
    let buffer = '';
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.text) {
            fullText += parsed.text;
            yield { content: [{ type: 'text', text: fullText }] };
          }
        } catch {
          if (data.trim()) {
            fullText += data;
            yield { content: [{ type: 'text', text: fullText }] };
          }
        }
      }
    }
  }

  private async *handleJSON(response: Response): AsyncGenerator<ChatModelRunResult> {
    const data = await response.json();
    const text = data.output || data.text || data.message || JSON.stringify(data);
    yield { content: [{ type: 'text', text }] };
  }

  cancel(): void {
    this.abortController?.abort();
  }
}
```

### Step 10: React Chat Widget

Create `src/components/chat/ChatWidget.tsx`:

```tsx
import React from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
} from '@assistant-ui/react';
import { N8nRuntimeAdapter } from '../../runtime/N8nRuntimeAdapter';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import type { FlowChatConfig } from '../../types';

interface Props {
  webhookUrl: string;
  sessionId: string;
  config: FlowChatConfig;
  context: Record<string, unknown>;
}

export const ChatWidget: React.FC<Props> = ({
  webhookUrl,
  sessionId,
  config,
  context,
}) => {
  const adapter = React.useMemo(
    () => new N8nRuntimeAdapter({ webhookUrl, sessionId, context }),
    [webhookUrl, sessionId, context]
  );

  const runtime = useLocalRuntime(adapter);

  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <div 
        className="flowchat-widget"
        style={{
          '--flowchat-primary': config.primaryColor,
        } as React.CSSProperties}
      >
        {config.showHeader && (
          <ChatHeader title={config.chatTitle} />
        )}
        
        <ChatMessages 
          welcomeMessage={config.welcomeMessage}
          showTimestamp={config.showTimestamp}
          showAvatar={config.showAvatar}
        />
        
        <ChatInput 
          placeholder={config.placeholderText}
        />
      </div>
    </AssistantRuntimeProvider>
  );
};
```

### Step 11: Frontend Entry Point

Create `src/index.ts`:

```typescript
import { createRoot } from 'react-dom/client';
import { ChatWidget } from './components/chat/ChatWidget';
import { BubbleWidget } from './components/bubble/BubbleWidget';
import './styles/chat.css';

interface InitConfig {
  containerId: string;
  instanceId: string;
  mode: 'inline' | 'bubble' | 'both';
  apiUrl: string;
  nonce: string;
}

async function initFlowChat(config: InitConfig) {
  const container = document.getElementById(config.containerId);
  if (!container) return;

  // Fetch instance config from WordPress
  const response = await fetch(
    `${config.apiUrl}/init?instance_id=${config.instanceId}`,
    {
      headers: { 'X-WP-Nonce': config.nonce },
    }
  );

  if (!response.ok) {
    console.error('FlowChat: Failed to initialize');
    return;
  }

  const data = await response.json();
  const root = createRoot(container);

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
}

// Auto-init from WordPress localized data
document.addEventListener('DOMContentLoaded', () => {
  Object.keys(window).forEach(key => {
    if (key.startsWith('flowchatInit_')) {
      initFlowChat((window as any)[key]);
    }
  });
});

// Export for manual init
(window as any).FlowChat = { init: initFlowChat };
```

---

## TypeScript Types

Create `src/types/index.ts`:

```typescript
export interface FlowChatConfig {
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  showHeader: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
  bubble: BubbleConfig;
  features: FeaturesConfig;
}

export interface BubbleConfig {
  enabled: boolean;
  icon: 'chat' | 'message' | 'help' | 'custom';
  customIconUrl?: string;
  text?: string;
  position: 'bottom-right' | 'bottom-left';
  offsetX: number;
  offsetY: number;
}

export interface FeaturesConfig {
  fileUpload: boolean;
  showTypingIndicator: boolean;
}
```

---

## Build Configuration

Create `vite.config.ts`:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'build/frontend',
    lib: {
      entry: 'src/index.ts',
      name: 'FlowChat',
      formats: ['iife'],
      fileName: () => 'chat.js',
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
        assetFileNames: 'chat.[ext]',
      },
    },
  },
});
```

Create `package.json`:

```json
{
  "name": "flowchat",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite --mode development",
    "build": "vite build",
    "build:admin": "wp-scripts build src/admin-index.ts --output-path=build/admin"
  },
  "dependencies": {
    "@assistant-ui/react": "^0.5.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "@wordpress/scripts": "^26.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  }
}
```

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM"],
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "skipLibCheck": true
  },
  "include": ["src"]
}
```

---

## Admin Interface (Phase 2)

After core frontend works, build admin:

1. `src/admin-index.ts` - Admin React app entry
2. `src/components/admin/App.tsx` - Admin app shell
3. `src/components/admin/InstanceList.tsx` - List instances
4. `src/components/admin/InstanceEditor.tsx` - Edit instance
5. `includes/admin/class-menu.php` - Register admin pages
6. `includes/api/class-admin-endpoints.php` - Admin REST API

---

## Testing Checklist

### Manual Testing Flow

1. ✓ Plugin activates without errors
2. ✓ Database tables created
3. ✓ Admin menu appears
4. ✓ Can create instance with webhook URL
5. ✓ Shortcode renders container
6. ✓ React app initializes
7. ✓ REST endpoint returns config + webhook URL
8. ✓ Chat connects to n8n
9. ✓ Messages stream in real-time
10. ✓ Bubble mode works

### n8n Webhook Setup for Testing

Create a simple n8n workflow:
1. **Chat Trigger** node (webhook)
2. **Respond to Webhook** node with:
   ```
   data: {"text": "Hello! "}
   data: {"text": "I received: "}
   data: {"text": "{{$json.messages[0].content}}"}
   data: [DONE]
   ```

---

## Reference Documents

The complete specifications are in the `flowchat-specs/` folder:

- `FINAL-CONSOLIDATED-SPEC.md` - This summary
- `01-architecture.md` - Detailed architecture
- `02-database-schema.md` - Full database design
- `03-admin-ui-spec.md` - Admin interface mockups
- `04-chat-instances-config.md` - Instance configuration
- `05-frontend-components.md` - React components
- `06-n8n-runtime-adapter.md` - Runtime adapter details
- `07-api-endpoints.md` - All REST endpoints
- `08-shortcodes-blocks.md` - WordPress integration
- `09-bubble-system.md` - Floating bubble
- `10-authentication-security.md` - Security details
- `11-error-handling.md` - Error system
- `12-feature-gating.md` - Premium features
- `13-templates-system.md` - Templates
- `14-file-structure.md` - Complete file tree
- `15-build-deployment.md` - Build system
- `16-ADDENDUM-critical-fixes.md` - Final fixes

---

## Start Building!

Begin with:

```bash
# Create the basic plugin structure
# Then run: npm install && npm run build
# Activate plugin in WordPress
# Create an instance with n8n webhook URL
# Add [flowchat id="your_instance_id"] to a page
# Test the chat!
```

Good luck! 🚀
