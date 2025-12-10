# FlowChat Final Specification - Consolidated

**Version:** 1.0 Final  
**Date:** December 2024  
**Status:** Ready for Development

---

## Executive Summary

FlowChat is a WordPress plugin that connects AI-powered chat widgets to n8n automation workflows. It uses the `@assistant-ui/react` library for the frontend and communicates directly with n8n's Chat Trigger nodes.

### Key Architecture Decisions (Final)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Streaming** | Direct browser → n8n | Best UX, no PHP buffering issues |
| **Auth Model** | WordPress gatekeeps, webhook URL is the secret | Simple, no JWT complexity |
| **File Uploads** | Temporary storage with auto-cleanup | NOT Media Library - prevents clutter |
| **Build System** | Vite (frontend) + webpack (admin) | Optimal bundle sizes |
| **React Library** | @assistant-ui/react | Best chat UI library for React |
| **State Management** | React Context + hooks | Simple, no Redux needed |

---

## Part 1: System Architecture

### 1.1 High-Level Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FLOWCHAT ARCHITECTURE                          │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────────────┐ │
│  │   Browser    │────▶│  WordPress   │────▶│  Returns: webhook URL,   │ │
│  │  (Page Load) │     │   REST API   │     │  config, session ID      │ │
│  └──────────────┘     └──────────────┘     └──────────────────────────┘ │
│         │                                                                │
│         │ (one-time auth check)                                         │
│         │                                                                │
│         ▼                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     DIRECT CONNECTION                             │   │
│  │                                                                   │   │
│  │   Browser  ◀═══════════ SSE Stream ═══════════▶  n8n Webhook     │   │
│  │   (React)           (real-time typing)           (Chat Trigger)  │   │
│  │                                                                   │   │
│  │   - All messages go directly to n8n                              │   │
│  │   - WordPress NOT involved in message flow                       │   │
│  │   - Perfect streaming, no buffering                              │   │
│  │                                                                   │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────┐     ┌──────────────┐                                  │
│  │  WordPress   │────▶│   Database   │  (Optional: save chat history)  │
│  │  Background  │     │              │                                  │
│  └──────────────┘     └──────────────┘                                  │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Request Flow: Page Load

```
1. User visits page with [flowchat] shortcode or Gutenberg block
2. WordPress checks:
   - Is instance enabled?
   - Does user meet access requirements (login, role)?
   - Are page restrictions satisfied?
3. If allowed, WordPress renders container + passes config to React:
   {
     instanceId: "abc123",
     webhookUrl: "https://n8n.example.com/webhook/xxx",  // THE KEY!
     sessionId: "sess_xxx",
     config: { welcomeMessage, theme, colors, ... },
     context: { userId, userName, pageUrl, pageTitle, ... }
   }
4. React app initializes with this config
```

### 1.3 Request Flow: Chat Message

```
1. User types message, clicks send
2. React sends directly to n8n:
   POST https://n8n.example.com/webhook/xxx
   {
     action: "sendMessage",
     sessionId: "sess_xxx",
     message: "Hello!",
     context: { userId, pageUrl, ... }
   }
3. n8n processes (AI agent, tools, etc.)
4. n8n streams response back via SSE
5. React displays typing effect in real-time
6. (Optional) React sends history to WordPress for persistence
```

### 1.4 Security Model

```
┌─────────────────────────────────────────────────────────────────┐
│                      SECURITY LAYERS                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Layer 1: WordPress Access Control                              │
│  ├── Instance enabled check                                      │
│  ├── Login requirement (if configured)                          │
│  ├── Role-based access (if configured)                          │
│  └── Page restrictions (if configured)                          │
│                                                                  │
│  Layer 2: Webhook URL as Secret                                 │
│  ├── URL is never exposed in HTML source                        │
│  ├── Only delivered via authenticated REST endpoint             │
│  └── Each instance has unique webhook URL                       │
│                                                                  │
│  Layer 3: Session Isolation                                     │
│  ├── Each chat gets unique session ID                           │
│  ├── Sessions tied to browser (sessionStorage)                  │
│  └── Cannot access other users' sessions                        │
│                                                                  │
│  Layer 4: WordPress Admin Security                              │
│  ├── Nonce verification for all admin actions                   │
│  ├── Capability checks (manage_options)                         │
│  └── Input sanitization / output escaping                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Database Schema

### 2.1 WordPress Options (wp_options)

```php
// Global settings
'flowchat_version' => '1.0.0',
'flowchat_global_settings' => [
    'default_instance' => 'instance_id',
    'enable_history' => true,
    'history_retention_days' => 90,
    'file_retention_hours' => 24,
    'enable_analytics' => false,
    'custom_css' => '',
],
'flowchat_license_key' => 'xxx',
'flowchat_license_status' => ['valid' => true, 'tier' => 'premium', 'expires' => '...'],

// Instances stored as serialized array
'flowchat_instances' => [
    'instance_abc123' => [
        'id' => 'instance_abc123',
        'name' => 'Sales Bot',
        'webhook_url' => 'https://n8n.example.com/webhook/xxx',
        'is_enabled' => true,
        'is_default' => false,
        // ... full config
    ],
    // ... more instances
],

// Custom templates
'flowchat_custom_templates' => [...],

// Error message overrides
'flowchat_error_messages' => [...],
```

### 2.2 Custom Tables

```sql
-- Chat Sessions
CREATE TABLE {prefix}flowchat_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    uuid VARCHAR(36) NOT NULL UNIQUE,
    instance_id VARCHAR(64) NOT NULL,
    user_id BIGINT UNSIGNED DEFAULT NULL,
    visitor_id VARCHAR(64) DEFAULT NULL,
    status ENUM('active', 'closed', 'archived') DEFAULT 'active',
    metadata JSON DEFAULT NULL,
    started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at DATETIME DEFAULT NULL,
    
    INDEX idx_instance (instance_id),
    INDEX idx_user (user_id),
    INDEX idx_status (status),
    INDEX idx_last_activity (last_activity_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Chat Messages
CREATE TABLE {prefix}flowchat_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    session_id BIGINT UNSIGNED NOT NULL,
    session_uuid VARCHAR(36) NOT NULL,
    role ENUM('user', 'assistant', 'system') NOT NULL,
    content JSON NOT NULL,
    metadata JSON DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_session_id (session_id),
    INDEX idx_session_uuid (session_uuid),
    INDEX idx_created (created_at),
    
    FOREIGN KEY (session_id) REFERENCES {prefix}flowchat_sessions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Fallback Messages (when n8n is down)
CREATE TABLE {prefix}flowchat_fallback_messages (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    instance_id VARCHAR(64) NOT NULL,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status ENUM('pending', 'replied', 'spam') DEFAULT 'pending',
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    replied_at DATETIME DEFAULT NULL,
    
    INDEX idx_instance (instance_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

### 2.3 Message Content Structure (JSON)

```typescript
// content column structure
interface MessageContent {
  parts: Array<{
    type: 'text';
    text: string;
  } | {
    type: 'image' | 'file';
    url: string;
    filename: string;
    mime_type: string;
  }>;
  
  // For assistant messages with tool calls
  tool_calls?: Array<{
    id: string;
    name: string;
    arguments: Record<string, unknown>;
  }>;
  
  // For tool results
  tool_results?: Array<{
    tool_call_id: string;
    output: unknown;
  }>;
}
```

---

## Part 3: Instance Configuration

### 3.1 Full Instance Schema

```typescript
interface ChatInstance {
  // Identity
  id: string;                    // Auto-generated UUID
  name: string;                  // Admin display name
  
  // Connection
  webhookUrl: string;            // n8n webhook URL (REQUIRED)
  isEnabled: boolean;
  isDefault: boolean;            // Default for URL routing
  
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  colorSource: 'custom' | 'theme' | 'preset';
  primaryColor: string;          // Hex color when colorSource='custom'
  stylePreset: string;           // Preset ID when colorSource='preset'
  customCss: string;             // Additional CSS
  
  // Content
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  systemPrompt: string;          // With dynamic tags support
  suggestedPrompts: string[];
  
  // UI Options
  showHeader: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
  avatarUrl: string;
  
  // Bubble Mode
  bubble: {
    enabled: boolean;
    icon: 'chat' | 'message' | 'help' | 'custom';
    customIconUrl?: string;
    text?: string;               // Text next to bubble
    position: 'bottom-right' | 'bottom-left';
    offsetX: number;
    offsetY: number;
    size: 'small' | 'medium' | 'large';
    showUnreadBadge: boolean;
    pulseAnimation: boolean;
  };
  
  // Auto-Open
  autoOpen: {
    enabled: boolean;
    trigger: 'delay' | 'scroll' | 'exit-intent' | 'idle';
    delay?: number;              // ms for delay trigger
    scrollPercentage?: number;   // % for scroll trigger
    idleTime?: number;           // ms for idle trigger
    conditions: {
      oncePerSession: boolean;
      oncePerDay: boolean;
      skipIfInteracted: boolean;
      loggedInOnly: boolean;
      guestOnly: boolean;
      excludeMobile: boolean;
    };
  };
  
  // URL-Based Targeting (for auto-loading without shortcode)
  targeting: {
    enabled: boolean;
    priority: number;            // Higher = checked first
    rules: Array<{
      id: string;
      type: 'url_pattern' | 'post_type' | 'page_id' | 'category' | 'user_role';
      condition?: 'equals' | 'starts_with' | 'ends_with' | 'contains' | 'wildcard';
      value: string | string[];
    }>;
  };
  
  // Access Control
  access: {
    requireLogin: boolean;
    allowedRoles: string[];      // Empty = all roles
    deniedMessage: string;
  };
  
  // Features
  features: {
    fileUpload: boolean;
    fileTypes: string[];         // MIME types
    maxFileSize: number;         // bytes
    showTypingIndicator: boolean;
    enableHistory: boolean;
    enableFeedback: boolean;     // Thumbs up/down
  };
  
  // Fallback (when n8n is down)
  fallback: {
    enabled: boolean;
    email: string;               // Where to send fallback messages
    message: string;             // Shown to user
  };
  
  // Metadata
  createdAt: string;
  updatedAt: string;
}
```

### 3.2 Default Instance Configuration

```typescript
const defaultInstance: Partial<ChatInstance> = {
  isEnabled: true,
  isDefault: false,
  theme: 'light',
  colorSource: 'custom',
  primaryColor: '#3b82f6',
  welcomeMessage: 'Hi! 👋 How can I help you today?',
  placeholderText: 'Type your message...',
  chatTitle: 'Chat',
  systemPrompt: '',
  suggestedPrompts: [],
  showHeader: true,
  showTimestamp: false,
  showAvatar: true,
  bubble: {
    enabled: false,
    icon: 'chat',
    position: 'bottom-right',
    offsetX: 24,
    offsetY: 24,
    size: 'medium',
    showUnreadBadge: true,
    pulseAnimation: true,
  },
  autoOpen: {
    enabled: false,
    trigger: 'delay',
    delay: 5000,
    conditions: {
      oncePerSession: true,
      oncePerDay: false,
      skipIfInteracted: true,
      loggedInOnly: false,
      guestOnly: false,
      excludeMobile: false,
    },
  },
  targeting: {
    enabled: false,
    priority: 0,
    rules: [],
  },
  access: {
    requireLogin: false,
    allowedRoles: [],
    deniedMessage: 'Please log in to use this chat.',
  },
  features: {
    fileUpload: false,
    fileTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    maxFileSize: 10485760, // 10MB
    showTypingIndicator: true,
    enableHistory: true,
    enableFeedback: false,
  },
  fallback: {
    enabled: true,
    email: '', // Defaults to admin email
    message: 'Our chat is temporarily unavailable. Please leave a message.',
  },
};
```

---

## Part 4: File Upload System

### 4.1 Architecture (NOT Media Library)

```
wp-content/
└── uploads/
    └── flowchat/                    # Isolated from Media Library
        └── temp/
            └── 2024-12-10/          # Date-based folders
                ├── a1b2c3d4.jpg     # Random names
                ├── e5f6g7h8.pdf
                └── ...
```

### 4.2 Upload Flow

```typescript
// Frontend: ChatInput with file upload
1. User selects file
2. Validate: type, size
3. POST /wp-json/flowchat/v1/upload
   - multipart/form-data
   - file + instance_id
4. WordPress:
   - Validates file again
   - Generates random filename
   - Saves to flowchat/temp/{date}/
   - Returns temporary URL (valid 24h)
5. Frontend sends message with attachment URL to n8n
6. n8n receives URL, can fetch if needed
```

### 4.3 PHP Upload Handler

```php
class File_Upload_Handler {
    
    private const UPLOAD_DIR = 'flowchat/temp';
    private const DEFAULT_RETENTION_HOURS = 24;
    
    public function handle_upload(WP_REST_Request $request): WP_REST_Response {
        $file = $request->get_file_params()['file'] ?? null;
        $instance_id = $request->get_param('instance_id');
        
        // Validate instance and permissions
        $instance = $this->get_instance($instance_id);
        if (!$instance || !$instance['features']['fileUpload']) {
            return new WP_REST_Response(['error' => 'Upload not allowed'], 403);
        }
        
        // Validate file
        $validation = $this->validate_file($file, $instance);
        if (is_wp_error($validation)) {
            return new WP_REST_Response(['error' => $validation->get_error_message()], 400);
        }
        
        // Generate safe filename
        $ext = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = bin2hex(random_bytes(16)) . '.' . $ext;
        $date_folder = date('Y-m-d');
        
        // Ensure directory exists
        $upload_dir = wp_upload_dir();
        $target_dir = $upload_dir['basedir'] . '/' . self::UPLOAD_DIR . '/' . $date_folder;
        wp_mkdir_p($target_dir);
        
        // Add .htaccess protection
        $this->protect_directory($upload_dir['basedir'] . '/' . self::UPLOAD_DIR);
        
        // Move file
        $target_path = $target_dir . '/' . $filename;
        if (!move_uploaded_file($file['tmp_name'], $target_path)) {
            return new WP_REST_Response(['error' => 'Upload failed'], 500);
        }
        
        // Generate URL
        $url = $upload_dir['baseurl'] . '/' . self::UPLOAD_DIR . '/' . $date_folder . '/' . $filename;
        
        return new WP_REST_Response([
            'url' => $url,
            'filename' => $file['name'],
            'mime_type' => $file['type'],
            'size' => $file['size'],
            'expires_at' => date('c', time() + (self::DEFAULT_RETENTION_HOURS * 3600)),
        ]);
    }
    
    // Cron job: cleanup old files
    public function cleanup_old_files(): void {
        $retention_hours = get_option('flowchat_global_settings')['file_retention_hours'] ?? 24;
        $upload_dir = wp_upload_dir();
        $temp_dir = $upload_dir['basedir'] . '/' . self::UPLOAD_DIR;
        
        $cutoff = time() - ($retention_hours * 3600);
        
        foreach (glob($temp_dir . '/*', GLOB_ONLYDIR) as $date_dir) {
            $dir_time = strtotime(basename($date_dir));
            if ($dir_time && $dir_time < $cutoff) {
                $this->delete_directory($date_dir);
            }
        }
    }
}
```

---

## Part 5: System Prompt Builder

### 5.1 Dynamic Tags

```php
// Available tags for system prompts

// Site Information
{site_name}           // WordPress site name
{site_url}            // Home URL
{site_description}    // Site tagline

// Current Page
{current_page_url}    // Full URL of current page
{current_page_title}  // Page/post title
{current_page_content} // First 2000 chars of content (stripped)
{current_page_excerpt} // Excerpt or auto-generated
{current_page_type}   // post, page, product, etc.

// User Information
{user_name}           // Display name or "Guest"
{user_email}          // Email (empty if guest)
{user_role}           // Role or "guest"
{user_logged_in}      // "yes" or "no"

// Date/Time
{current_date}        // "December 10, 2024"
{current_time}        // "3:45 pm"
{current_day}         // "Tuesday"

// WooCommerce (if active)
{woo_cart_total}      // Cart total with currency
{woo_cart_count}      // Number of items
{woo_cart_items}      // "Product A x2, Product B x1"
{woo_currency}        // Currency symbol
```

### 5.2 Example System Prompt

```
You are a helpful assistant for {site_name}.

CONTEXT:
- Current page: {current_page_title} ({current_page_url})
- User: {user_name} ({user_role})
- Time: {current_day}, {current_time}

{user_logged_in === "yes" ? "The user is logged in." : "The user is a guest."}

PAGE CONTENT (for reference):
{current_page_excerpt}

INSTRUCTIONS:
- Be helpful and friendly
- If asked about products, refer to the current page content
- For complex issues, offer to connect with human support
- Never make up information about products or policies
```

---

## Part 6: Frontend Components

### 6.1 Component Tree

```
<FlowChatProvider>                    // Context provider
├── <ChatWidget>                      // Main widget (inline mode)
│   ├── <ChatHeader />               // Title, minimize, close
│   ├── <ChatMessages>               // Message list
│   │   ├── <WelcomeMessage />      // Initial welcome
│   │   ├── <ChatMessage />         // Individual messages
│   │   │   ├── <MessageContent />  // Text, markdown
│   │   │   ├── <MessageAttachment /> // Files, images
│   │   │   └── <ToolCallDisplay /> // Tool call results
│   │   ├── <TypingIndicator />     // "..." animation
│   │   └── <SuggestedPrompts />    // Quick reply buttons
│   └── <ChatInput>                  // Input area
│       ├── <AttachmentButton />    // File upload
│       ├── <TextInput />           // Message input
│       └── <SendButton />          // Send
│
└── <BubbleWidget>                   // Floating bubble mode
    ├── <BubbleTrigger>             // Collapsed state
    │   ├── <BubbleIcon />
    │   └── <UnreadBadge />
    └── <BubblePanel>               // Expanded state
        └── <ChatWidget />          // Same as above
```

### 6.2 n8n Runtime Adapter

```typescript
// src/runtime/N8nRuntimeAdapter.ts

import { 
  ChatModelAdapter, 
  ChatModelRunOptions, 
  ChatModelRunResult 
} from '@assistant-ui/react';

interface N8nAdapterConfig {
  webhookUrl: string;
  sessionId: string;
  context: Record<string, unknown>;
  onError?: (error: Error) => void;
}

export class N8nRuntimeAdapter implements ChatModelAdapter {
  private config: N8nAdapterConfig;
  private abortController: AbortController | null = null;
  
  constructor(config: N8nAdapterConfig) {
    this.config = config;
  }
  
  async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    this.abortController = new AbortController();
    
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
        },
        body: JSON.stringify({
          action: 'sendMessage',
          sessionId: this.config.sessionId,
          messages: this.formatMessages(options.messages),
          context: this.config.context,
        }),
        signal: this.abortController.signal,
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      // Handle streaming response
      yield* this.handleStreamingResponse(response);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        return;
      }
      this.config.onError?.(error);
      throw error;
    }
  }
  
  private async *handleStreamingResponse(
    response: Response
  ): AsyncGenerator<ChatModelRunResult> {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');
    
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
          
          // Handle text chunks
          if (parsed.text) {
            fullText += parsed.text;
            yield {
              content: [{ type: 'text', text: fullText }],
            };
          }
          
          // Handle tool calls
          if (parsed.tool_calls) {
            yield {
              content: [{ type: 'text', text: fullText }],
              toolCalls: parsed.tool_calls,
            };
          }
          
        } catch (e) {
          // Non-JSON data, might be plain text
          if (data.trim()) {
            fullText += data;
            yield {
              content: [{ type: 'text', text: fullText }],
            };
          }
        }
      }
    }
  }
  
  cancel(): void {
    this.abortController?.abort();
  }
  
  private formatMessages(messages: readonly ThreadMessage[]): FormattedMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
        .filter(c => c.type === 'text')
        .map(c => c.text)
        .join(''),
    }));
  }
}
```

---

## Part 7: Admin Interface

### 7.1 Menu Structure

```
FlowChat (top-level menu)
├── Dashboard           // Overview, quick stats
├── Chat Instances      // List, create, edit instances  
├── Templates           // Browse, apply templates
├── Settings            // Global settings
└── Tools               // Import/Export, System info
```

### 7.2 Instance Editor Sections

```
Instance Editor Page
├── Header
│   ├── Instance Name (editable)
│   ├── Status Toggle (enabled/disabled)
│   └── Save / Delete buttons
│
├── Connection
│   ├── Webhook URL input
│   ├── Test Connection button
│   └── Connection status indicator
│
├── Appearance
│   ├── Theme selector (light/dark/auto)
│   ├── Color source (custom/theme/preset)
│   ├── Primary color picker (if custom)
│   ├── Style preset selector (if preset)
│   └── Custom CSS textarea
│
├── Content
│   ├── Welcome message
│   ├── Placeholder text
│   ├── Chat title
│   ├── System prompt builder (with tag buttons)
│   └── Suggested prompts editor
│
├── Bubble Settings
│   ├── Enable bubble toggle
│   ├── Icon selector
│   ├── Position selector
│   ├── Size selector
│   └── Animation toggles
│
├── Auto-Open
│   ├── Enable toggle
│   ├── Trigger type selector
│   ├── Trigger value input
│   └── Condition checkboxes
│
├── Targeting (URL-based routing)
│   ├── Enable toggle
│   ├── Priority number
│   └── Rules editor (add/remove rules)
│
├── Access Control
│   ├── Require login toggle
│   ├── Allowed roles multiselect
│   └── Denied message input
│
├── Features
│   ├── File upload toggle + settings
│   ├── History toggle
│   └── Feedback toggle
│
├── Fallback
│   ├── Enable toggle
│   ├── Email input
│   └── Message textarea
│
└── Preview Panel (right side)
    └── Live preview in Shadow DOM
```

### 7.3 Live Preview Isolation

```tsx
// Shadow DOM wrapper to prevent CSS bleed

const IsolatedPreview: React.FC<{ config: InstanceConfig }> = ({ config }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create shadow DOM
    const shadow = containerRef.current.attachShadow({ mode: 'open' });
    
    // Inject styles
    const style = document.createElement('style');
    style.textContent = generateStyles(config);
    shadow.appendChild(style);
    
    // Inject external stylesheet
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${flowchatAdmin.pluginUrl}build/frontend/chat.css`;
    shadow.appendChild(link);
    
    // Create mount point
    const mount = document.createElement('div');
    shadow.appendChild(mount);
    
    setShadowRoot(shadow);
  }, []);
  
  return (
    <div ref={containerRef} className="flowchat-preview-container">
      {shadowRoot && createPortal(
        <ChatWidget config={config} isPreview />,
        shadowRoot.querySelector('div')!
      )}
    </div>
  );
};
```

---

## Part 8: REST API Endpoints

### 8.1 Public Endpoints (Frontend)

```
GET  /wp-json/flowchat/v1/init
     Query: instance_id
     Returns: { webhookUrl, sessionId, config, context }
     Auth: Instance access check

POST /wp-json/flowchat/v1/upload
     Body: multipart/form-data (file, instance_id)
     Returns: { url, filename, mime_type, size, expires_at }
     Auth: Instance access check + upload enabled

POST /wp-json/flowchat/v1/history
     Body: { session_id, messages }
     Returns: { success: true }
     Auth: Instance access check + history enabled

POST /wp-json/flowchat/v1/fallback
     Body: { instance_id, name, email, message }
     Returns: { success: true }
     Auth: Public (but rate limited)
```

### 8.2 Admin Endpoints

```
GET    /wp-json/flowchat/v1/admin/instances
POST   /wp-json/flowchat/v1/admin/instances
GET    /wp-json/flowchat/v1/admin/instances/{id}
PUT    /wp-json/flowchat/v1/admin/instances/{id}
DELETE /wp-json/flowchat/v1/admin/instances/{id}

POST   /wp-json/flowchat/v1/admin/instances/{id}/test
       Tests webhook connection

GET    /wp-json/flowchat/v1/admin/templates
GET    /wp-json/flowchat/v1/admin/templates/{id}
POST   /wp-json/flowchat/v1/admin/templates/{id}/apply
       Apply template to instance

GET    /wp-json/flowchat/v1/admin/settings
PUT    /wp-json/flowchat/v1/admin/settings

POST   /wp-json/flowchat/v1/admin/export
       Export instances/templates
POST   /wp-json/flowchat/v1/admin/import
       Import instances/templates

GET    /wp-json/flowchat/v1/admin/context-tags
       Returns available system prompt tags

POST   /wp-json/flowchat/v1/admin/preview-prompt
       Preview resolved system prompt

All admin endpoints require: manage_options capability + valid nonce
```

---

## Part 9: WordPress Integration

### 9.1 Shortcode

```php
// Basic usage
[flowchat]                              // Default instance
[flowchat id="instance_abc123"]         // Specific instance

// With overrides
[flowchat 
  id="instance_abc123"
  mode="bubble"                          // inline, bubble, both
  width="400px"
  height="600px"
  theme="dark"
  welcome="Custom welcome message"
  placeholder="Ask me anything..."
  require-login="true"
]
```

### 9.2 Gutenberg Block

```json
// block.json
{
  "name": "flowchat/chat",
  "title": "FlowChat",
  "category": "widgets",
  "attributes": {
    "instanceId": { "type": "string" },
    "mode": { "type": "string", "default": "inline" },
    "width": { "type": "string" },
    "height": { "type": "string" },
    // ... matches shortcode attributes
  },
  "supports": {
    "align": ["wide", "full"],
    "spacing": { "margin": true, "padding": true }
  }
}
```

### 9.3 Widget

```php
class FlowChat_Widget extends WP_Widget {
    
    public function widget($args, $instance) {
        echo $args['before_widget'];
        
        if (!empty($instance['title'])) {
            echo $args['before_title'] . $instance['title'] . $args['after_title'];
        }
        
        echo do_shortcode(sprintf(
            '[flowchat id="%s" height="%s"]',
            esc_attr($instance['instance_id']),
            esc_attr($instance['height'] ?? '400px')
        ));
        
        echo $args['after_widget'];
    }
    
    public function form($instance) {
        // Instance selector dropdown
        // Height input
        // Title input
    }
}
```

### 9.4 Template Functions

```php
// For theme developers

// Render chat
flowchat_render($instance_id = null, $args = []);

// Check if available
if (flowchat_is_available('instance_abc123')) {
    flowchat_render('instance_abc123');
}

// Get instances for custom display
$instances = flowchat_get_instances();
```

---

## Part 10: File Structure

```
flowchat/
├── flowchat.php                     # Main plugin file
├── uninstall.php                    # Cleanup on uninstall
├── readme.txt                       # WordPress.org readme
│
├── includes/
│   ├── class-plugin.php             # Main plugin class
│   ├── class-activator.php          # Activation hooks
│   ├── class-deactivator.php        # Deactivation hooks
│   │
│   ├── admin/
│   │   ├── class-admin.php          # Admin initialization
│   │   ├── class-menu.php           # Menu registration
│   │   └── class-settings.php       # Settings registration
│   │
│   ├── api/
│   │   ├── class-rest-controller.php
│   │   ├── class-public-endpoints.php
│   │   └── class-admin-endpoints.php
│   │
│   ├── core/
│   │   ├── class-instance-manager.php
│   │   ├── class-session-manager.php
│   │   ├── class-context-builder.php  # System prompt tags
│   │   ├── class-instance-router.php  # URL-based routing
│   │   └── class-file-handler.php     # Upload handling
│   │
│   ├── frontend/
│   │   ├── class-frontend.php
│   │   ├── class-shortcode.php
│   │   ├── class-widget.php
│   │   └── class-assets.php
│   │
│   └── database/
│       ├── class-schema.php
│       └── class-tables.php
│
├── src/                              # TypeScript/React source
│   ├── index.ts                      # Frontend entry
│   ├── admin-index.ts                # Admin entry
│   │
│   ├── components/
│   │   ├── chat/
│   │   ├── bubble/
│   │   ├── ui/
│   │   └── admin/
│   │
│   ├── runtime/
│   │   └── N8nRuntimeAdapter.ts
│   │
│   ├── hooks/
│   ├── context/
│   ├── services/
│   ├── utils/
│   ├── types/
│   └── styles/
│
├── build/                            # Compiled assets (generated)
│   ├── frontend/
│   │   ├── chat.js
│   │   └── chat.css
│   └── admin/
│       ├── admin.js
│       └── admin.css
│
├── assets/
│   ├── images/
│   ├── icons/
│   └── templates/                    # Built-in templates JSON
│
├── languages/                        # Translations
│
├── templates/                        # PHP templates
│   └── admin/
│
└── tests/
    ├── php/
    └── js/
```

---

## Part 11: Build Configuration

### 11.1 Package.json Scripts

```json
{
  "scripts": {
    "dev": "concurrently \"npm:dev:*\"",
    "dev:frontend": "vite --mode development",
    "dev:admin": "wp-scripts start src/admin-index.ts --output-path=build/admin",
    
    "build": "npm run build:frontend && npm run build:admin",
    "build:frontend": "vite build",
    "build:admin": "wp-scripts build src/admin-index.ts --output-path=build/admin",
    
    "lint": "eslint src/",
    "test": "vitest",
    "plugin-zip": "wp-scripts plugin-zip"
  }
}
```

### 11.2 Vite Config (Frontend)

```typescript
// vite.config.ts
export default defineConfig({
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
      },
    },
  },
});
```

---

## Part 12: Checklist for Development

### Phase 1: Core Infrastructure
- [ ] Plugin bootstrap (activation, deactivation, autoload)
- [ ] Database schema creation
- [ ] Instance manager (CRUD operations)
- [ ] Basic admin menu structure
- [ ] Asset enqueuing

### Phase 2: Frontend Chat
- [ ] N8nRuntimeAdapter
- [ ] ChatWidget component
- [ ] ChatMessages, ChatInput
- [ ] Typing indicator
- [ ] Basic styling

### Phase 3: WordPress Integration
- [ ] Shortcode handler
- [ ] Public REST endpoint (/init)
- [ ] Context builder (user, page data)
- [ ] Session management

### Phase 4: Admin UI
- [ ] Instance list page
- [ ] Instance editor
- [ ] Settings page
- [ ] Live preview (Shadow DOM)
- [ ] Webhook tester

### Phase 5: Bubble Mode
- [ ] BubbleRoot, BubbleTrigger, BubblePanel
- [ ] State persistence
- [ ] Auto-open system
- [ ] Animations

### Phase 6: Advanced Features
- [ ] URL-based routing
- [ ] System prompt builder
- [ ] File uploads
- [ ] Chat history persistence
- [ ] Fallback contact form

### Phase 7: Templates & Polish
- [ ] Built-in templates
- [ ] Style presets
- [ ] Import/Export
- [ ] Gutenberg block
- [ ] Widget

### Phase 8: Testing & Release
- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Documentation
- [ ] Plugin zip creation
