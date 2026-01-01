# FlowChat - n8n Runtime Adapter Specification

## Overview

The n8n Runtime Adapter is a custom implementation of assistant-ui's runtime interface that connects the React chat frontend to n8n's Chat Trigger node. This adapter handles all communication, streaming, message transformation, and error handling between WordPress and n8n.

---

## 1. Runtime Architecture

### 1.1 Core Concepts

```
┌─────────────────────────────────────────────────────────────────┐
│                     assistant-ui Framework                       │
├─────────────────────────────────────────────────────────────────┤
│  AssistantRuntimeProvider                                        │
│  ├── useThread() - message thread state                         │
│  ├── useComposer() - input composition                          │
│  ├── useAssistantRuntime() - runtime control                    │
│  └── Components (Thread, Composer, etc.)                        │
├─────────────────────────────────────────────────────────────────┤
│                     n8nChatRuntime (Custom)                      │
│  ├── Implements ExternalStoreRuntime interface                  │
│  ├── Manages connection to n8n webhook                          │
│  ├── Handles SSE streaming                                       │
│  └── Transforms messages between formats                        │
├─────────────────────────────────────────────────────────────────┤
│                     n8n Chat Trigger                             │
│  ├── Receives HTTP POST with message                            │
│  ├── Returns streaming SSE response                             │
│  └── Supports session management                                │
└─────────────────────────────────────────────────────────────────┘
```

### 1.2 Why Custom Runtime?

assistant-ui provides several built-in runtimes (OpenAI, Vercel AI SDK), but n8n requires a custom implementation because:

1. **Unique Endpoint Structure**: n8n Chat Trigger has specific request/response formats
2. **Custom Authentication**: WordPress user context must be passed through
3. **Session Management**: n8n uses sessionId for conversation continuity
4. **Streaming Protocol**: n8n's SSE format differs from standard implementations
5. **Error Handling**: Custom error recovery and retry logic needed

---

## 2. Runtime Implementation

### 2.1 Type Definitions

```typescript
// types/n8n-runtime.ts

/**
 * Configuration for an n8n Chat Trigger endpoint
 */
interface N8nEndpointConfig {
  /** Webhook URL from n8n Chat Trigger node */
  webhookUrl: string;
  
  /** Enable streaming responses (SSE) */
  streaming: boolean;
  
  /** Request timeout in milliseconds */
  timeout: number;
  
  /** Authentication method */
  authentication: {
    enabled: boolean;
    type: 'none' | 'basic' | 'header' | 'jwt';
    credentials?: {
      username?: string;
      password?: string;
      headerName?: string;
      headerValue?: string;
      jwtToken?: string;
    };
  };
  
  /** WordPress user context to include */
  includeUserContext: boolean;
  
  /** Custom headers to send with requests */
  customHeaders?: Record<string, string>;
}

/**
 * WordPress context passed to n8n
 */
interface WordPressContext {
  user: {
    id: number;
    email: string;
    displayName: string;
    roles: string[];
    isLoggedIn: boolean;
  };
  page: {
    id: number;
    title: string;
    url: string;
    postType: string;
  };
  site: {
    name: string;
    url: string;
    language: string;
  };
  instance: {
    id: string;
    name: string;
  };
}

/**
 * Message format for n8n Chat Trigger
 */
interface N8nChatMessage {
  /** Message content */
  text: string;
  
  /** Sender type */
  sender: 'user' | 'bot';
  
  /** Timestamp */
  timestamp: string;
  
  /** Optional attachments */
  files?: N8nFileAttachment[];
}

interface N8nFileAttachment {
  name: string;
  mimeType: string;
  data: string; // base64 encoded
  size: number;
}

/**
 * Request payload to n8n Chat Trigger
 */
interface N8nChatRequest {
  /** The user's message */
  chatInput: string;
  
  /** Session identifier for conversation continuity */
  sessionId: string;
  
  /** WordPress context */
  context?: WordPressContext;
  
  /** Attached files */
  files?: N8nFileAttachment[];
  
  /** Action type */
  action: 'sendMessage' | 'loadPreviousSession';
}

/**
 * Response from n8n Chat Trigger (non-streaming)
 */
interface N8nChatResponse {
  /** Bot's response text */
  output: string;
  
  /** Session ID for continuity */
  sessionId: string;
  
  /** Optional structured data */
  data?: Record<string, unknown>;
  
  /** Execution ID for debugging */
  executionId?: string;
}

/**
 * SSE event from n8n streaming response
 */
interface N8nStreamEvent {
  event: 'token' | 'start' | 'end' | 'error' | 'metadata';
  data: string | {
    token?: string;
    error?: string;
    sessionId?: string;
    executionId?: string;
  };
}

/**
 * Runtime state
 */
interface N8nRuntimeState {
  status: 'idle' | 'connecting' | 'streaming' | 'error';
  sessionId: string | null;
  lastError: Error | null;
  retryCount: number;
}
```

### 2.2 Core Runtime Class

```typescript
// runtime/n8n-chat-runtime.ts

import {
  type ThreadMessage,
  type ThreadState,
  type RuntimeCapabilities,
  type Unsubscribe,
  type ExternalStoreRuntime,
} from '@assistant-ui/react';

export class N8nChatRuntime implements ExternalStoreRuntime {
  private config: N8nEndpointConfig;
  private wpContext: WordPressContext;
  private state: N8nRuntimeState;
  private messages: ThreadMessage[] = [];
  private subscribers: Set<() => void> = new Set();
  private abortController: AbortController | null = null;
  
  constructor(config: N8nEndpointConfig, wpContext: WordPressContext) {
    this.config = config;
    this.wpContext = wpContext;
    this.state = {
      status: 'idle',
      sessionId: this.loadOrCreateSessionId(),
      lastError: null,
      retryCount: 0,
    };
  }
  
  // ═══════════════════════════════════════════════════════════
  // ExternalStoreRuntime Interface Implementation
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Runtime capabilities
   */
  get capabilities(): RuntimeCapabilities {
    return {
      switchToBranch: false,
      edit: false,
      reload: true,
      cancel: true,
      unstable_copy: true,
      speech: false, // Could enable if n8n supports TTS
      attachments: this.config.authentication.enabled, // Only if authenticated
      feedback: false,
    };
  }
  
  /**
   * Current thread state
   */
  getState(): ThreadState {
    return {
      messages: this.messages,
      isRunning: this.state.status === 'streaming',
    };
  }
  
  /**
   * Subscribe to state changes
   */
  subscribe(callback: () => void): Unsubscribe {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }
  
  /**
   * Send a message to n8n
   */
  async append(message: { 
    role: 'user'; 
    content: Array<{ type: 'text'; text: string } | { type: 'file'; file: File }>;
  }): Promise<void> {
    // Extract text content
    const textContent = message.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map(c => c.text)
      .join('\n');
    
    // Extract file attachments
    const files = await Promise.all(
      message.content
        .filter((c): c is { type: 'file'; file: File } => c.type === 'file')
        .map(c => this.processFileAttachment(c.file))
    );
    
    // Add user message to thread
    const userMessage = this.createUserMessage(textContent, files);
    this.messages = [...this.messages, userMessage];
    this.notifySubscribers();
    
    // Send to n8n
    await this.sendToN8n(textContent, files);
  }
  
  /**
   * Cancel ongoing request
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
    this.state.status = 'idle';
    this.notifySubscribers();
  }
  
  /**
   * Reload last message (retry)
   */
  async reload(): Promise<void> {
    // Find last user message
    const lastUserMessage = [...this.messages]
      .reverse()
      .find(m => m.role === 'user');
    
    if (!lastUserMessage) return;
    
    // Remove last assistant message if incomplete
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.status?.type !== 'complete') {
      this.messages = this.messages.slice(0, -1);
    }
    
    // Extract text from last user message
    const text = lastUserMessage.content
      .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
      .map(c => c.text)
      .join('\n');
    
    // Resend
    await this.sendToN8n(text, []);
  }
  
  // ═══════════════════════════════════════════════════════════
  // n8n Communication
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Send message to n8n Chat Trigger
   */
  private async sendToN8n(text: string, files: N8nFileAttachment[]): Promise<void> {
    this.state.status = 'connecting';
    this.state.lastError = null;
    this.notifySubscribers();
    
    // Create abort controller for cancellation
    this.abortController = new AbortController();
    
    // Build request payload
    const payload: N8nChatRequest = {
      chatInput: text,
      sessionId: this.state.sessionId!,
      action: 'sendMessage',
      ...(this.config.includeUserContext && { context: this.wpContext }),
      ...(files.length > 0 && { files }),
    };
    
    try {
      if (this.config.streaming) {
        await this.sendStreamingRequest(payload);
      } else {
        await this.sendStandardRequest(payload);
      }
      
      this.state.retryCount = 0;
    } catch (error) {
      this.handleError(error as Error);
    } finally {
      this.abortController = null;
    }
  }
  
  /**
   * Send streaming request (SSE)
   */
  private async sendStreamingRequest(payload: N8nChatRequest): Promise<void> {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers: this.buildHeaders(),
      body: JSON.stringify(payload),
      signal: this.abortController!.signal,
    });
    
    if (!response.ok) {
      throw new N8nApiError(response.status, await response.text());
    }
    
    // Create placeholder assistant message
    const assistantMessage = this.createAssistantMessage('');
    this.messages = [...this.messages, assistantMessage];
    this.state.status = 'streaming';
    this.notifySubscribers();
    
    // Process SSE stream
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let fullContent = '';
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const events = this.parseSSEBuffer(buffer);
        buffer = events.remainder;
        
        for (const event of events.events) {
          const result = this.processStreamEvent(event);
          if (result.token) {
            fullContent += result.token;
            this.updateAssistantMessage(assistantMessage.id, fullContent);
          }
          if (result.sessionId) {
            this.state.sessionId = result.sessionId;
            this.saveSessionId();
          }
        }
      }
      
      // Mark message as complete
      this.completeAssistantMessage(assistantMessage.id, fullContent);
      this.state.status = 'idle';
      this.notifySubscribers();
      
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        this.markMessageCancelled(assistantMessage.id);
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Send standard (non-streaming) request
   */
  private async sendStandardRequest(payload: N8nChatRequest): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);
    
    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new N8nApiError(response.status, await response.text());
      }
      
      const data: N8nChatResponse = await response.json();
      
      // Update session ID if provided
      if (data.sessionId) {
        this.state.sessionId = data.sessionId;
        this.saveSessionId();
      }
      
      // Add complete assistant message
      const assistantMessage = this.createAssistantMessage(data.output, 'complete');
      this.messages = [...this.messages, assistantMessage];
      this.state.status = 'idle';
      this.notifySubscribers();
      
    } finally {
      clearTimeout(timeoutId);
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // SSE Parsing
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Parse SSE buffer into events
   */
  private parseSSEBuffer(buffer: string): { 
    events: N8nStreamEvent[]; 
    remainder: string;
  } {
    const events: N8nStreamEvent[] = [];
    const lines = buffer.split('\n');
    let currentEvent: Partial<N8nStreamEvent> = {};
    let remainder = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      
      // Check if this might be an incomplete line at the end
      if (i === lines.length - 1 && line !== '') {
        remainder = line;
        continue;
      }
      
      if (line === '') {
        // Empty line = event complete
        if (currentEvent.event && currentEvent.data !== undefined) {
          events.push(currentEvent as N8nStreamEvent);
        }
        currentEvent = {};
      } else if (line.startsWith('event:')) {
        currentEvent.event = line.slice(6).trim() as N8nStreamEvent['event'];
      } else if (line.startsWith('data:')) {
        const dataStr = line.slice(5).trim();
        try {
          currentEvent.data = JSON.parse(dataStr);
        } catch {
          currentEvent.data = dataStr;
        }
      }
    }
    
    return { events, remainder };
  }
  
  /**
   * Process a single SSE event
   */
  private processStreamEvent(event: N8nStreamEvent): {
    token?: string;
    sessionId?: string;
    complete?: boolean;
    error?: Error;
  } {
    switch (event.event) {
      case 'token':
        const tokenData = typeof event.data === 'string' 
          ? event.data 
          : event.data.token || '';
        return { token: tokenData };
        
      case 'start':
        return {}; // Streaming started
        
      case 'end':
        return { complete: true };
        
      case 'metadata':
        if (typeof event.data === 'object' && event.data.sessionId) {
          return { sessionId: event.data.sessionId };
        }
        return {};
        
      case 'error':
        const errorMsg = typeof event.data === 'string'
          ? event.data
          : event.data.error || 'Unknown streaming error';
        return { error: new Error(errorMsg) };
        
      default:
        return {};
    }
  }
  
  // ═══════════════════════════════════════════════════════════
  // Message Management
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Create a user message object
   */
  private createUserMessage(
    text: string, 
    files: N8nFileAttachment[]
  ): ThreadMessage {
    const content: ThreadMessage['content'] = [
      { type: 'text', text }
    ];
    
    // Add file attachments
    for (const file of files) {
      if (file.mimeType.startsWith('image/')) {
        content.push({
          type: 'image',
          image: `data:${file.mimeType};base64,${file.data}`,
        });
      }
    }
    
    return {
      id: this.generateMessageId(),
      role: 'user',
      content,
      createdAt: new Date(),
    };
  }
  
  /**
   * Create an assistant message object
   */
  private createAssistantMessage(
    text: string,
    status: 'running' | 'complete' = 'running'
  ): ThreadMessage {
    return {
      id: this.generateMessageId(),
      role: 'assistant',
      content: text ? [{ type: 'text', text }] : [],
      createdAt: new Date(),
      status: {
        type: status === 'running' ? 'running' : 'complete',
      },
    };
  }
  
  /**
   * Update assistant message content during streaming
   */
  private updateAssistantMessage(id: string, content: string): void {
    this.messages = this.messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          content: [{ type: 'text', text: content }],
        };
      }
      return msg;
    });
    this.notifySubscribers();
  }
  
  /**
   * Mark assistant message as complete
   */
  private completeAssistantMessage(id: string, content: string): void {
    this.messages = this.messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          content: [{ type: 'text', text: content }],
          status: { type: 'complete' },
        };
      }
      return msg;
    });
  }
  
  /**
   * Mark message as cancelled
   */
  private markMessageCancelled(id: string): void {
    this.messages = this.messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          status: { type: 'cancelled' },
        };
      }
      return msg;
    });
    this.state.status = 'idle';
    this.notifySubscribers();
  }
  
  // ═══════════════════════════════════════════════════════════
  // Session Management
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Load existing session ID or create new one
   */
  private loadOrCreateSessionId(): string {
    const storageKey = `flowchat_session_${this.wpContext.instance.id}`;
    
    // Try to load from storage
    const stored = sessionStorage.getItem(storageKey);
    if (stored) {
      return stored;
    }
    
    // For logged-in users, try localStorage for persistence
    if (this.wpContext.user.isLoggedIn) {
      const persistent = localStorage.getItem(storageKey);
      if (persistent) {
        return persistent;
      }
    }
    
    // Generate new session ID
    return this.generateSessionId();
  }
  
  /**
   * Save session ID to storage
   */
  private saveSessionId(): void {
    const storageKey = `flowchat_session_${this.wpContext.instance.id}`;
    
    if (this.state.sessionId) {
      sessionStorage.setItem(storageKey, this.state.sessionId);
      
      // Persist for logged-in users
      if (this.wpContext.user.isLoggedIn) {
        localStorage.setItem(storageKey, this.state.sessionId);
      }
    }
  }
  
  /**
   * Generate a new session ID
   */
  private generateSessionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 10);
    const userPart = this.wpContext.user.isLoggedIn 
      ? `u${this.wpContext.user.id}` 
      : 'anon';
    return `${userPart}_${timestamp}_${random}`;
  }
  
  /**
   * Generate a message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }
  
  /**
   * Clear session (start fresh conversation)
   */
  public clearSession(): void {
    const storageKey = `flowchat_session_${this.wpContext.instance.id}`;
    sessionStorage.removeItem(storageKey);
    localStorage.removeItem(storageKey);
    
    this.state.sessionId = this.generateSessionId();
    this.messages = [];
    this.notifySubscribers();
  }
  
  // ═══════════════════════════════════════════════════════════
  // Helpers
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Build request headers
   */
  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': this.config.streaming 
        ? 'text/event-stream' 
        : 'application/json',
    };
    
    // Add authentication
    const auth = this.config.authentication;
    if (auth.enabled && auth.credentials) {
      switch (auth.type) {
        case 'basic':
          const basicAuth = btoa(
            `${auth.credentials.username}:${auth.credentials.password}`
          );
          headers['Authorization'] = `Basic ${basicAuth}`;
          break;
          
        case 'header':
          if (auth.credentials.headerName && auth.credentials.headerValue) {
            headers[auth.credentials.headerName] = auth.credentials.headerValue;
          }
          break;
          
        case 'jwt':
          if (auth.credentials.jwtToken) {
            headers['Authorization'] = `Bearer ${auth.credentials.jwtToken}`;
          }
          break;
      }
    }
    
    // Add custom headers
    if (this.config.customHeaders) {
      Object.assign(headers, this.config.customHeaders);
    }
    
    return headers;
  }
  
  /**
   * Process file attachment
   */
  private async processFileAttachment(file: File): Promise<N8nFileAttachment> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve({
          name: file.name,
          mimeType: file.type,
          data: base64,
          size: file.size,
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
  
  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.state.status = 'error';
    this.state.lastError = error;
    this.state.retryCount++;
    
    // Update last assistant message if exists
    const lastMessage = this.messages[this.messages.length - 1];
    if (lastMessage?.role === 'assistant' && lastMessage.status?.type === 'running') {
      this.messages = this.messages.map(msg => {
        if (msg.id === lastMessage.id) {
          return {
            ...msg,
            status: { 
              type: 'error',
              error: error.message,
            },
          };
        }
        return msg;
      });
    }
    
    this.notifySubscribers();
  }
  
  /**
   * Notify all subscribers of state change
   */
  private notifySubscribers(): void {
    this.subscribers.forEach(callback => callback());
  }
  
  // ═══════════════════════════════════════════════════════════
  // Public Utilities
  // ═══════════════════════════════════════════════════════════
  
  /**
   * Get current session ID
   */
  public getSessionId(): string | null {
    return this.state.sessionId;
  }
  
  /**
   * Get current status
   */
  public getStatus(): N8nRuntimeState['status'] {
    return this.state.status;
  }
  
  /**
   * Get last error
   */
  public getLastError(): Error | null {
    return this.state.lastError;
  }
  
  /**
   * Check if can retry
   */
  public canRetry(): boolean {
    return this.state.retryCount < 3 && this.state.lastError !== null;
  }
  
  /**
   * Import messages (for history loading)
   */
  public importMessages(messages: ThreadMessage[]): void {
    this.messages = messages;
    this.notifySubscribers();
  }
  
  /**
   * Export messages (for history saving)
   */
  public exportMessages(): ThreadMessage[] {
    return [...this.messages];
  }
}

/**
 * Custom error class for n8n API errors
 */
export class N8nApiError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly responseBody: string
  ) {
    let message = `n8n API error: ${statusCode}`;
    
    // Try to parse error message from response
    try {
      const parsed = JSON.parse(responseBody);
      if (parsed.message) {
        message = parsed.message;
      } else if (parsed.error) {
        message = parsed.error;
      }
    } catch {
      // Use generic message
    }
    
    super(message);
    this.name = 'N8nApiError';
  }
  
  /**
   * Check if error is recoverable (worth retrying)
   */
  isRecoverable(): boolean {
    // Retry on server errors and rate limits
    return this.statusCode >= 500 || this.statusCode === 429;
  }
}
```

---

## 3. Runtime Factory

### 3.1 Factory Function

```typescript
// runtime/create-runtime.ts

import { N8nChatRuntime } from './n8n-chat-runtime';
import type { N8nEndpointConfig, WordPressContext } from '../types/n8n-runtime';

/**
 * Configuration provided via wp_localize_script
 */
interface FlowChatConfig {
  instances: Record<string, {
    id: string;
    name: string;
    endpoint: N8nEndpointConfig;
    behavior: {
      welcomeMessage: string;
      placeholder: string;
      showTimestamps: boolean;
      enableMarkdown: boolean;
    };
    features: {
      fileUpload: boolean;
      voiceInput: boolean;
      history: boolean;
      suggestions: string[];
    };
    appearance: {
      template: string;
      theme: 'light' | 'dark' | 'auto';
      primaryColor: string;
      // ... more styling options
    };
  }>;
  
  wpContext: WordPressContext;
  
  apiEndpoints: {
    base: string;
    nonce: string;
  };
  
  premium: {
    enabled: boolean;
    features: string[];
  };
}

/**
 * Create runtime for a specific instance
 */
export function createN8nRuntime(
  instanceId: string,
  config: FlowChatConfig
): N8nChatRuntime {
  const instanceConfig = config.instances[instanceId];
  
  if (!instanceConfig) {
    throw new Error(`Instance "${instanceId}" not found in configuration`);
  }
  
  // Create context with instance info
  const context: WordPressContext = {
    ...config.wpContext,
    instance: {
      id: instanceId,
      name: instanceConfig.name,
    },
  };
  
  return new N8nChatRuntime(instanceConfig.endpoint, context);
}

/**
 * Create all configured runtimes
 */
export function createAllRuntimes(
  config: FlowChatConfig
): Map<string, N8nChatRuntime> {
  const runtimes = new Map<string, N8nChatRuntime>();
  
  for (const instanceId of Object.keys(config.instances)) {
    runtimes.set(instanceId, createN8nRuntime(instanceId, config));
  }
  
  return runtimes;
}
```

---

## 4. React Integration

### 4.1 Runtime Provider Hook

```typescript
// hooks/use-n8n-runtime.ts

import { 
  useCallback, 
  useEffect, 
  useMemo, 
  useRef, 
  useSyncExternalStore 
} from 'react';
import { N8nChatRuntime } from '../runtime/n8n-chat-runtime';
import { useInstanceConfig } from '../contexts/InstanceConfigContext';
import { useFlowChatConfig } from '../contexts/FlowChatConfigContext';
import { createN8nRuntime } from '../runtime/create-runtime';

/**
 * Hook to create and manage n8n runtime for current instance
 */
export function useN8nRuntime(instanceId?: string) {
  const config = useFlowChatConfig();
  const { currentInstanceId } = useInstanceConfig();
  
  const targetInstanceId = instanceId ?? currentInstanceId;
  
  // Create runtime (memoized)
  const runtime = useMemo(() => {
    if (!targetInstanceId) return null;
    return createN8nRuntime(targetInstanceId, config);
  }, [targetInstanceId, config]);
  
  // Sync external store for reactivity
  const state = useSyncExternalStore(
    useCallback(
      (callback) => runtime?.subscribe(callback) ?? (() => {}),
      [runtime]
    ),
    () => runtime?.getState() ?? { messages: [], isRunning: false },
    () => ({ messages: [], isRunning: false })
  );
  
  return {
    runtime,
    ...state,
    sessionId: runtime?.getSessionId() ?? null,
    status: runtime?.getStatus() ?? 'idle',
    lastError: runtime?.getLastError() ?? null,
    canRetry: runtime?.canRetry() ?? false,
    clearSession: () => runtime?.clearSession(),
  };
}

/**
 * Hook for runtime controls
 */
export function useRuntimeControls() {
  const { runtime, status, canRetry } = useN8nRuntime();
  
  const send = useCallback(async (text: string, files?: File[]) => {
    if (!runtime) return;
    
    const content: Array<{ type: 'text'; text: string } | { type: 'file'; file: File }> = [
      { type: 'text', text }
    ];
    
    if (files) {
      for (const file of files) {
        content.push({ type: 'file', file });
      }
    }
    
    await runtime.append({ role: 'user', content });
  }, [runtime]);
  
  const cancel = useCallback(() => {
    runtime?.cancel();
  }, [runtime]);
  
  const retry = useCallback(async () => {
    if (canRetry) {
      await runtime?.reload();
    }
  }, [runtime, canRetry]);
  
  return {
    send,
    cancel,
    retry,
    isRunning: status === 'streaming',
    canSend: status === 'idle',
    canCancel: status === 'streaming',
    canRetry,
  };
}
```

### 4.2 Runtime Context Provider

```typescript
// contexts/RuntimeContext.tsx

import React, { createContext, useContext, useMemo } from 'react';
import { AssistantRuntimeProvider } from '@assistant-ui/react';
import { N8nChatRuntime } from '../runtime/n8n-chat-runtime';
import { useN8nRuntime } from '../hooks/use-n8n-runtime';

interface RuntimeContextValue {
  runtime: N8nChatRuntime | null;
  sessionId: string | null;
  status: 'idle' | 'connecting' | 'streaming' | 'error';
  lastError: Error | null;
  canRetry: boolean;
  clearSession: () => void;
}

const RuntimeContext = createContext<RuntimeContextValue | null>(null);

interface RuntimeProviderProps {
  instanceId: string;
  children: React.ReactNode;
}

export function RuntimeProvider({ instanceId, children }: RuntimeProviderProps) {
  const runtimeData = useN8nRuntime(instanceId);
  
  const contextValue = useMemo(() => ({
    runtime: runtimeData.runtime,
    sessionId: runtimeData.sessionId,
    status: runtimeData.status,
    lastError: runtimeData.lastError,
    canRetry: runtimeData.canRetry,
    clearSession: runtimeData.clearSession,
  }), [runtimeData]);
  
  if (!runtimeData.runtime) {
    return null;
  }
  
  return (
    <RuntimeContext.Provider value={contextValue}>
      <AssistantRuntimeProvider runtime={runtimeData.runtime}>
        {children}
      </AssistantRuntimeProvider>
    </RuntimeContext.Provider>
  );
}

export function useRuntimeContext(): RuntimeContextValue {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useRuntimeContext must be used within RuntimeProvider');
  }
  return context;
}
```

---

## 5. Message Transformation

### 5.1 Message Format Converter

```typescript
// runtime/message-transform.ts

import type { ThreadMessage } from '@assistant-ui/react';

/**
 * n8n message format (from Chat Trigger history)
 */
interface N8nHistoryMessage {
  message: string;
  type: 'user' | 'bot';
  timestamp: string;
}

/**
 * WordPress saved message format (for history feature)
 */
interface WPSavedMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  created_at: string;
  attachments?: Array<{
    type: 'image' | 'file';
    url: string;
    name: string;
  }>;
}

/**
 * Convert n8n history to ThreadMessage format
 */
export function convertN8nHistory(
  messages: N8nHistoryMessage[]
): ThreadMessage[] {
  return messages.map((msg, index) => ({
    id: `history_${index}_${new Date(msg.timestamp).getTime()}`,
    role: msg.type === 'user' ? 'user' : 'assistant',
    content: [{ type: 'text', text: msg.message }],
    createdAt: new Date(msg.timestamp),
    status: { type: 'complete' },
  }));
}

/**
 * Convert WordPress saved messages to ThreadMessage format
 */
export function convertWPHistory(
  messages: WPSavedMessage[]
): ThreadMessage[] {
  return messages.map(msg => {
    const content: ThreadMessage['content'] = [
      { type: 'text', text: msg.content }
    ];
    
    // Add attachments
    if (msg.attachments) {
      for (const attachment of msg.attachments) {
        if (attachment.type === 'image') {
          content.push({
            type: 'image',
            image: attachment.url,
          });
        }
      }
    }
    
    return {
      id: msg.id,
      role: msg.role,
      content,
      createdAt: new Date(msg.created_at),
      status: { type: 'complete' },
    };
  });
}

/**
 * Convert ThreadMessages to WordPress format for saving
 */
export function convertToWPFormat(
  messages: ThreadMessage[]
): WPSavedMessage[] {
  return messages
    .filter(msg => msg.status?.type === 'complete')
    .map(msg => {
      // Extract text content
      const textContent = msg.content
        .filter((c): c is { type: 'text'; text: string } => c.type === 'text')
        .map(c => c.text)
        .join('\n');
      
      // Extract attachments
      const attachments = msg.content
        .filter((c): c is { type: 'image'; image: string } => c.type === 'image')
        .map(c => ({
          type: 'image' as const,
          url: c.image,
          name: 'image',
        }));
      
      return {
        id: msg.id,
        content: textContent,
        role: msg.role,
        created_at: msg.createdAt?.toISOString() ?? new Date().toISOString(),
        ...(attachments.length > 0 && { attachments }),
      };
    });
}
```

---

## 6. Retry & Recovery

### 6.1 Exponential Backoff

```typescript
// runtime/retry-handler.ts

interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffFactor: 2,
};

/**
 * Calculate delay for retry attempt
 */
export function calculateRetryDelay(
  attempt: number,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): number {
  const delay = config.baseDelay * Math.pow(config.backoffFactor, attempt);
  // Add jitter (±20%)
  const jitter = delay * 0.2 * (Math.random() - 0.5);
  return Math.min(delay + jitter, config.maxDelay);
}

/**
 * Execute with retry
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  shouldRetry: (error: Error) => boolean,
  config: RetryConfig = DEFAULT_RETRY_CONFIG,
  onRetry?: (attempt: number, delay: number, error: Error) => void
): Promise<T> {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt < config.maxRetries && shouldRetry(lastError)) {
        const delay = calculateRetryDelay(attempt, config);
        onRetry?.(attempt + 1, delay, lastError);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        throw lastError;
      }
    }
  }
  
  throw lastError!;
}

/**
 * Connection health monitor
 */
export class ConnectionHealthMonitor {
  private failureCount = 0;
  private lastSuccessTime: number = Date.now();
  private healthyThreshold = 3;
  
  recordSuccess(): void {
    this.failureCount = 0;
    this.lastSuccessTime = Date.now();
  }
  
  recordFailure(): void {
    this.failureCount++;
  }
  
  isHealthy(): boolean {
    return this.failureCount < this.healthyThreshold;
  }
  
  getTimeSinceLastSuccess(): number {
    return Date.now() - this.lastSuccessTime;
  }
  
  reset(): void {
    this.failureCount = 0;
    this.lastSuccessTime = Date.now();
  }
}
```

---

## 7. Testing

### 7.1 Mock Runtime for Development

```typescript
// runtime/mock-runtime.ts

import { N8nChatRuntime } from './n8n-chat-runtime';
import type { N8nEndpointConfig, WordPressContext } from '../types/n8n-runtime';

/**
 * Mock runtime for development/testing
 */
export class MockN8nRuntime extends N8nChatRuntime {
  private mockResponses: string[] = [
    "Hello! I'm a mock chatbot for testing purposes.",
    "I can help you test the FlowChat plugin interface.",
    "This is a simulated response to demonstrate streaming.",
    "The actual responses will come from your n8n workflow.",
  ];
  
  private responseIndex = 0;
  
  constructor(wpContext: WordPressContext) {
    const mockConfig: N8nEndpointConfig = {
      webhookUrl: 'http://mock.local/webhook',
      streaming: true,
      timeout: 30000,
      authentication: { enabled: false, type: 'none' },
      includeUserContext: true,
    };
    
    super(mockConfig, wpContext);
  }
  
  // Override sendToN8n to simulate responses
  protected async sendToN8n(text: string): Promise<void> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Get mock response
    const response = this.mockResponses[
      this.responseIndex % this.mockResponses.length
    ];
    this.responseIndex++;
    
    // Simulate streaming
    const assistantMessage = this.createAssistantMessage('');
    this.messages = [...this.messages, assistantMessage];
    this.state.status = 'streaming';
    this.notifySubscribers();
    
    // Stream character by character
    let content = '';
    for (const char of response) {
      await new Promise(resolve => setTimeout(resolve, 30));
      content += char;
      this.updateAssistantMessage(assistantMessage.id, content);
    }
    
    this.completeAssistantMessage(assistantMessage.id, content);
    this.state.status = 'idle';
    this.notifySubscribers();
  }
}

/**
 * Create mock runtime for testing
 */
export function createMockRuntime(
  wpContext?: Partial<WordPressContext>
): MockN8nRuntime {
  const defaultContext: WordPressContext = {
    user: {
      id: 1,
      email: 'test@example.com',
      displayName: 'Test User',
      roles: ['subscriber'],
      isLoggedIn: true,
    },
    page: {
      id: 123,
      title: 'Test Page',
      url: 'http://example.com/test',
      postType: 'page',
    },
    site: {
      name: 'Test Site',
      url: 'http://example.com',
      language: 'en-US',
    },
    instance: {
      id: 'mock-instance',
      name: 'Mock Instance',
    },
  };
  
  return new MockN8nRuntime({ ...defaultContext, ...wpContext });
}
```

---

## 8. Usage Examples

### 8.1 Basic Usage

```tsx
// Example: Using the runtime in a component

import React from 'react';
import { RuntimeProvider } from './contexts/RuntimeContext';
import { useRuntimeControls } from './hooks/use-n8n-runtime';
import { Thread } from '@assistant-ui/react';

function ChatComponent({ instanceId }: { instanceId: string }) {
  return (
    <RuntimeProvider instanceId={instanceId}>
      <ChatUI />
    </RuntimeProvider>
  );
}

function ChatUI() {
  const { send, cancel, isRunning, canCancel } = useRuntimeControls();
  
  const handleSubmit = async (text: string) => {
    await send(text);
  };
  
  return (
    <div className="flowchat-container">
      <Thread />
      {canCancel && (
        <button onClick={cancel}>Stop generating</button>
      )}
    </div>
  );
}
```

### 8.2 With File Attachments

```tsx
// Example: Sending messages with files

function ChatWithFiles() {
  const { send } = useRuntimeControls();
  const [files, setFiles] = useState<File[]>([]);
  
  const handleSubmit = async (text: string) => {
    await send(text, files);
    setFiles([]); // Clear after sending
  };
  
  return (
    <div>
      <input 
        type="file" 
        multiple 
        onChange={e => setFiles(Array.from(e.target.files || []))} 
      />
      {/* ... rest of UI */}
    </div>
  );
}
```

---

## 9. Configuration Reference

### 9.1 Endpoint Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `webhookUrl` | string | required | n8n Chat Trigger webhook URL |
| `streaming` | boolean | `true` | Enable SSE streaming |
| `timeout` | number | `30000` | Request timeout (ms) |
| `authentication.enabled` | boolean | `false` | Enable authentication |
| `authentication.type` | string | `'none'` | Auth type: none, basic, header, jwt |
| `includeUserContext` | boolean | `true` | Send WordPress context |
| `customHeaders` | object | `{}` | Additional request headers |

### 9.2 Error Codes

| Code | Meaning | User Message Key |
|------|---------|-----------------|
| 400 | Bad Request | `error_bad_request` |
| 401 | Unauthorized | `error_unauthorized` |
| 403 | Forbidden | `error_forbidden` |
| 404 | Endpoint Not Found | `error_not_found` |
| 429 | Rate Limited | `error_rate_limit` |
| 500+ | Server Error | `error_server` |
| TIMEOUT | Request Timeout | `error_timeout` |
| NETWORK | Connection Failed | `error_network` |
