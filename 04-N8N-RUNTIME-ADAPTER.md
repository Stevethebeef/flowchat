# FlowChat Pro - n8n Runtime Adapter

**Version:** 1.0.0  
**Last Updated:** December 2024  
**Status:** Technical Specification

---

## Overview

The n8n Runtime Adapter is the bridge between assistant-ui's `LocalRuntime` and n8n's Chat Trigger/Webhook nodes. It handles message formatting, streaming responses, session management, and attachment uploads.

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           FlowChatRuntime                                    │
│                    (Wrapper around LocalRuntime)                             │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    N8nModelAdapter                                   │   │
│  │                (ChatModelAdapter implementation)                     │   │
│  │                                                                      │   │
│  │  async *run({ messages, abortSignal, context }) {                   │   │
│  │    // 1. Format request for n8n                                     │   │
│  │    // 2. Add session ID & metadata                                   │   │
│  │    // 3. Send via proxy endpoint                                     │   │
│  │    // 4. Handle streaming or standard response                       │   │
│  │    // 5. Yield chunks to UI                                         │   │
│  │  }                                                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                       Adapters                                        │   │
│  │                                                                       │   │
│  │  ┌───────────────┐ ┌───────────────┐ ┌───────────────┐              │   │
│  │  │ Attachment    │ │ History       │ │ Speech        │              │   │
│  │  │ Adapter       │ │ Adapter       │ │ Adapter       │              │   │
│  │  └───────────────┘ └───────────────┘ └───────────────┘              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## n8n Communication Protocol

### Request Format

The adapter sends requests to the WordPress proxy endpoint, which forwards to n8n:

```typescript
interface N8nRequest {
  // Core message data
  [chatInputKey: string]: string;      // e.g., "chatInput": "Hello"
  [sessionKey: string]: string;        // e.g., "sessionId": "uuid"
  
  // Action type
  action: 'sendMessage' | 'loadPreviousSession';
  
  // WordPress context metadata
  metadata: {
    pageUrl: string;
    pageTitle: string;
    userId?: number;
    userEmail?: string;
    userName?: string;
    timestamp: string;
    timezone: string;
    userAgent: string;
    referrer?: string;
  };
  
  // Attachments (if any)
  attachments?: N8nAttachment[];
}

interface N8nAttachment {
  name: string;
  type: string;
  size: number;
  url?: string;           // For URL-based attachments
  base64?: string;        // For inline attachments
}
```

### Response Format

n8n Chat Trigger returns responses in these formats:

#### Standard Response
```typescript
interface N8nStandardResponse {
  output: string;           // The text response
  sessionId?: string;       // Session ID for continuity
}
```

#### Streaming Response (SSE)
```
data: {"output": "Hello"}
data: {"output": "Hello, how"}
data: {"output": "Hello, how can"}
data: {"output": "Hello, how can I help?"}
data: [DONE]
```

---

## Complete Implementation

### n8n Model Adapter

```typescript
// src/chat/runtime/n8n-adapter.ts

import type { 
  ChatModelAdapter, 
  ChatModelRunOptions,
  ChatModelRunResult 
} from '@assistant-ui/react';

export interface N8nAdapterConfig {
  // Proxy endpoint (WordPress AJAX)
  proxyUrl: string;
  
  // n8n keys
  chatInputKey: string;
  sessionKey: string;
  
  // Features
  streaming: boolean;
  timeout: number;
  
  // Authentication (handled server-side, but need for headers)
  nonce: string;
  configId: string;
  
  // Metadata
  metadata: {
    pageUrl: string;
    pageTitle: string;
    userId?: number;
    userEmail?: string;
    userName?: string;
  };
}

export function createN8nAdapter(config: N8nAdapterConfig): ChatModelAdapter {
  return {
    async *run({ messages, abortSignal, context }: ChatModelRunOptions) {
      const sessionId = getOrCreateSessionId(config.configId);
      
      // Get the last user message
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || lastMessage.role !== 'user') {
        throw new Error('Expected user message');
      }
      
      // Extract text content
      const textContent = lastMessage.content
        .filter(part => part.type === 'text')
        .map(part => part.text)
        .join('\n');
      
      // Extract attachments
      const attachments = lastMessage.content
        .filter(part => part.type === 'image' || part.type === 'file')
        .map(part => ({
          name: (part as any).name || 'attachment',
          type: (part as any).mimeType || 'application/octet-stream',
          url: (part as any).url,
        }));
      
      // Build request body
      const requestBody = {
        [config.chatInputKey]: textContent,
        [config.sessionKey]: sessionId,
        action: 'sendMessage',
        metadata: {
          ...config.metadata,
          timestamp: new Date().toISOString(),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          userAgent: navigator.userAgent,
          referrer: document.referrer || undefined,
        },
        attachments: attachments.length > 0 ? attachments : undefined,
        configId: config.configId,
        _nonce: config.nonce,
      };
      
      if (config.streaming) {
        // Streaming response
        yield* handleStreamingResponse(config, requestBody, abortSignal);
      } else {
        // Standard response
        yield await handleStandardResponse(config, requestBody, abortSignal);
      }
    },
  };
}

/**
 * Handle streaming SSE response
 */
async function* handleStreamingResponse(
  config: N8nAdapterConfig,
  body: Record<string, any>,
  abortSignal: AbortSignal
): AsyncGenerator<ChatModelRunResult> {
  const response = await fetch(config.proxyUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ...body, streaming: true }),
    signal: abortSignal,
  });
  
  if (!response.ok) {
    throw new N8nError(
      `Request failed: ${response.statusText}`,
      response.status
    );
  }
  
  const reader = response.body?.getReader();
  if (!reader) {
    throw new N8nError('No response body', 500);
  }
  
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  
  try {
    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;
      
      buffer += decoder.decode(value, { stream: true });
      
      // Process complete lines
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            break;
          }
          
          try {
            const parsed = JSON.parse(data);
            
            // n8n sends cumulative output
            if (parsed.output) {
              fullText = parsed.output;
              
              yield {
                content: [{ type: 'text', text: fullText }],
              };
            }
          } catch (e) {
            // If not JSON, treat as raw text chunk
            fullText += data;
            
            yield {
              content: [{ type: 'text', text: fullText }],
            };
          }
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
  
  // Final yield with complete content
  if (fullText) {
    yield {
      content: [{ type: 'text', text: fullText }],
    };
  }
}

/**
 * Handle standard (non-streaming) response
 */
async function handleStandardResponse(
  config: N8nAdapterConfig,
  body: Record<string, any>,
  abortSignal: AbortSignal
): Promise<ChatModelRunResult> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout * 1000);
  
  // Combine signals
  const combinedSignal = abortSignal 
    ? combineAbortSignals([abortSignal, controller.signal])
    : controller.signal;
  
  try {
    const response = await fetch(config.proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
      signal: combinedSignal,
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      const errorBody = await response.text();
      throw new N8nError(
        `Request failed: ${response.statusText}`,
        response.status,
        errorBody
      );
    }
    
    const data = await response.json();
    
    return {
      content: [{ type: 'text', text: data.output || '' }],
    };
    
  } catch (error) {
    clearTimeout(timeoutId);
    
    if ((error as Error).name === 'AbortError') {
      if (abortSignal?.aborted) {
        throw error; // User cancelled
      }
      throw new N8nError('Request timed out', 408);
    }
    
    throw error;
  }
}

/**
 * Session ID management
 */
function getOrCreateSessionId(configId: string): string {
  const storageKey = `flowchat_session_${configId}`;
  let sessionId = localStorage.getItem(storageKey);
  
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    localStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

/**
 * Clear session (for new conversation)
 */
export function clearSession(configId: string): void {
  const storageKey = `flowchat_session_${configId}`;
  localStorage.removeItem(storageKey);
}

/**
 * Custom error class for n8n errors
 */
export class N8nError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'N8nError';
  }
  
  isTimeout(): boolean {
    return this.statusCode === 408;
  }
  
  isRateLimit(): boolean {
    return this.statusCode === 429;
  }
  
  isServerError(): boolean {
    return this.statusCode >= 500;
  }
}

/**
 * Utility to combine abort signals
 */
function combineAbortSignals(signals: AbortSignal[]): AbortSignal {
  const controller = new AbortController();
  
  for (const signal of signals) {
    if (signal.aborted) {
      controller.abort(signal.reason);
      break;
    }
    signal.addEventListener('abort', () => {
      controller.abort(signal.reason);
    }, { once: true });
  }
  
  return controller.signal;
}
```

### FlowChat Runtime Provider

```typescript
// src/chat/runtime/FlowChatRuntime.tsx

import React, { useMemo, type ReactNode } from 'react';
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  type AttachmentAdapter,
  type SpeechSynthesisAdapter,
  type ThreadHistoryAdapter,
} from '@assistant-ui/react';
import { createN8nAdapter, type N8nAdapterConfig } from './n8n-adapter';

export interface FlowChatRuntimeProps {
  config: FlowChatConfig;
  children: ReactNode;
}

export function FlowChatRuntime({ config, children }: FlowChatRuntimeProps) {
  // Create n8n adapter with config
  const n8nAdapter = useMemo(() => {
    return createN8nAdapter({
      proxyUrl: config.context.ajaxUrl,
      chatInputKey: config.chatInputKey,
      sessionKey: config.sessionKey,
      streaming: config.streaming,
      timeout: config.timeout,
      nonce: config.context.nonce,
      configId: String(config.id),
      metadata: {
        pageUrl: config.context.pageUrl,
        pageTitle: config.context.pageTitle,
        userId: config.context.userId,
        userEmail: config.context.userEmail,
        userName: config.context.userName,
      },
    });
  }, [config]);
  
  // Create adapters
  const adapters = useMemo(() => {
    const result: Record<string, any> = {};
    
    // Attachment adapter
    if (config.messages.attachments.enabled) {
      result.attachments = createAttachmentAdapter(config);
    }
    
    // Speech adapter
    if (config.features.speech.textToSpeech) {
      result.speech = createSpeechAdapter();
    }
    
    // History adapter
    if (config.features.history.enabled) {
      result.history = createHistoryAdapter(config);
    }
    
    return result;
  }, [config]);
  
  // Create runtime
  const runtime = useLocalRuntime(n8nAdapter, { adapters });
  
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      {children}
    </AssistantRuntimeProvider>
  );
}

/**
 * Attachment adapter for file uploads
 */
function createAttachmentAdapter(config: FlowChatConfig): AttachmentAdapter {
  const { attachments } = config.messages;
  
  return {
    accept: attachments.allowedTypes.join(','),
    
    async add(file: File) {
      // Validate file size
      if (file.size > attachments.maxFileSize * 1024 * 1024) {
        throw new Error(`File too large. Maximum size is ${attachments.maxFileSize}MB`);
      }
      
      // Upload to WordPress
      const formData = new FormData();
      formData.append('file', file);
      formData.append('action', 'flowchat_upload');
      formData.append('_nonce', config.context.nonce);
      formData.append('config_id', String(config.id));
      
      const response = await fetch(config.context.ajaxUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Upload failed');
      }
      
      const data = await response.json();
      
      return {
        id: data.id,
        type: file.type.startsWith('image/') ? 'image' : 'document',
        name: file.name,
        url: data.url,
        file,
      };
    },
    
    async remove(attachment) {
      await fetch(config.context.ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'flowchat_delete_attachment',
          _nonce: config.context.nonce,
          attachment_id: attachment.id,
        }),
      });
    },
  };
}

/**
 * Speech synthesis adapter
 */
function createSpeechAdapter(): SpeechSynthesisAdapter {
  return {
    speak(text: string) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      speechSynthesis.speak(utterance);
      
      return {
        stop: () => speechSynthesis.cancel(),
      };
    },
  };
}

/**
 * History adapter for chat persistence
 */
function createHistoryAdapter(config: FlowChatConfig): ThreadHistoryAdapter {
  const { history } = config.features;
  const storageKey = `flowchat_history_${config.id}`;
  
  return {
    async load() {
      if (history.storageType === 'local' || history.storageType === 'session') {
        const storage = history.storageType === 'local' 
          ? localStorage 
          : sessionStorage;
        
        const stored = storage.getItem(storageKey);
        if (!stored) {
          return { messages: [] };
        }
        
        try {
          const messages = JSON.parse(stored);
          return { 
            messages: messages.slice(-history.maxMessages) 
          };
        } catch {
          return { messages: [] };
        }
      }
      
      if (history.storageType === 'server') {
        const response = await fetch(config.context.ajaxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'flowchat_load_history',
            _nonce: config.context.nonce,
            config_id: config.id,
            session_id: localStorage.getItem(`flowchat_session_${config.id}`),
          }),
        });
        
        if (!response.ok) {
          return { messages: [] };
        }
        
        const data = await response.json();
        return { messages: data.messages || [] };
      }
      
      // n8n storage - let n8n handle it
      return { messages: [] };
    },
    
    async append(message) {
      if (history.storageType === 'local' || history.storageType === 'session') {
        const storage = history.storageType === 'local' 
          ? localStorage 
          : sessionStorage;
        
        const stored = storage.getItem(storageKey);
        const messages = stored ? JSON.parse(stored) : [];
        
        messages.push({
          role: message.role,
          content: message.content,
          id: message.id,
          createdAt: message.createdAt?.toISOString(),
        });
        
        // Keep only last N messages
        const trimmed = messages.slice(-history.maxMessages);
        storage.setItem(storageKey, JSON.stringify(trimmed));
      }
      
      if (history.storageType === 'server') {
        await fetch(config.context.ajaxUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'flowchat_save_message',
            _nonce: config.context.nonce,
            config_id: config.id,
            session_id: localStorage.getItem(`flowchat_session_${config.id}`),
            message: {
              role: message.role,
              content: message.content,
              id: message.id,
              createdAt: message.createdAt?.toISOString(),
            },
          }),
        });
      }
    },
  };
}
```

---

## WordPress Proxy Endpoint

```php
<?php
/**
 * Proxy endpoint for n8n communication
 * Keeps API credentials server-side
 */

add_action('wp_ajax_flowchat_chat', 'flowchat_handle_chat');
add_action('wp_ajax_nopriv_flowchat_chat', 'flowchat_handle_chat');

function flowchat_handle_chat() {
    // Verify nonce
    if (!wp_verify_nonce($_POST['_nonce'] ?? '', 'flowchat_chat')) {
        wp_send_json_error(['message' => 'Invalid nonce'], 403);
    }
    
    // Get configuration
    $config_id = absint($_POST['configId'] ?? 0);
    $config = \FlowChat\Config::get($config_id);
    
    if (!$config) {
        wp_send_json_error(['message' => 'Configuration not found'], 404);
    }
    
    // Check if configuration is active
    if ($config['status'] !== 'active') {
        wp_send_json_error(['message' => 'Chat is not active'], 403);
    }
    
    // Check display rules
    if (!flowchat_check_display_rules($config)) {
        wp_send_json_error(['message' => 'Chat not available'], 403);
    }
    
    // Build request body
    $body = [
        $config['connection']['chatInputKey'] => sanitize_textarea_field($_POST[$config['connection']['chatInputKey']] ?? ''),
        $config['connection']['sessionKey'] => sanitize_text_field($_POST[$config['connection']['sessionKey']] ?? ''),
        'action' => sanitize_text_field($_POST['action'] ?? 'sendMessage'),
    ];
    
    // Add metadata if enabled
    if (!empty($_POST['metadata'])) {
        $body['metadata'] = array_map('sanitize_text_field', $_POST['metadata']);
    }
    
    // Add attachments if present
    if (!empty($_POST['attachments'])) {
        $body['attachments'] = flowchat_sanitize_attachments($_POST['attachments']);
    }
    
    // Build headers
    $headers = [
        'Content-Type' => 'application/json',
    ];
    
    // Add authentication
    $auth_type = $config['connection']['authType'] ?? 'none';
    
    if ($auth_type === 'basic') {
        $credentials = $config['connection']['authCredentials'] ?? [];
        $username = $credentials['username'] ?? '';
        $password = flowchat_decrypt($credentials['password'] ?? '');
        $headers['Authorization'] = 'Basic ' . base64_encode("$username:$password");
    } elseif ($auth_type === 'bearer') {
        $credentials = $config['connection']['authCredentials'] ?? [];
        $token = flowchat_decrypt($credentials['token'] ?? '');
        $headers['Authorization'] = 'Bearer ' . $token;
    }
    
    // Add custom headers
    if (!empty($config['connection']['customHeaders'])) {
        foreach ($config['connection']['customHeaders'] as $key => $value) {
            $headers[sanitize_text_field($key)] = sanitize_text_field($value);
        }
    }
    
    // Check if streaming is requested and enabled
    $streaming = !empty($_POST['streaming']) && $config['connection']['streaming'];
    
    if ($streaming) {
        flowchat_handle_streaming_request($config, $body, $headers);
    } else {
        flowchat_handle_standard_request($config, $body, $headers);
    }
}

/**
 * Handle standard (non-streaming) request
 */
function flowchat_handle_standard_request($config, $body, $headers) {
    $timeout = $config['connection']['timeout'] ?? 30;
    
    $response = wp_remote_post(
        $config['connection']['webhookUrl'],
        [
            'headers' => $headers,
            'body' => wp_json_encode($body),
            'timeout' => $timeout,
            'sslverify' => true,
        ]
    );
    
    if (is_wp_error($response)) {
        wp_send_json_error([
            'message' => $response->get_error_message(),
        ], 502);
    }
    
    $status_code = wp_remote_retrieve_response_code($response);
    $response_body = wp_remote_retrieve_body($response);
    
    if ($status_code >= 400) {
        wp_send_json_error([
            'message' => 'n8n returned an error',
            'status' => $status_code,
        ], $status_code);
    }
    
    // Parse and return response
    $data = json_decode($response_body, true);
    
    wp_send_json_success([
        'output' => $data['output'] ?? '',
        'sessionId' => $data['sessionId'] ?? null,
    ]);
}

/**
 * Handle streaming request
 */
function flowchat_handle_streaming_request($config, $body, $headers) {
    // Set headers for SSE
    header('Content-Type: text/event-stream');
    header('Cache-Control: no-cache');
    header('Connection: keep-alive');
    header('X-Accel-Buffering: no'); // Disable nginx buffering
    
    // Disable output buffering
    while (ob_get_level()) {
        ob_end_flush();
    }
    
    // Initialize cURL for streaming
    $ch = curl_init($config['connection']['webhookUrl']);
    
    curl_setopt_array($ch, [
        CURLOPT_POST => true,
        CURLOPT_POSTFIELDS => wp_json_encode($body),
        CURLOPT_HTTPHEADER => array_map(
            fn($k, $v) => "$k: $v",
            array_keys($headers),
            array_values($headers)
        ),
        CURLOPT_RETURNTRANSFER => false,
        CURLOPT_TIMEOUT => $config['connection']['timeout'] ?? 30,
        CURLOPT_SSL_VERIFYPEER => true,
        CURLOPT_WRITEFUNCTION => function($ch, $data) {
            // Forward each chunk to client
            echo $data;
            flush();
            return strlen($data);
        },
    ]);
    
    $result = curl_exec($ch);
    $error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    
    curl_close($ch);
    
    if ($error) {
        echo "data: " . wp_json_encode(['error' => $error]) . "\n\n";
    }
    
    echo "data: [DONE]\n\n";
    flush();
    exit;
}

/**
 * Sanitize attachments array
 */
function flowchat_sanitize_attachments($attachments) {
    if (!is_array($attachments)) {
        return [];
    }
    
    return array_map(function($attachment) {
        return [
            'name' => sanitize_file_name($attachment['name'] ?? ''),
            'type' => sanitize_mime_type($attachment['type'] ?? ''),
            'size' => absint($attachment['size'] ?? 0),
            'url' => esc_url_raw($attachment['url'] ?? ''),
        ];
    }, $attachments);
}

/**
 * Check display rules
 */
function flowchat_check_display_rules($config) {
    $rules = $config['rules'] ?? null;
    
    if (!$rules) {
        return true; // No rules = always show
    }
    
    // Check page rules
    if (!empty($rules['pages'])) {
        $current_url = home_url($_SERVER['REQUEST_URI']);
        
        if ($rules['pages']['mode'] === 'include') {
            $matches = false;
            foreach ($rules['pages']['rules'] as $rule) {
                if (flowchat_check_page_rule($rule, $current_url)) {
                    $matches = true;
                    break;
                }
            }
            if (!$matches) return false;
        } elseif ($rules['pages']['mode'] === 'exclude') {
            foreach ($rules['pages']['rules'] as $rule) {
                if (flowchat_check_page_rule($rule, $current_url)) {
                    return false;
                }
            }
        }
    }
    
    // Check user rules
    if (!empty($rules['users'])) {
        $is_logged_in = is_user_logged_in();
        
        if (!$is_logged_in && empty($rules['users']['showToLoggedOut'])) {
            return false;
        }
        
        if ($is_logged_in) {
            if (empty($rules['users']['showToLoggedIn'])) {
                return false;
            }
            
            // Check roles
            if (!empty($rules['users']['roles'])) {
                $user = wp_get_current_user();
                $user_roles = $user->roles;
                $allowed_roles = $rules['users']['roles'];
                
                if (empty(array_intersect($user_roles, $allowed_roles))) {
                    return false;
                }
            }
        }
    }
    
    // Check schedule
    if (!empty($rules['schedule']) && $rules['schedule']['enabled']) {
        $now = new DateTime('now', new DateTimeZone($rules['schedule']['timezone'] ?? 'UTC'));
        $current_time = $now->format('H:i');
        $current_day = (int) $now->format('w');
        
        if (!in_array($current_day, $rules['schedule']['days'] ?? [])) {
            return false;
        }
        
        if ($current_time < $rules['schedule']['hours']['start'] ||
            $current_time > $rules['schedule']['hours']['end']) {
            return false;
        }
    }
    
    return true;
}

/**
 * Check individual page rule
 */
function flowchat_check_page_rule($rule, $url) {
    switch ($rule['type']) {
        case 'url_contains':
            return strpos($url, $rule['value']) !== false;
            
        case 'url_equals':
            return $url === $rule['value'];
            
        case 'url_starts':
            return strpos($url, $rule['value']) === 0;
            
        case 'url_ends':
            return substr($url, -strlen($rule['value'])) === $rule['value'];
            
        case 'url_regex':
            return preg_match($rule['value'], $url) === 1;
            
        case 'page_id':
            return get_queried_object_id() == $rule['value'];
            
        case 'post_type':
            return get_post_type() === $rule['value'];
            
        default:
            return false;
    }
}
```

---

## Error Handling

### Error Types

| Error Code | Type | User Message |
|------------|------|--------------|
| 408 | Timeout | `timeoutError` from config |
| 429 | Rate Limit | `rateLimitError` from config |
| 502/503 | Server Error | `connectionError` from config |
| Network | Offline | `connectionError` from config |

### Error Recovery

```typescript
// src/chat/runtime/error-handler.ts

export function handleN8nError(
  error: unknown,
  config: MessagesConfig
): string {
  if (error instanceof N8nError) {
    if (error.isTimeout()) {
      return config.system.timeoutError;
    }
    if (error.isRateLimit()) {
      return config.system.rateLimitError;
    }
    if (error.isServerError()) {
      return config.system.connectionError;
    }
  }
  
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return config.system.connectionError;
  }
  
  return config.system.connectionError;
}
```

---

## Testing Connection

```typescript
// src/chat/runtime/connection-test.ts

export interface ConnectionTestResult {
  success: boolean;
  responseTime?: number;
  error?: string;
  details?: {
    streaming: boolean;
    version?: string;
  };
}

export async function testN8nConnection(
  config: N8nAdapterConfig
): Promise<ConnectionTestResult> {
  const startTime = performance.now();
  
  try {
    const response = await fetch(config.proxyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'testConnection',
        configId: config.configId,
        _nonce: config.nonce,
      }),
      signal: AbortSignal.timeout(10000), // 10 second timeout
    });
    
    const responseTime = Math.round(performance.now() - startTime);
    
    if (!response.ok) {
      return {
        success: false,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }
    
    const data = await response.json();
    
    return {
      success: true,
      responseTime,
      details: {
        streaming: config.streaming,
      },
    };
    
  } catch (error) {
    const responseTime = Math.round(performance.now() - startTime);
    
    return {
      success: false,
      responseTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

---

## Next Document

→ **05-REACT-COMPONENTS.md** - React component specifications
