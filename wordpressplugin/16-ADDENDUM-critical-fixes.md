# FlowChat Specification Addendum: Critical Fixes & Enhancements

## Overview

This addendum addresses critical technical issues and missing features identified during specification review. These changes are **mandatory** for a production-ready, best-in-class plugin.

---

## 1. CRITICAL: Streaming Implementation Fix

### The Problem

Standard PHP setups (Apache/Nginx + PHP-FPM) buffer output by default. This means:
- Users see a spinner for 10-30 seconds
- Then the entire response appears at once
- The "typing" effect is completely lost

### Solution A: PHP Proxy with Explicit Buffer Disabling

```php
<?php
// includes/api/class-stream-proxy.php

namespace FlowChat\API;

class Stream_Proxy {
    
    /**
     * Handle streaming proxy request
     * CRITICAL: Must disable ALL output buffering
     */
    public function handle_stream_request(\WP_REST_Request $request): void {
        // Verify nonce and permissions first
        if (!$this->verify_request($request)) {
            wp_send_json_error(['message' => 'Unauthorized'], 401);
            return;
        }
        
        // === CRITICAL: Disable ALL buffering ===
        
        // Disable Apache mod_deflate/mod_gzip
        if (function_exists('apache_setenv')) {
            apache_setenv('no-gzip', '1');
        }
        
        // Disable PHP output buffering
        @ini_set('output_buffering', 'Off');
        @ini_set('zlib.output_compression', 'Off');
        
        // Clear any existing buffers
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        
        // Disable implicit flush
        @ini_set('implicit_flush', '1');
        ob_implicit_flush(true);
        
        // Set streaming headers
        header('Content-Type: text/event-stream');
        header('Cache-Control: no-cache, no-store, must-revalidate');
        header('Connection: keep-alive');
        header('X-Accel-Buffering: no'); // Nginx proxy buffering
        header('Content-Encoding: none'); // Prevent gzip
        
        // Disable PHP time limit for long streams
        set_time_limit(0);
        
        // Now proxy to n8n
        $this->proxy_to_n8n($request);
    }
    
    /**
     * Proxy stream from n8n using curl with streaming callback
     */
    private function proxy_to_n8n(\WP_REST_Request $request): void {
        $instance_id = $request->get_param('instance_id');
        $instance = $this->get_instance($instance_id);
        
        if (!$instance || empty($instance['webhook_url'])) {
            echo "data: " . json_encode(['error' => 'Invalid configuration']) . "\n\n";
            flush();
            return;
        }
        
        $webhook_url = $instance['webhook_url'];
        $payload = $this->build_payload($request, $instance);
        
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $webhook_url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => json_encode($payload),
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: text/event-stream',
            ],
            CURLOPT_RETURNTRANSFER => false,
            CURLOPT_TIMEOUT => 300, // 5 minute timeout
            CURLOPT_CONNECTTIMEOUT => 10,
            
            // === CRITICAL: Stream each chunk immediately ===
            CURLOPT_WRITEFUNCTION => function($ch, $data) {
                echo $data;
                
                // Force immediate output
                if (ob_get_level() > 0) {
                    ob_flush();
                }
                flush();
                
                // Check if client disconnected
                if (connection_aborted()) {
                    return 0; // Stop curl
                }
                
                return strlen($data);
            },
        ]);
        
        $result = curl_exec($ch);
        
        if (curl_errno($ch)) {
            $error = curl_error($ch);
            echo "data: " . json_encode(['error' => $error]) . "\n\n";
            flush();
        }
        
        curl_close($ch);
    }
}
```

### Solution B: Direct-to-n8n Mode (Recommended for Best Performance)

For the ultimate streaming experience, bypass PHP entirely for the stream:

```
┌─────────────────────────────────────────────────────────────────┐
│                        HYBRID ARCHITECTURE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. Auth Request (WordPress)                                     │
│     Browser → WordPress REST API → Returns signed JWT token      │
│                                                                  │
│  2. Stream Request (Direct to n8n)                              │
│     Browser → n8n Webhook (with JWT) → SSE Stream               │
│                                                                  │
│  Benefits:                                                       │
│  - No PHP buffering issues                                       │
│  - Lower latency                                                 │
│  - Reduced server load                                          │
│  - True real-time streaming                                      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### JWT Token Generation (WordPress)

```php
<?php
// includes/security/class-jwt-manager.php

namespace FlowChat\Security;

class JWT_Manager {
    
    private const ALGORITHM = 'HS256';
    private const TOKEN_EXPIRY = 300; // 5 minutes
    
    /**
     * Generate a signed JWT for direct n8n communication
     */
    public function generate_chat_token(string $instance_id, array $context = []): string {
        $secret = $this->get_signing_secret();
        
        $header = [
            'typ' => 'JWT',
            'alg' => self::ALGORITHM,
        ];
        
        $payload = [
            'iss' => home_url(),
            'iat' => time(),
            'exp' => time() + self::TOKEN_EXPIRY,
            'instance_id' => $instance_id,
            'session_id' => $context['session_id'] ?? wp_generate_uuid4(),
            'user_id' => get_current_user_id(),
            'user_role' => $this->get_user_role(),
            'nonce' => wp_create_nonce('flowchat_chat'),
            
            // Context data for n8n
            'context' => [
                'site_url' => home_url(),
                'page_url' => $context['page_url'] ?? '',
                'page_title' => $context['page_title'] ?? '',
                'user_display_name' => wp_get_current_user()->display_name ?? 'Guest',
            ],
        ];
        
        $header_encoded = $this->base64url_encode(json_encode($header));
        $payload_encoded = $this->base64url_encode(json_encode($payload));
        
        $signature = hash_hmac(
            'sha256',
            "$header_encoded.$payload_encoded",
            $secret,
            true
        );
        $signature_encoded = $this->base64url_encode($signature);
        
        return "$header_encoded.$payload_encoded.$signature_encoded";
    }
    
    /**
     * Get or generate signing secret
     */
    private function get_signing_secret(): string {
        $secret = get_option('flowchat_jwt_secret');
        
        if (!$secret) {
            $secret = wp_generate_password(64, true, true);
            update_option('flowchat_jwt_secret', $secret, false);
        }
        
        return $secret;
    }
    
    /**
     * Base64 URL-safe encoding
     */
    private function base64url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private function get_user_role(): string {
        $user = wp_get_current_user();
        return !empty($user->roles) ? $user->roles[0] : 'guest';
    }
}
```

#### REST Endpoint for Token

```php
<?php
// includes/api/class-auth-endpoints.php

register_rest_route('flowchat/v1', '/chat/token', [
    'methods' => 'POST',
    'callback' => function(\WP_REST_Request $request) {
        $instance_id = $request->get_param('instance_id');
        
        // Verify instance exists and user has access
        $instance_manager = new \FlowChat\Instance_Manager();
        $instance = $instance_manager->get_instance($instance_id);
        
        if (!$instance) {
            return new \WP_Error('invalid_instance', 'Instance not found', ['status' => 404]);
        }
        
        // Check access permissions
        $access = new \FlowChat\Security\Instance_Access();
        if (!$access->can_access($instance)) {
            return new \WP_Error('access_denied', 'Access denied', ['status' => 403]);
        }
        
        // Generate JWT
        $jwt_manager = new \FlowChat\Security\JWT_Manager();
        $token = $jwt_manager->generate_chat_token($instance_id, [
            'session_id' => $request->get_param('session_id'),
            'page_url' => $request->get_param('page_url'),
            'page_title' => $request->get_param('page_title'),
        ]);
        
        return [
            'token' => $token,
            'expires_in' => 300,
            'webhook_url' => $instance['webhook_url'], // Direct URL for streaming
        ];
    },
    'permission_callback' => '__return_true', // Public, but instance access checked
]);
```

#### Frontend Direct Connection

```typescript
// src/runtime/DirectN8nAdapter.ts

import { ChatModelAdapter, ChatModelRunOptions, ChatModelRunResult } from '@assistant-ui/react';

export class DirectN8nAdapter implements ChatModelAdapter {
  private tokenEndpoint: string;
  private instanceId: string;
  
  constructor(config: { tokenEndpoint: string; instanceId: string }) {
    this.tokenEndpoint = config.tokenEndpoint;
    this.instanceId = config.instanceId;
  }
  
  async *run(options: ChatModelRunOptions): AsyncGenerator<ChatModelRunResult> {
    // Step 1: Get JWT token from WordPress
    const tokenResponse = await fetch(this.tokenEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instance_id: this.instanceId,
        session_id: this.getSessionId(),
        page_url: window.location.href,
        page_title: document.title,
      }),
      credentials: 'include', // Include cookies for auth
    });
    
    if (!tokenResponse.ok) {
      throw new Error('Failed to get chat token');
    }
    
    const { token, webhook_url } = await tokenResponse.json();
    
    // Step 2: Connect DIRECTLY to n8n with JWT
    const response = await fetch(webhook_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`, // JWT for n8n validation
        'Accept': 'text/event-stream',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        messages: this.formatMessages(options.messages),
        // JWT already contains context, but can add more
      }),
    });
    
    // Step 3: Stream directly from n8n (no PHP in the middle!)
    yield* this.handleStream(response);
  }
  
  private async *handleStream(response: Response): AsyncGenerator<ChatModelRunResult> {
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
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          
          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              yield {
                content: [{ type: 'text', text: fullText }],
              };
            }
          } catch {}
        }
      }
    }
  }
}
```

### Configuration Option

Add to instance settings:

```typescript
interface InstanceConfig {
  // ... existing fields
  
  /**
   * Streaming mode
   * - 'proxy': Stream through WordPress (more secure, may have buffering issues)
   * - 'direct': Stream directly to n8n (better performance, requires JWT validation in n8n)
   */
  streamingMode: 'proxy' | 'direct';
}
```

---

## 2. CRITICAL: File Upload Architecture

### The Problem

Piping binary uploads through React → WordPress → n8n:
- Double bandwidth usage
- PHP memory limits for large files
- Complex multipart handling
- Error-prone

### The Solution: Upload to WordPress Media Library First

```
┌─────────────────────────────────────────────────────────────────┐
│                     FILE UPLOAD FLOW                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  1. User selects file in chat                                   │
│  2. React uploads to WP Media Library (standard REST API)       │
│  3. WordPress returns media URL                                  │
│  4. React sends URL + metadata to n8n (text, not binary)        │
│  5. n8n fetches file from URL if needed                         │
│                                                                  │
│  Benefits:                                                       │
│  - Standard WordPress media handling (validation, thumbnails)   │
│  - No custom binary proxy code                                   │
│  - Files are stored and manageable                              │
│  - URL-based = simple text payload to n8n                       │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Implementation

```typescript
// src/services/file-upload-service.ts

interface UploadResult {
  id: number;
  url: string;
  filename: string;
  mime_type: string;
  size: number;
}

export class FileUploadService {
  private restUrl: string;
  private nonce: string;
  
  constructor(config: { restUrl: string; nonce: string }) {
    this.restUrl = config.restUrl;
    this.nonce = config.nonce;
  }
  
  /**
   * Upload file to WordPress Media Library
   */
  async uploadFile(file: File): Promise<UploadResult> {
    // Validate file before upload
    this.validateFile(file);
    
    const formData = new FormData();
    formData.append('file', file);
    
    // Optional: Add to specific folder/category
    formData.append('title', `FlowChat Upload - ${file.name}`);
    formData.append('alt_text', `Chat attachment: ${file.name}`);
    
    const response = await fetch(`${this.restUrl}/wp/v2/media`, {
      method: 'POST',
      headers: {
        'X-WP-Nonce': this.nonce,
      },
      body: formData,
      credentials: 'include',
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    const media = await response.json();
    
    return {
      id: media.id,
      url: media.source_url,
      filename: media.title.rendered,
      mime_type: media.mime_type,
      size: media.media_details?.filesize || 0,
    };
  }
  
  /**
   * Validate file before upload
   */
  private validateFile(file: File): void {
    const maxSize = 10 * 1024 * 1024; // 10MB default
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'text/plain',
      'text/csv',
    ];
    
    if (file.size > maxSize) {
      throw new Error(`File too large. Maximum size is ${maxSize / 1024 / 1024}MB`);
    }
    
    if (!allowedTypes.includes(file.type)) {
      throw new Error(`File type ${file.type} is not allowed`);
    }
  }
}
```

### Chat Input with File Upload

```tsx
// src/components/chat/ChatInputWithUpload.tsx

import React, { useRef, useState } from 'react';
import { FileUploadService, UploadResult } from '../../services/file-upload-service';

interface Props {
  onSendMessage: (content: string, attachments?: UploadResult[]) => void;
  uploadService: FileUploadService;
}

export const ChatInputWithUpload: React.FC<Props> = ({ onSendMessage, uploadService }) => {
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    
    setUploading(true);
    
    try {
      const uploads = await Promise.all(
        Array.from(files).map(file => uploadService.uploadFile(file))
      );
      setAttachments(prev => [...prev, ...uploads]);
    } catch (error) {
      console.error('Upload failed:', error);
      // Show error to user
    } finally {
      setUploading(false);
    }
  };
  
  const handleSend = () => {
    if (!message.trim() && !attachments.length) return;
    
    onSendMessage(message, attachments);
    setMessage('');
    setAttachments([]);
  };
  
  return (
    <div className="flowchat-input-container">
      {/* Attachment previews */}
      {attachments.length > 0 && (
        <div className="flowchat-attachments">
          {attachments.map((att, i) => (
            <div key={i} className="flowchat-attachment-preview">
              {att.mime_type.startsWith('image/') ? (
                <img src={att.url} alt={att.filename} />
              ) : (
                <span>{att.filename}</span>
              )}
              <button onClick={() => setAttachments(prev => prev.filter((_, j) => j !== i))}>
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      
      <div className="flowchat-input-row">
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flowchat-attach-btn"
        >
          📎
        </button>
        
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          hidden
        />
        
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
        />
        
        <button onClick={handleSend} disabled={uploading}>
          Send
        </button>
      </div>
    </div>
  );
};
```

### Message Payload to n8n

```typescript
// What gets sent to n8n (simple JSON, no binary)
interface ChatMessagePayload {
  action: 'sendMessage';
  sessionId: string;
  message: string;
  attachments?: {
    url: string;        // WordPress media URL
    filename: string;
    mime_type: string;
    size: number;
  }[];
  context: {
    user_id: number;
    site_url: string;
    // ... other context
  };
}
```

---

## 3. CRITICAL: Database Schema Improvements

### Add Missing Indexes and JSON Type

```sql
-- Updated schema for wp_flowchat_messages

CREATE TABLE IF NOT EXISTS `{prefix}flowchat_messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `session_id` BIGINT UNSIGNED NOT NULL,
  `session_uuid` VARCHAR(36) NOT NULL,  -- ADD: For faster lookups
  `role` ENUM('user', 'assistant', 'system') NOT NULL,
  `content` JSON NOT NULL,  -- CHANGE: Explicit JSON type
  `metadata` JSON DEFAULT NULL,  -- ADD: For tool calls, attachments, etc.
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  PRIMARY KEY (`id`),
  KEY `idx_session_id` (`session_id`),
  KEY `idx_session_uuid` (`session_uuid`),  -- ADD: Critical for history loading
  KEY `idx_created_at` (`created_at`),
  KEY `idx_session_created` (`session_id`, `created_at`),  -- ADD: Composite index
  
  CONSTRAINT `fk_message_session`
    FOREIGN KEY (`session_id`)
    REFERENCES `{prefix}flowchat_sessions` (`id`)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- For MySQL < 8.0 (no native JSON), use LONGTEXT
-- But add a CHECK constraint or application-level validation
```

### Message Content Structure

```typescript
// Define the JSON structure for content column

interface MessageContent {
  // Text parts
  parts: MessagePart[];
  
  // Tool calls (assistant messages)
  tool_calls?: ToolCall[];
  
  // Tool results (user messages in response to tool calls)
  tool_results?: ToolResult[];
  
  // Attachments
  attachments?: Attachment[];
}

interface MessagePart {
  type: 'text' | 'image' | 'file';
  text?: string;
  url?: string;
  mime_type?: string;
}

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  tool_call_id: string;
  output: unknown;
  error?: string;
}

interface Attachment {
  url: string;
  filename: string;
  mime_type: string;
  size: number;
  wp_media_id?: number;
}
```

### PHP JSON Handling

```php
<?php
// includes/database/class-messages-table.php

namespace FlowChat\Database;

class Messages_Table {
    
    /**
     * Insert message with proper JSON encoding
     */
    public function insert_message(array $data): int {
        global $wpdb;
        
        $table = $wpdb->prefix . 'flowchat_messages';
        
        // Ensure content is properly encoded JSON
        $content = is_array($data['content']) 
            ? wp_json_encode($data['content']) 
            : $data['content'];
        
        $metadata = isset($data['metadata']) 
            ? wp_json_encode($data['metadata']) 
            : null;
        
        $wpdb->insert($table, [
            'session_id' => $data['session_id'],
            'session_uuid' => $data['session_uuid'],
            'role' => $data['role'],
            'content' => $content,
            'metadata' => $metadata,
        ], ['%d', '%s', '%s', '%s', '%s']);
        
        return $wpdb->insert_id;
    }
    
    /**
     * Get messages by session UUID with proper decoding
     */
    public function get_by_session_uuid(string $uuid): array {
        global $wpdb;
        
        $table = $wpdb->prefix . 'flowchat_messages';
        
        // Use the session_uuid index for fast lookups
        $results = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$table} 
                 WHERE session_uuid = %s 
                 ORDER BY created_at ASC",
                $uuid
            ),
            ARRAY_A
        );
        
        // Decode JSON content
        return array_map(function($row) {
            $row['content'] = json_decode($row['content'], true);
            $row['metadata'] = $row['metadata'] 
                ? json_decode($row['metadata'], true) 
                : null;
            return $row;
        }, $results);
    }
}
```

---

## 4. NEW FEATURE: System Prompt Builder (Meta-Prompting)

### Dynamic Context Tags

```php
<?php
// includes/core/class-context-builder.php

namespace FlowChat\Core;

class Context_Builder {
    
    private array $registered_tags = [];
    
    public function __construct() {
        $this->register_default_tags();
    }
    
    /**
     * Register default context tags
     */
    private function register_default_tags(): void {
        // Site info
        $this->register_tag('site_name', fn() => get_bloginfo('name'));
        $this->register_tag('site_url', fn() => home_url());
        $this->register_tag('site_description', fn() => get_bloginfo('description'));
        
        // Current page
        $this->register_tag('current_page_url', fn() => $this->get_current_url());
        $this->register_tag('current_page_title', fn() => $this->get_current_title());
        $this->register_tag('current_page_content', fn() => $this->get_current_content());
        $this->register_tag('current_page_excerpt', fn() => $this->get_current_excerpt());
        $this->register_tag('current_page_type', fn() => $this->get_current_post_type());
        
        // User info
        $this->register_tag('user_name', fn() => $this->get_user_name());
        $this->register_tag('user_email', fn() => $this->get_user_email());
        $this->register_tag('user_role', fn() => $this->get_user_role());
        $this->register_tag('user_logged_in', fn() => is_user_logged_in() ? 'yes' : 'no');
        
        // DateTime
        $this->register_tag('current_date', fn() => current_time('F j, Y'));
        $this->register_tag('current_time', fn() => current_time('g:i a'));
        $this->register_tag('current_day', fn() => current_time('l'));
        
        // WooCommerce (if active)
        if (class_exists('WooCommerce')) {
            $this->register_tag('woo_cart_total', fn() => $this->get_woo_cart_total());
            $this->register_tag('woo_cart_count', fn() => $this->get_woo_cart_count());
            $this->register_tag('woo_cart_items', fn() => $this->get_woo_cart_items());
            $this->register_tag('woo_currency', fn() => get_woocommerce_currency_symbol());
        }
        
        // Allow plugins to add custom tags
        do_action('flowchat_register_context_tags', $this);
    }
    
    /**
     * Register a custom tag
     */
    public function register_tag(string $name, callable $resolver): void {
        $this->registered_tags[$name] = $resolver;
    }
    
    /**
     * Process a template string and replace all tags
     */
    public function process_template(string $template, array $extra_context = []): string {
        // Match {tag_name} patterns
        return preg_replace_callback(
            '/\{([a-z_]+)\}/',
            function($matches) use ($extra_context) {
                $tag = $matches[1];
                
                // Check extra context first
                if (isset($extra_context[$tag])) {
                    return $extra_context[$tag];
                }
                
                // Then check registered tags
                if (isset($this->registered_tags[$tag])) {
                    return call_user_func($this->registered_tags[$tag]);
                }
                
                // Return original if not found
                return $matches[0];
            },
            $template
        );
    }
    
    /**
     * Get all available tags for admin UI
     */
    public function get_available_tags(): array {
        $tags = [];
        
        foreach ($this->registered_tags as $name => $resolver) {
            $tags[$name] = [
                'name' => $name,
                'placeholder' => '{' . $name . '}',
                'description' => $this->get_tag_description($name),
                'category' => $this->get_tag_category($name),
            ];
        }
        
        return $tags;
    }
    
    // Helper methods
    private function get_current_url(): string {
        global $wp;
        return home_url($wp->request);
    }
    
    private function get_current_title(): string {
        return wp_get_document_title();
    }
    
    private function get_current_content(): string {
        global $post;
        if (!$post) return '';
        
        $content = strip_shortcodes($post->post_content);
        $content = wp_strip_all_tags($content);
        $content = preg_replace('/\s+/', ' ', $content);
        
        // Limit to ~2000 chars to not blow up context
        return mb_substr($content, 0, 2000);
    }
    
    private function get_current_excerpt(): string {
        global $post;
        if (!$post) return '';
        
        return $post->post_excerpt ?: wp_trim_words(
            strip_shortcodes($post->post_content), 
            55
        );
    }
    
    private function get_current_post_type(): string {
        return get_post_type() ?: 'unknown';
    }
    
    private function get_user_name(): string {
        $user = wp_get_current_user();
        return $user->display_name ?: 'Guest';
    }
    
    private function get_user_email(): string {
        $user = wp_get_current_user();
        return $user->user_email ?: '';
    }
    
    private function get_user_role(): string {
        $user = wp_get_current_user();
        return !empty($user->roles) ? $user->roles[0] : 'guest';
    }
    
    private function get_woo_cart_total(): string {
        if (!function_exists('WC')) return '0';
        return WC()->cart ? WC()->cart->get_cart_total() : '0';
    }
    
    private function get_woo_cart_count(): string {
        if (!function_exists('WC')) return '0';
        return WC()->cart ? (string) WC()->cart->get_cart_contents_count() : '0';
    }
    
    private function get_woo_cart_items(): string {
        if (!function_exists('WC') || !WC()->cart) return 'Empty cart';
        
        $items = [];
        foreach (WC()->cart->get_cart() as $item) {
            $product = $item['data'];
            $items[] = $product->get_name() . ' x' . $item['quantity'];
        }
        
        return implode(', ', $items) ?: 'Empty cart';
    }
    
    private function get_tag_description(string $tag): string {
        $descriptions = [
            'site_name' => 'The name of your website',
            'current_page_content' => 'The main content of the current page (first 2000 chars)',
            'user_role' => 'The WordPress role of the current user',
            'woo_cart_total' => 'The total value of items in WooCommerce cart',
            // ... add more
        ];
        
        return $descriptions[$tag] ?? '';
    }
    
    private function get_tag_category(string $tag): string {
        if (str_starts_with($tag, 'site_')) return 'Site';
        if (str_starts_with($tag, 'current_page_')) return 'Page';
        if (str_starts_with($tag, 'user_')) return 'User';
        if (str_starts_with($tag, 'woo_')) return 'WooCommerce';
        if (str_starts_with($tag, 'current_')) return 'DateTime';
        return 'Other';
    }
}
```

### Admin UI for System Prompt

```tsx
// src/admin/components/SystemPromptBuilder.tsx

import React, { useState } from 'react';
import { TextareaControl, Panel, PanelBody, Button } from '@wordpress/components';
import { useContextTags } from '../hooks/useContextTags';

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export const SystemPromptBuilder: React.FC<Props> = ({ value, onChange }) => {
  const { tags, isLoading } = useContextTags();
  const [preview, setPreview] = useState<string | null>(null);
  
  const insertTag = (tag: string) => {
    const textarea = document.querySelector('#system-prompt-textarea') as HTMLTextAreaElement;
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const newValue = value.slice(0, start) + `{${tag}}` + value.slice(end);
    
    onChange(newValue);
    
    // Restore cursor position
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + tag.length + 2, start + tag.length + 2);
    }, 0);
  };
  
  const tagsByCategory = tags.reduce((acc, tag) => {
    const cat = tag.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(tag);
    return acc;
  }, {} as Record<string, typeof tags>);
  
  return (
    <div className="flowchat-system-prompt-builder">
      <TextareaControl
        id="system-prompt-textarea"
        label="System Prompt"
        help="This message is sent at the start of each conversation to set the AI's behavior. Use tags to inject dynamic content."
        value={value}
        onChange={onChange}
        rows={8}
      />
      
      <Panel header="Available Tags">
        {Object.entries(tagsByCategory).map(([category, categoryTags]) => (
          <PanelBody key={category} title={category} initialOpen={false}>
            <div className="flowchat-tag-grid">
              {categoryTags.map(tag => (
                <button
                  key={tag.name}
                  type="button"
                  className="flowchat-tag-button"
                  onClick={() => insertTag(tag.name)}
                  title={tag.description}
                >
                  <code>{tag.placeholder}</code>
                </button>
              ))}
            </div>
          </PanelBody>
        ))}
      </Panel>
      
      <div className="flowchat-prompt-preview">
        <Button
          variant="secondary"
          onClick={async () => {
            // Fetch preview from API
            const response = await fetch('/wp-json/flowchat/v1/preview-prompt', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ template: value }),
            });
            const { processed } = await response.json();
            setPreview(processed);
          }}
        >
          Preview Resolved Prompt
        </Button>
        
        {preview && (
          <pre className="flowchat-prompt-preview-output">{preview}</pre>
        )}
      </div>
    </div>
  );
};
```

### Example System Prompt

```
You are a helpful assistant for {site_name}.

Current context:
- Page: {current_page_title}
- User: {user_name} ({user_role})
- Date: {current_date}

{woo_cart_count} items in cart worth {woo_cart_total}.

Page content for reference:
{current_page_excerpt}

Always be helpful and refer users to our support team if you cannot answer their question.
```

---

## 5. NEW FEATURE: URL-Based Instance Routing

### Instance Targeting Rules

```php
<?php
// includes/core/class-instance-router.php

namespace FlowChat\Core;

class Instance_Router {
    
    /**
     * Get the instance to display on the current page
     */
    public function get_active_instance(): ?array {
        $instances = $this->get_enabled_instances();
        
        foreach ($instances as $instance) {
            if ($this->matches_current_page($instance)) {
                return $instance;
            }
        }
        
        // Return default instance if no specific match
        return $this->get_default_instance();
    }
    
    /**
     * Check if instance should display on current page
     */
    private function matches_current_page(array $instance): bool {
        $targeting = $instance['targeting'] ?? [];
        
        if (empty($targeting['rules'])) {
            return false; // No rules = don't auto-load
        }
        
        $current_url = $this->get_current_url();
        
        foreach ($targeting['rules'] as $rule) {
            if ($this->evaluate_rule($rule, $current_url)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Evaluate a single targeting rule
     */
    private function evaluate_rule(array $rule, string $url): bool {
        $type = $rule['type'] ?? 'url_pattern';
        $value = $rule['value'] ?? '';
        $condition = $rule['condition'] ?? 'contains';
        
        switch ($type) {
            case 'url_pattern':
                return $this->match_url_pattern($url, $value, $condition);
                
            case 'post_type':
                return $this->match_post_type($value);
                
            case 'page_id':
                return $this->match_page_id($value);
                
            case 'category':
                return $this->match_category($value);
                
            case 'user_role':
                return $this->match_user_role($value);
                
            case 'query_param':
                return $this->match_query_param($rule);
                
            default:
                return false;
        }
    }
    
    /**
     * Match URL pattern
     */
    private function match_url_pattern(string $url, string $pattern, string $condition): bool {
        $path = parse_url($url, PHP_URL_PATH) ?? '/';
        
        switch ($condition) {
            case 'equals':
                return $path === $pattern;
                
            case 'starts_with':
                return str_starts_with($path, $pattern);
                
            case 'ends_with':
                return str_ends_with($path, $pattern);
                
            case 'contains':
                return str_contains($path, $pattern);
                
            case 'regex':
                return preg_match($pattern, $path) === 1;
                
            case 'wildcard':
                // Convert wildcard to regex: /pricing/* -> /pricing/.*
                $regex = str_replace(
                    ['*', '?'],
                    ['.*', '.'],
                    preg_quote($pattern, '/')
                );
                return preg_match('/^' . $regex . '$/', $path) === 1;
                
            default:
                return false;
        }
    }
    
    private function match_post_type(string $post_type): bool {
        return get_post_type() === $post_type;
    }
    
    private function match_page_id($page_ids): bool {
        $ids = is_array($page_ids) ? $page_ids : [$page_ids];
        return in_array(get_the_ID(), $ids);
    }
    
    private function match_category($categories): bool {
        $cats = is_array($categories) ? $categories : [$categories];
        return has_category($cats);
    }
    
    private function match_user_role(string $role): bool {
        $user = wp_get_current_user();
        
        if ($role === 'guest') {
            return !is_user_logged_in();
        }
        
        if ($role === 'logged_in') {
            return is_user_logged_in();
        }
        
        return in_array($role, $user->roles);
    }
    
    private function match_query_param(array $rule): bool {
        $param = $rule['param'] ?? '';
        $expected = $rule['value'] ?? '';
        
        $actual = $_GET[$param] ?? null;
        
        if ($actual === null) {
            return false;
        }
        
        if ($expected === '*') {
            return true; // Any value is fine
        }
        
        return $actual === $expected;
    }
    
    private function get_current_url(): string {
        global $wp;
        return home_url($wp->request);
    }
    
    private function get_enabled_instances(): array {
        $instance_manager = new Instance_Manager();
        return array_filter(
            $instance_manager->get_all_instances(),
            fn($i) => $i['is_enabled'] && !empty($i['targeting']['rules'])
        );
    }
    
    private function get_default_instance(): ?array {
        $instance_manager = new Instance_Manager();
        $instances = $instance_manager->get_all_instances();
        
        foreach ($instances as $instance) {
            if ($instance['is_enabled'] && ($instance['is_default'] ?? false)) {
                return $instance;
            }
        }
        
        return null;
    }
}
```

### Targeting Rules Schema

```typescript
// Instance targeting configuration

interface InstanceTargeting {
  enabled: boolean;
  rules: TargetingRule[];
  priority: number; // Higher = checked first
}

interface TargetingRule {
  id: string;
  type: 'url_pattern' | 'post_type' | 'page_id' | 'category' | 'user_role' | 'query_param';
  condition?: 'equals' | 'starts_with' | 'ends_with' | 'contains' | 'regex' | 'wildcard';
  value: string | string[];
  param?: string; // For query_param type
}

// Example configurations:

// Sales Bot on pricing pages
const salesBotTargeting: InstanceTargeting = {
  enabled: true,
  priority: 10,
  rules: [
    { id: '1', type: 'url_pattern', condition: 'wildcard', value: '/pricing/*' },
    { id: '2', type: 'url_pattern', condition: 'equals', value: '/demo' },
    { id: '3', type: 'page_id', value: [123, 456] }, // Specific pages
  ]
};

// Support Bot on help pages
const supportBotTargeting: InstanceTargeting = {
  enabled: true,
  priority: 5,
  rules: [
    { id: '1', type: 'url_pattern', condition: 'starts_with', value: '/help' },
    { id: '2', type: 'url_pattern', condition: 'starts_with', value: '/support' },
    { id: '3', type: 'url_pattern', condition: 'starts_with', value: '/docs' },
    { id: '4', type: 'category', value: ['faq', 'support'] },
  ]
};

// VIP Bot for logged-in customers
const vipBotTargeting: InstanceTargeting = {
  enabled: true,
  priority: 20, // Higher priority
  rules: [
    { id: '1', type: 'user_role', value: 'customer' },
  ]
};
```

### Admin UI for Targeting Rules

```tsx
// src/admin/components/TargetingRulesEditor.tsx

import React from 'react';
import { Button, SelectControl, TextControl, Panel, PanelBody } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface Rule {
  id: string;
  type: string;
  condition?: string;
  value: string;
}

interface Props {
  rules: Rule[];
  onChange: (rules: Rule[]) => void;
}

export const TargetingRulesEditor: React.FC<Props> = ({ rules, onChange }) => {
  const ruleTypes = [
    { value: 'url_pattern', label: 'URL Pattern' },
    { value: 'post_type', label: 'Post Type' },
    { value: 'page_id', label: 'Specific Pages' },
    { value: 'category', label: 'Category' },
    { value: 'user_role', label: 'User Role' },
  ];
  
  const conditions = [
    { value: 'equals', label: 'Equals' },
    { value: 'starts_with', label: 'Starts with' },
    { value: 'ends_with', label: 'Ends with' },
    { value: 'contains', label: 'Contains' },
    { value: 'wildcard', label: 'Wildcard (*,?)' },
    { value: 'regex', label: 'Regex' },
  ];
  
  const addRule = () => {
    onChange([
      ...rules,
      { id: crypto.randomUUID(), type: 'url_pattern', condition: 'starts_with', value: '' }
    ]);
  };
  
  const updateRule = (id: string, updates: Partial<Rule>) => {
    onChange(rules.map(r => r.id === id ? { ...r, ...updates } : r));
  };
  
  const removeRule = (id: string) => {
    onChange(rules.filter(r => r.id !== id));
  };
  
  return (
    <div className="flowchat-targeting-rules">
      <p className="description">
        {__('Define where this chat instance should automatically appear. Leave empty to only show via shortcode.', 'flowchat')}
      </p>
      
      {rules.map((rule, index) => (
        <Panel key={rule.id}>
          <PanelBody title={`Rule ${index + 1}`} initialOpen>
            <div className="flowchat-rule-row">
              <SelectControl
                label="Type"
                value={rule.type}
                options={ruleTypes}
                onChange={(type) => updateRule(rule.id, { type })}
              />
              
              {rule.type === 'url_pattern' && (
                <SelectControl
                  label="Condition"
                  value={rule.condition || 'starts_with'}
                  options={conditions}
                  onChange={(condition) => updateRule(rule.id, { condition })}
                />
              )}
              
              <TextControl
                label="Value"
                value={rule.value}
                onChange={(value) => updateRule(rule.id, { value })}
                placeholder={
                  rule.type === 'url_pattern' ? '/pricing/*' :
                  rule.type === 'post_type' ? 'product' :
                  rule.type === 'user_role' ? 'customer' : ''
                }
              />
              
              <Button
                variant="tertiary"
                isDestructive
                onClick={() => removeRule(rule.id)}
              >
                Remove
              </Button>
            </div>
          </PanelBody>
        </Panel>
      ))}
      
      <Button variant="secondary" onClick={addRule}>
        {__('Add Rule', 'flowchat')}
      </Button>
      
      <p className="description" style={{ marginTop: '1em' }}>
        {__('Rules are evaluated with OR logic - the bot appears if ANY rule matches.', 'flowchat')}
      </p>
    </div>
  );
};
```

---

## 6. Live Preview Isolation (Shadow DOM)

### The Problem

WordPress Admin CSS bleeds into React components, breaking the preview.

### Solution: Shadow DOM Wrapper

```tsx
// src/admin/components/IsolatedPreview.tsx

import React, { useRef, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ChatContainer } from '../../components/chat/ChatContainer';
import { StylePreset } from '../../types/style-presets';

interface Props {
  config: any;
  stylePreset: StylePreset;
}

export const IsolatedPreview: React.FC<Props> = ({ config, stylePreset }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [shadowRoot, setShadowRoot] = useState<ShadowRoot | null>(null);
  const [mountPoint, setMountPoint] = useState<HTMLDivElement | null>(null);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    // Create shadow DOM
    const shadow = containerRef.current.attachShadow({ mode: 'open' });
    setShadowRoot(shadow);
    
    // Create mount point inside shadow
    const mount = document.createElement('div');
    mount.id = 'flowchat-preview-root';
    shadow.appendChild(mount);
    setMountPoint(mount);
    
    // Inject styles into shadow DOM
    const styleElement = document.createElement('style');
    styleElement.textContent = generatePreviewStyles(stylePreset);
    shadow.appendChild(styleElement);
    
    // Load external stylesheet into shadow
    const linkElement = document.createElement('link');
    linkElement.rel = 'stylesheet';
    linkElement.href = `${window.flowchatAdmin.pluginUrl}build/frontend/chat.css`;
    shadow.appendChild(linkElement);
    
    return () => {
      // Cleanup
      while (shadow.firstChild) {
        shadow.removeChild(shadow.firstChild);
      }
    };
  }, []);
  
  // Update styles when preset changes
  useEffect(() => {
    if (!shadowRoot) return;
    
    const styleElement = shadowRoot.querySelector('style');
    if (styleElement) {
      styleElement.textContent = generatePreviewStyles(stylePreset);
    }
  }, [stylePreset, shadowRoot]);
  
  return (
    <div className="flowchat-isolated-preview-container">
      <div ref={containerRef} className="flowchat-shadow-host" />
      
      {mountPoint && createPortal(
        <div className="flowchat-preview-wrapper">
          <ChatContainer
            instanceId="preview"
            config={config}
            isPreview={true}
          />
        </div>,
        mountPoint
      )}
    </div>
  );
};

function generatePreviewStyles(preset: StylePreset): string {
  return `
    :host {
      all: initial;
      display: block;
    }
    
    .flowchat-preview-wrapper {
      /* Reset everything */
      font-family: ${preset.typography.fontFamily};
      font-size: ${preset.typography.fontSize.base};
      line-height: ${preset.typography.lineHeight};
      color: ${preset.colors.text};
      
      /* CSS Variables from preset */
      --flowchat-primary: ${preset.colors.primary};
      --flowchat-primary-hover: ${preset.colors.primaryHover};
      --flowchat-background: ${preset.colors.background};
      --flowchat-surface: ${preset.colors.surface};
      --flowchat-text: ${preset.colors.text};
      --flowchat-text-muted: ${preset.colors.textMuted};
      --flowchat-border: ${preset.colors.border};
      --flowchat-user-message: ${preset.colors.userMessage};
      --flowchat-assistant-message: ${preset.colors.assistantMessage};
      
      /* Spacing */
      --flowchat-spacing-xs: ${preset.spacing.xs};
      --flowchat-spacing-sm: ${preset.spacing.sm};
      --flowchat-spacing-md: ${preset.spacing.md};
      --flowchat-spacing-lg: ${preset.spacing.lg};
      
      /* Border radius */
      --flowchat-radius-small: ${preset.borderRadius.small};
      --flowchat-radius-medium: ${preset.borderRadius.medium};
      --flowchat-radius-large: ${preset.borderRadius.large};
    }
    
    /* Normalize common elements */
    .flowchat-preview-wrapper * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    
    .flowchat-preview-wrapper button {
      font-family: inherit;
      cursor: pointer;
    }
    
    .flowchat-preview-wrapper input,
    .flowchat-preview-wrapper textarea {
      font-family: inherit;
    }
  `;
}
```

### Alternative: iframe Isolation

```tsx
// src/admin/components/IframePreview.tsx

import React, { useRef, useEffect } from 'react';

interface Props {
  config: any;
  stylePreset: any;
}

export const IframePreview: React.FC<Props> = ({ config, stylePreset }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    
    const doc = iframe.contentDocument;
    if (!doc) return;
    
    // Write complete HTML to iframe
    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <link rel="stylesheet" href="${window.flowchatAdmin.pluginUrl}build/frontend/chat.css">
        <style>
          body { margin: 0; padding: 16px; background: #f0f0f0; }
        </style>
      </head>
      <body>
        <div id="flowchat-preview-root"></div>
        <script src="${window.flowchatAdmin.pluginUrl}build/frontend/chat.js"></script>
        <script>
          window.FlowChat.renderPreview(
            document.getElementById('flowchat-preview-root'),
            ${JSON.stringify(config)},
            ${JSON.stringify(stylePreset)}
          );
        </script>
      </body>
      </html>
    `);
    doc.close();
  }, [config, stylePreset]);
  
  return (
    <iframe
      ref={iframeRef}
      className="flowchat-iframe-preview"
      title="Chat Preview"
      sandbox="allow-scripts allow-same-origin"
      style={{
        width: '100%',
        height: '500px',
        border: '1px solid #ddd',
        borderRadius: '8px',
      }}
    />
  );
};
```

---

## 7. Theme Integration: Inherit from Theme

### Auto-detect Theme Colors

```php
<?php
// includes/core/class-theme-integration.php

namespace FlowChat\Core;

class Theme_Integration {
    
    /**
     * Get colors from active theme
     */
    public function get_theme_colors(): array {
        $colors = [
            'primary' => null,
            'secondary' => null,
            'background' => null,
            'text' => null,
        ];
        
        // Try theme.json first (Block themes)
        $theme_json_colors = $this->get_from_theme_json();
        if ($theme_json_colors) {
            return array_merge($colors, $theme_json_colors);
        }
        
        // Try Customizer settings
        $customizer_colors = $this->get_from_customizer();
        if ($customizer_colors) {
            return array_merge($colors, $customizer_colors);
        }
        
        // Fallback: try to detect from common CSS variables
        return $colors;
    }
    
    /**
     * Get colors from theme.json (WordPress 5.8+)
     */
    private function get_from_theme_json(): ?array {
        if (!function_exists('wp_get_global_settings')) {
            return null;
        }
        
        $settings = wp_get_global_settings();
        $palette = $settings['color']['palette']['theme'] ?? [];
        
        if (empty($palette)) {
            return null;
        }
        
        $colors = [];
        
        // Map common color slugs to our properties
        $slug_map = [
            'primary' => ['primary', 'brand', 'accent', 'link'],
            'secondary' => ['secondary', 'contrast'],
            'background' => ['background', 'base', 'white'],
            'text' => ['text', 'foreground', 'dark', 'black'],
        ];
        
        foreach ($slug_map as $key => $slugs) {
            foreach ($palette as $color) {
                if (in_array($color['slug'], $slugs)) {
                    $colors[$key] = $color['color'];
                    break;
                }
            }
        }
        
        return !empty($colors) ? $colors : null;
    }
    
    /**
     * Get colors from Customizer
     */
    private function get_from_customizer(): ?array {
        $colors = [];
        
        // Common customizer settings
        $settings = [
            'primary' => [
                'accent_color',
                'primary_color',
                'link_color',
                'theme_color',
            ],
            'background' => [
                'background_color',
            ],
        ];
        
        foreach ($settings as $key => $mods) {
            foreach ($mods as $mod) {
                $value = get_theme_mod($mod);
                if ($value) {
                    $colors[$key] = $value;
                    break;
                }
            }
        }
        
        // Background color from WP setting
        if (empty($colors['background'])) {
            $bg = get_background_color();
            if ($bg) {
                $colors['background'] = '#' . $bg;
            }
        }
        
        return !empty($colors) ? $colors : null;
    }
    
    /**
     * Generate CSS variables for frontend
     */
    public function get_css_variables(): string {
        $colors = $this->get_theme_colors();
        
        $css = ':root {';
        
        if ($colors['primary']) {
            $css .= "--flowchat-theme-primary: {$colors['primary']};";
        }
        if ($colors['secondary']) {
            $css .= "--flowchat-theme-secondary: {$colors['secondary']};";
        }
        if ($colors['background']) {
            $css .= "--flowchat-theme-background: {$colors['background']};";
        }
        if ($colors['text']) {
            $css .= "--flowchat-theme-text: {$colors['text']};";
        }
        
        $css .= '}';
        
        return $css;
    }
}
```

### Frontend Integration

```typescript
// src/utils/theme-detector.ts

export interface ThemeColors {
  primary?: string;
  secondary?: string;
  background?: string;
  text?: string;
}

export function detectThemeColors(): ThemeColors {
  const colors: ThemeColors = {};
  
  // Check for CSS custom properties commonly used by themes
  const root = document.documentElement;
  const computedStyle = getComputedStyle(root);
  
  const cssVarMappings = [
    // Primary color
    ['primary', ['--wp--preset--color--primary', '--theme-primary', '--color-primary', '--accent-color']],
    // Background
    ['background', ['--wp--preset--color--background', '--theme-background', '--color-background']],
    // Text
    ['text', ['--wp--preset--color--foreground', '--theme-text', '--color-text', '--body-color']],
  ] as const;
  
  for (const [key, vars] of cssVarMappings) {
    for (const cssVar of vars) {
      const value = computedStyle.getPropertyValue(cssVar).trim();
      if (value) {
        colors[key] = value;
        break;
      }
    }
  }
  
  // Fallback: detect from body styles
  if (!colors.background) {
    const bodyBg = computedStyle.getPropertyValue('background-color');
    if (bodyBg && bodyBg !== 'rgba(0, 0, 0, 0)') {
      colors.background = bodyBg;
    }
  }
  
  if (!colors.text) {
    const bodyColor = computedStyle.getPropertyValue('color');
    if (bodyColor) {
      colors.text = bodyColor;
    }
  }
  
  // Fallback: detect from links
  if (!colors.primary) {
    const link = document.querySelector('a');
    if (link) {
      colors.primary = getComputedStyle(link).color;
    }
  }
  
  return colors;
}
```

### Admin Option

```typescript
// In instance config
interface InstanceAppearance {
  theme: 'light' | 'dark' | 'auto';
  
  /**
   * Color source
   * - 'custom': Use the custom primaryColor
   * - 'theme': Inherit from WordPress theme
   * - 'preset': Use style preset colors
   */
  colorSource: 'custom' | 'theme' | 'preset';
  
  primaryColor: string; // Used when colorSource is 'custom'
  stylePreset: string;  // Used when colorSource is 'preset'
}
```

---

## 8. Offline/Fallback Mode

### Contact Form Fallback

```tsx
// src/components/fallback/ContactFormFallback.tsx

import React, { useState } from 'react';
import { __ } from '@wordpress/i18n';

interface Props {
  instanceConfig: any;
  error?: string;
  onSubmit: (data: ContactFormData) => Promise<void>;
}

interface ContactFormData {
  name: string;
  email: string;
  message: string;
}

export const ContactFormFallback: React.FC<Props> = ({ instanceConfig, error, onSubmit }) => {
  const [formData, setFormData] = useState<ContactFormData>({
    name: '',
    email: '',
    message: '',
  });
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('submitting');
    
    try {
      await onSubmit(formData);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };
  
  if (status === 'success') {
    return (
      <div className="flowchat-fallback-success">
        <div className="flowchat-fallback-icon">✓</div>
        <h3>{__('Message Sent', 'flowchat')}</h3>
        <p>{__('We\'ll get back to you as soon as possible.', 'flowchat')}</p>
      </div>
    );
  }
  
  return (
    <div className="flowchat-fallback-form">
      <div className="flowchat-fallback-header">
        <h3>{__('Leave a Message', 'flowchat')}</h3>
        {error && (
          <p className="flowchat-fallback-notice">
            {__('Our chat service is temporarily unavailable. Please leave a message and we\'ll respond via email.', 'flowchat')}
          </p>
        )}
      </div>
      
      <form onSubmit={handleSubmit}>
        <div className="flowchat-form-field">
          <label htmlFor="fc-name">{__('Name', 'flowchat')}</label>
          <input
            id="fc-name"
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        
        <div className="flowchat-form-field">
          <label htmlFor="fc-email">{__('Email', 'flowchat')}</label>
          <input
            id="fc-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>
        
        <div className="flowchat-form-field">
          <label htmlFor="fc-message">{__('Message', 'flowchat')}</label>
          <textarea
            id="fc-message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            rows={4}
            required
          />
        </div>
        
        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="flowchat-submit-btn"
        >
          {status === 'submitting' ? __('Sending...', 'flowchat') : __('Send Message', 'flowchat')}
        </button>
        
        {status === 'error' && (
          <p className="flowchat-form-error">
            {__('Failed to send. Please try again.', 'flowchat')}
          </p>
        )}
      </form>
    </div>
  );
};
```

### PHP Fallback Handler

```php
<?php
// includes/api/class-fallback-handler.php

namespace FlowChat\API;

class Fallback_Handler {
    
    /**
     * Handle contact form submission
     */
    public function handle_contact_form(\WP_REST_Request $request): \WP_REST_Response {
        $instance_id = $request->get_param('instance_id');
        $name = sanitize_text_field($request->get_param('name'));
        $email = sanitize_email($request->get_param('email'));
        $message = sanitize_textarea_field($request->get_param('message'));
        
        // Validate
        if (!$name || !$email || !$message) {
            return new \WP_REST_Response(['error' => 'All fields required'], 400);
        }
        
        if (!is_email($email)) {
            return new \WP_REST_Response(['error' => 'Invalid email'], 400);
        }
        
        // Get instance config for notification settings
        $instance_manager = new \FlowChat\Instance_Manager();
        $instance = $instance_manager->get_instance($instance_id);
        
        // Send email notification
        $this->send_notification($instance, $name, $email, $message);
        
        // Store in database for admin review
        $this->store_message($instance_id, $name, $email, $message);
        
        return new \WP_REST_Response(['success' => true]);
    }
    
    /**
     * Send email notification to admin
     */
    private function send_notification(?array $instance, string $name, string $email, string $message): void {
        $to = $instance['fallback_email'] ?? get_option('admin_email');
        $subject = sprintf(
            __('[%s] New Chat Message from %s', 'flowchat'),
            get_bloginfo('name'),
            $name
        );
        
        $body = sprintf(
            "New message received via FlowChat fallback form:\n\n" .
            "Name: %s\n" .
            "Email: %s\n" .
            "Instance: %s\n\n" .
            "Message:\n%s\n\n" .
            "---\n" .
            "Note: This message was submitted because the chat service was unavailable.",
            $name,
            $email,
            $instance['name'] ?? 'Unknown',
            $message
        );
        
        $headers = [
            'Reply-To: ' . $name . ' <' . $email . '>',
        ];
        
        wp_mail($to, $subject, $body, $headers);
    }
    
    /**
     * Store message in database
     */
    private function store_message(string $instance_id, string $name, string $email, string $message): void {
        global $wpdb;
        
        $table = $wpdb->prefix . 'flowchat_fallback_messages';
        
        $wpdb->insert($table, [
            'instance_id' => $instance_id,
            'name' => $name,
            'email' => $email,
            'message' => $message,
            'status' => 'pending',
            'created_at' => current_time('mysql'),
        ]);
    }
}
```

---

## 9. Tool Call Visualization

### Support for n8n Tool Outputs

```tsx
// src/components/chat/ToolCallDisplay.tsx

import React from 'react';

interface ToolCall {
  id: string;
  name: string;
  arguments: Record<string, unknown>;
}

interface ToolResult {
  tool_call_id: string;
  output: unknown;
  display?: ToolDisplayConfig;
}

interface ToolDisplayConfig {
  type: 'card' | 'table' | 'list' | 'image' | 'link' | 'raw';
  title?: string;
  data: unknown;
}

interface Props {
  toolCall: ToolCall;
  result?: ToolResult;
}

export const ToolCallDisplay: React.FC<Props> = ({ toolCall, result }) => {
  if (!result) {
    // Still executing
    return (
      <div className="flowchat-tool-executing">
        <span className="flowchat-tool-icon">🔧</span>
        <span className="flowchat-tool-name">{formatToolName(toolCall.name)}</span>
        <span className="flowchat-tool-spinner" />
      </div>
    );
  }
  
  const display = result.display || inferDisplay(toolCall.name, result.output);
  
  return (
    <div className="flowchat-tool-result">
      <ToolResultRenderer display={display} />
    </div>
  );
};

const ToolResultRenderer: React.FC<{ display: ToolDisplayConfig }> = ({ display }) => {
  switch (display.type) {
    case 'card':
      return <ToolCard data={display.data as Record<string, unknown>} title={display.title} />;
    case 'table':
      return <ToolTable data={display.data as Record<string, unknown>[]} />;
    case 'list':
      return <ToolList items={display.data as string[]} title={display.title} />;
    case 'image':
      return <ToolImage url={display.data as string} title={display.title} />;
    case 'link':
      return <ToolLink data={display.data as { url: string; text: string }} />;
    default:
      return <ToolRaw data={display.data} />;
  }
};

// Card display for structured data (e.g., order status)
const ToolCard: React.FC<{ data: Record<string, unknown>; title?: string }> = ({ data, title }) => (
  <div className="flowchat-tool-card">
    {title && <h4 className="flowchat-tool-card-title">{title}</h4>}
    <dl className="flowchat-tool-card-content">
      {Object.entries(data).map(([key, value]) => (
        <div key={key} className="flowchat-tool-card-row">
          <dt>{formatKey(key)}</dt>
          <dd>{formatValue(value)}</dd>
        </div>
      ))}
    </dl>
  </div>
);

// Table display for lists of items
const ToolTable: React.FC<{ data: Record<string, unknown>[] }> = ({ data }) => {
  if (!data.length) return null;
  
  const columns = Object.keys(data[0]);
  
  return (
    <table className="flowchat-tool-table">
      <thead>
        <tr>
          {columns.map(col => <th key={col}>{formatKey(col)}</th>)}
        </tr>
      </thead>
      <tbody>
        {data.map((row, i) => (
          <tr key={i}>
            {columns.map(col => <td key={col}>{formatValue(row[col])}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Helper functions
function formatToolName(name: string): string {
  return name
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatKey(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/([A-Z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? '✓' : '✗';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function inferDisplay(toolName: string, output: unknown): ToolDisplayConfig {
  // Try to auto-detect display type based on tool name and output structure
  if (Array.isArray(output)) {
    if (output.length > 0 && typeof output[0] === 'object') {
      return { type: 'table', data: output };
    }
    return { type: 'list', data: output };
  }
  
  if (typeof output === 'object' && output !== null) {
    return { type: 'card', data: output, title: formatToolName(toolName) };
  }
  
  return { type: 'raw', data: output };
}
```

---

## Summary: Files to Update

Based on this addendum, the following specification files need updates:

| File | Updates Needed |
|------|----------------|
| **06-n8n-runtime-adapter.md** | Add streaming fix, Direct-to-n8n mode, JWT auth |
| **02-database-schema.md** | Add JSON type, session_uuid index, metadata column |
| **04-chat-instances-config.md** | Add targeting rules, colorSource option, streamingMode |
| **05-frontend-components.md** | Add file upload flow, tool call visualization, fallback form |
| **03-admin-ui-spec.md** | Add System Prompt Builder, Targeting Rules Editor, Shadow DOM preview |
| **11-error-handling.md** | Add fallback mode, contact form submission |
| **07-api-endpoints.md** | Add JWT token endpoint, fallback contact endpoint |

These changes address all critical issues raised in the review and add the "best-in-class" features needed for a production-ready plugin.
