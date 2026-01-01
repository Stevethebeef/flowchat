# 11. Error Handling System

## Overview

Comprehensive error handling strategy covering all failure modes across admin, frontend, and n8n communication layers.

---

## Error Architecture

### Error Categories

```typescript
// src/types/errors.ts

export enum ErrorCategory {
  NETWORK = 'network',
  AUTHENTICATION = 'authentication',
  VALIDATION = 'validation',
  CONFIGURATION = 'configuration',
  RATE_LIMIT = 'rate_limit',
  N8N = 'n8n',
  WORDPRESS = 'wordpress',
  USER = 'user',
  SYSTEM = 'system',
}

export enum ErrorSeverity {
  INFO = 'info',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical',
}

export interface FlowChatError {
  code: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  userMessage: string;
  details?: Record<string, unknown>;
  timestamp: number;
  recoverable: boolean;
  retryable: boolean;
  retryAfter?: number;
}
```

### Error Codes

```typescript
// src/constants/error-codes.ts

export const ErrorCodes = {
  // Network Errors (1xxx)
  NETWORK_OFFLINE: 'E1001',
  NETWORK_TIMEOUT: 'E1002',
  NETWORK_CORS: 'E1003',
  NETWORK_SSL: 'E1004',
  NETWORK_DNS: 'E1005',
  
  // Authentication Errors (2xxx)
  AUTH_NONCE_INVALID: 'E2001',
  AUTH_NONCE_EXPIRED: 'E2002',
  AUTH_SESSION_EXPIRED: 'E2003',
  AUTH_UNAUTHORIZED: 'E2004',
  AUTH_FORBIDDEN: 'E2005',
  AUTH_LOGIN_REQUIRED: 'E2006',
  AUTH_ROLE_DENIED: 'E2007',
  
  // Validation Errors (3xxx)
  VALIDATION_MESSAGE_EMPTY: 'E3001',
  VALIDATION_MESSAGE_TOO_LONG: 'E3002',
  VALIDATION_INSTANCE_INVALID: 'E3003',
  VALIDATION_CONFIG_INVALID: 'E3004',
  VALIDATION_WEBHOOK_INVALID: 'E3005',
  
  // Configuration Errors (4xxx)
  CONFIG_INSTANCE_NOT_FOUND: 'E4001',
  CONFIG_INSTANCE_DISABLED: 'E4002',
  CONFIG_WEBHOOK_MISSING: 'E4003',
  CONFIG_TEMPLATE_NOT_FOUND: 'E4004',
  CONFIG_LICENSE_INVALID: 'E4005',
  CONFIG_FEATURE_UNAVAILABLE: 'E4006',
  
  // Rate Limit Errors (5xxx)
  RATE_LIMIT_MESSAGE: 'E5001',
  RATE_LIMIT_SESSION: 'E5002',
  RATE_LIMIT_API: 'E5003',
  
  // n8n Errors (6xxx)
  N8N_CONNECTION_FAILED: 'E6001',
  N8N_TIMEOUT: 'E6002',
  N8N_WORKFLOW_ERROR: 'E6003',
  N8N_RESPONSE_INVALID: 'E6004',
  N8N_WEBHOOK_NOT_FOUND: 'E6005',
  N8N_WORKFLOW_INACTIVE: 'E6006',
  N8N_RATE_LIMITED: 'E6007',
  
  // WordPress Errors (7xxx)
  WP_DATABASE_ERROR: 'E7001',
  WP_OPTION_SAVE_FAILED: 'E7002',
  WP_CAPABILITY_DENIED: 'E7003',
  WP_AJAX_FAILED: 'E7004',
  WP_REST_ERROR: 'E7005',
  
  // User Errors (8xxx)
  USER_CANCELLED: 'E8001',
  USER_IDLE_TIMEOUT: 'E8002',
  
  // System Errors (9xxx)
  SYSTEM_UNKNOWN: 'E9001',
  SYSTEM_MEMORY: 'E9002',
  SYSTEM_STORAGE_FULL: 'E9003',
} as const;
```

---

## Error Message Configuration

### Admin-Configurable Messages

```typescript
// src/types/config.ts

export interface ErrorMessages {
  // Network errors
  network_offline: string;
  network_timeout: string;
  network_error: string;
  
  // Connection errors
  connection_failed: string;
  connection_lost: string;
  reconnecting: string;
  reconnected: string;
  
  // n8n errors
  n8n_unavailable: string;
  n8n_timeout: string;
  n8n_error: string;
  
  // Rate limiting
  rate_limited: string;
  too_many_messages: string;
  
  // Authentication
  session_expired: string;
  login_required: string;
  access_denied: string;
  
  // Validation
  message_empty: string;
  message_too_long: string;
  
  // Generic
  generic_error: string;
  try_again: string;
}

export const defaultErrorMessages: ErrorMessages = {
  // Network errors
  network_offline: 'You appear to be offline. Please check your internet connection.',
  network_timeout: 'The request timed out. Please try again.',
  network_error: 'A network error occurred. Please try again.',
  
  // Connection errors
  connection_failed: 'Unable to connect to the chat service. Please try again later.',
  connection_lost: 'Connection lost. Attempting to reconnect...',
  reconnecting: 'Reconnecting...',
  reconnected: 'Connection restored.',
  
  // n8n errors
  n8n_unavailable: 'The chat service is temporarily unavailable. Please try again later.',
  n8n_timeout: 'The response is taking longer than expected. Please wait or try again.',
  n8n_error: 'An error occurred processing your message. Please try again.',
  
  // Rate limiting
  rate_limited: 'You\'re sending messages too quickly. Please wait a moment.',
  too_many_messages: 'Message limit reached. Please try again in a few minutes.',
  
  // Authentication
  session_expired: 'Your session has expired. Please refresh the page.',
  login_required: 'Please log in to use this chat.',
  access_denied: 'You don\'t have permission to access this chat.',
  
  // Validation
  message_empty: 'Please enter a message.',
  message_too_long: 'Your message is too long. Please shorten it and try again.',
  
  // Generic
  generic_error: 'Something went wrong. Please try again.',
  try_again: 'Try again',
};
```

### Database Schema for Custom Messages

```php
// Stored in wp_options: flowchat_error_messages
[
    'network_offline' => 'You appear to be offline...',
    'connection_failed' => 'Unable to connect...',
    // ... custom overrides only
]
```

---

## Error Handling Classes

### PHP Error Handler

```php
<?php
// includes/class-error-handler.php

namespace FlowChat;

class Error_Handler {
    
    private static $instance = null;
    private $errors = [];
    private $log_enabled = true;
    
    public static function instance() {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    private function __construct() {
        $this->log_enabled = defined('WP_DEBUG') && WP_DEBUG;
        add_action('init', [$this, 'setup_error_handling']);
    }
    
    public function setup_error_handling() {
        // Register shutdown function for fatal errors
        register_shutdown_function([$this, 'handle_fatal_error']);
    }
    
    /**
     * Create a FlowChat error
     */
    public function create_error(
        string $code,
        string $message,
        string $user_message = '',
        array $details = [],
        bool $recoverable = true,
        bool $retryable = false
    ): \WP_Error {
        $error = new \WP_Error(
            $code,
            $message,
            [
                'user_message' => $user_message ?: $this->get_user_message($code),
                'details' => $details,
                'recoverable' => $recoverable,
                'retryable' => $retryable,
                'timestamp' => time(),
            ]
        );
        
        $this->log_error($error);
        
        return $error;
    }
    
    /**
     * Get user-friendly message for error code
     */
    public function get_user_message(string $code): string {
        $custom_messages = get_option('flowchat_error_messages', []);
        $default_messages = $this->get_default_messages();
        
        // Map error codes to message keys
        $code_to_key = [
            'E1001' => 'network_offline',
            'E1002' => 'network_timeout',
            'E6001' => 'connection_failed',
            'E6002' => 'n8n_timeout',
            'E6003' => 'n8n_error',
            'E5001' => 'rate_limited',
            'E2003' => 'session_expired',
            'E2006' => 'login_required',
            'E2007' => 'access_denied',
        ];
        
        $key = $code_to_key[$code] ?? 'generic_error';
        
        return $custom_messages[$key] ?? $default_messages[$key] ?? 'An error occurred.';
    }
    
    /**
     * Get default error messages
     */
    private function get_default_messages(): array {
        return [
            'network_offline' => __('You appear to be offline. Please check your internet connection.', 'flowchat'),
            'network_timeout' => __('The request timed out. Please try again.', 'flowchat'),
            'network_error' => __('A network error occurred. Please try again.', 'flowchat'),
            'connection_failed' => __('Unable to connect to the chat service. Please try again later.', 'flowchat'),
            'connection_lost' => __('Connection lost. Attempting to reconnect...', 'flowchat'),
            'n8n_unavailable' => __('The chat service is temporarily unavailable.', 'flowchat'),
            'n8n_timeout' => __('The response is taking longer than expected.', 'flowchat'),
            'n8n_error' => __('An error occurred processing your message.', 'flowchat'),
            'rate_limited' => __('You\'re sending messages too quickly. Please wait a moment.', 'flowchat'),
            'session_expired' => __('Your session has expired. Please refresh the page.', 'flowchat'),
            'login_required' => __('Please log in to use this chat.', 'flowchat'),
            'access_denied' => __('You don\'t have permission to access this chat.', 'flowchat'),
            'message_empty' => __('Please enter a message.', 'flowchat'),
            'message_too_long' => __('Your message is too long.', 'flowchat'),
            'generic_error' => __('Something went wrong. Please try again.', 'flowchat'),
        ];
    }
    
    /**
     * Log error if debug mode enabled
     */
    private function log_error(\WP_Error $error) {
        if (!$this->log_enabled) {
            return;
        }
        
        $log_entry = sprintf(
            '[FlowChat Error] Code: %s | Message: %s | Details: %s',
            $error->get_error_code(),
            $error->get_error_message(),
            wp_json_encode($error->get_error_data())
        );
        
        error_log($log_entry);
        
        // Store recent errors for admin debugging
        $this->store_error($error);
    }
    
    /**
     * Store error for admin review
     */
    private function store_error(\WP_Error $error) {
        $recent_errors = get_transient('flowchat_recent_errors') ?: [];
        
        array_unshift($recent_errors, [
            'code' => $error->get_error_code(),
            'message' => $error->get_error_message(),
            'data' => $error->get_error_data(),
            'timestamp' => time(),
        ]);
        
        // Keep only last 50 errors
        $recent_errors = array_slice($recent_errors, 0, 50);
        
        set_transient('flowchat_recent_errors', $recent_errors, DAY_IN_SECONDS);
    }
    
    /**
     * Handle fatal errors
     */
    public function handle_fatal_error() {
        $error = error_get_last();
        
        if ($error && in_array($error['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
            // Check if it's a FlowChat error
            if (strpos($error['file'], 'flowchat') !== false) {
                $this->log_error(new \WP_Error(
                    'E9001',
                    'Fatal error: ' . $error['message'],
                    ['file' => $error['file'], 'line' => $error['line']]
                ));
            }
        }
    }
    
    /**
     * Format error for REST response
     */
    public function format_rest_error(\WP_Error $error): array {
        $data = $error->get_error_data();
        
        return [
            'success' => false,
            'error' => [
                'code' => $error->get_error_code(),
                'message' => $data['user_message'] ?? $error->get_error_message(),
                'recoverable' => $data['recoverable'] ?? true,
                'retryable' => $data['retryable'] ?? false,
                'retryAfter' => $data['retry_after'] ?? null,
            ],
        ];
    }
    
    /**
     * Format error for AJAX response
     */
    public function format_ajax_error(\WP_Error $error): void {
        wp_send_json_error($this->format_rest_error($error)['error']);
    }
}
```

### TypeScript Error Handler

```typescript
// src/lib/error-handler.ts

import { ErrorCodes, ErrorCategory, ErrorSeverity, FlowChatError } from '../types/errors';

export class ErrorHandler {
  private static instance: ErrorHandler;
  private errorMessages: Record<string, string>;
  private errorListeners: Set<(error: FlowChatError) => void> = new Set();
  
  private constructor() {
    // Get custom messages from localized data
    this.errorMessages = window.flowchatConfig?.errorMessages || {};
  }
  
  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler();
    }
    return ErrorHandler.instance;
  }
  
  /**
   * Subscribe to error events
   */
  onError(callback: (error: FlowChatError) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }
  
  /**
   * Emit error to all listeners
   */
  private emit(error: FlowChatError): void {
    this.errorListeners.forEach(listener => listener(error));
  }
  
  /**
   * Create error from code
   */
  createError(
    code: string,
    details?: Record<string, unknown>,
    overrideMessage?: string
  ): FlowChatError {
    const errorConfig = this.getErrorConfig(code);
    
    const error: FlowChatError = {
      code,
      category: errorConfig.category,
      severity: errorConfig.severity,
      message: errorConfig.message,
      userMessage: overrideMessage || this.getUserMessage(code),
      details,
      timestamp: Date.now(),
      recoverable: errorConfig.recoverable,
      retryable: errorConfig.retryable,
      retryAfter: errorConfig.retryAfter,
    };
    
    this.logError(error);
    this.emit(error);
    
    return error;
  }
  
  /**
   * Handle fetch/network error
   */
  handleNetworkError(error: Error): FlowChatError {
    // Detect specific network conditions
    if (!navigator.onLine) {
      return this.createError(ErrorCodes.NETWORK_OFFLINE);
    }
    
    if (error.name === 'AbortError') {
      return this.createError(ErrorCodes.NETWORK_TIMEOUT);
    }
    
    if (error.message.includes('CORS')) {
      return this.createError(ErrorCodes.NETWORK_CORS);
    }
    
    return this.createError(ErrorCodes.NETWORK_TIMEOUT, { 
      originalError: error.message 
    });
  }
  
  /**
   * Handle n8n response error
   */
  handleN8nError(response: Response, body?: unknown): FlowChatError {
    switch (response.status) {
      case 404:
        return this.createError(ErrorCodes.N8N_WEBHOOK_NOT_FOUND);
      case 429:
        const retryAfter = parseInt(response.headers.get('Retry-After') || '60', 10);
        return this.createError(ErrorCodes.N8N_RATE_LIMITED, { retryAfter });
      case 500:
      case 502:
      case 503:
        return this.createError(ErrorCodes.N8N_WORKFLOW_ERROR, { status: response.status });
      case 504:
        return this.createError(ErrorCodes.N8N_TIMEOUT);
      default:
        return this.createError(ErrorCodes.N8N_CONNECTION_FAILED, { 
          status: response.status,
          body 
        });
    }
  }
  
  /**
   * Handle WordPress REST error
   */
  handleRestError(response: Response, body?: { code?: string; message?: string }): FlowChatError {
    // Check for specific WordPress error codes
    if (body?.code === 'rest_cookie_invalid_nonce') {
      return this.createError(ErrorCodes.AUTH_NONCE_EXPIRED);
    }
    
    switch (response.status) {
      case 401:
        return this.createError(ErrorCodes.AUTH_UNAUTHORIZED);
      case 403:
        return this.createError(ErrorCodes.AUTH_FORBIDDEN);
      case 429:
        return this.createError(ErrorCodes.RATE_LIMIT_API);
      default:
        return this.createError(ErrorCodes.WP_REST_ERROR, { 
          status: response.status,
          body 
        });
    }
  }
  
  /**
   * Get user-friendly message
   */
  private getUserMessage(code: string): string {
    // Check for custom message first
    const messageKey = this.codeToMessageKey(code);
    if (this.errorMessages[messageKey]) {
      return this.errorMessages[messageKey];
    }
    
    // Fall back to defaults
    return this.getDefaultMessage(code);
  }
  
  /**
   * Map error code to message key
   */
  private codeToMessageKey(code: string): string {
    const mapping: Record<string, string> = {
      [ErrorCodes.NETWORK_OFFLINE]: 'network_offline',
      [ErrorCodes.NETWORK_TIMEOUT]: 'network_timeout',
      [ErrorCodes.N8N_CONNECTION_FAILED]: 'connection_failed',
      [ErrorCodes.N8N_TIMEOUT]: 'n8n_timeout',
      [ErrorCodes.N8N_WORKFLOW_ERROR]: 'n8n_error',
      [ErrorCodes.RATE_LIMIT_MESSAGE]: 'rate_limited',
      [ErrorCodes.AUTH_SESSION_EXPIRED]: 'session_expired',
      [ErrorCodes.AUTH_LOGIN_REQUIRED]: 'login_required',
      [ErrorCodes.AUTH_ROLE_DENIED]: 'access_denied',
      [ErrorCodes.VALIDATION_MESSAGE_EMPTY]: 'message_empty',
      [ErrorCodes.VALIDATION_MESSAGE_TOO_LONG]: 'message_too_long',
    };
    
    return mapping[code] || 'generic_error';
  }
  
  /**
   * Get default message for code
   */
  private getDefaultMessage(code: string): string {
    const defaults: Record<string, string> = {
      [ErrorCodes.NETWORK_OFFLINE]: 'You appear to be offline. Please check your internet connection.',
      [ErrorCodes.NETWORK_TIMEOUT]: 'The request timed out. Please try again.',
      [ErrorCodes.N8N_CONNECTION_FAILED]: 'Unable to connect to the chat service.',
      [ErrorCodes.N8N_TIMEOUT]: 'The response is taking longer than expected.',
      [ErrorCodes.N8N_WORKFLOW_ERROR]: 'An error occurred processing your message.',
      [ErrorCodes.RATE_LIMIT_MESSAGE]: 'You\'re sending messages too quickly.',
      [ErrorCodes.AUTH_SESSION_EXPIRED]: 'Your session has expired. Please refresh the page.',
      [ErrorCodes.AUTH_LOGIN_REQUIRED]: 'Please log in to use this chat.',
      [ErrorCodes.AUTH_ROLE_DENIED]: 'You don\'t have permission to access this chat.',
    };
    
    return defaults[code] || 'Something went wrong. Please try again.';
  }
  
  /**
   * Get error configuration
   */
  private getErrorConfig(code: string): {
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    recoverable: boolean;
    retryable: boolean;
    retryAfter?: number;
  } {
    // Define configurations for each error code
    const configs: Record<string, {
      category: ErrorCategory;
      severity: ErrorSeverity;
      message: string;
      recoverable: boolean;
      retryable: boolean;
      retryAfter?: number;
    }> = {
      [ErrorCodes.NETWORK_OFFLINE]: {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.WARNING,
        message: 'Device is offline',
        recoverable: true,
        retryable: true,
      },
      [ErrorCodes.NETWORK_TIMEOUT]: {
        category: ErrorCategory.NETWORK,
        severity: ErrorSeverity.WARNING,
        message: 'Request timed out',
        recoverable: true,
        retryable: true,
        retryAfter: 5,
      },
      [ErrorCodes.N8N_CONNECTION_FAILED]: {
        category: ErrorCategory.N8N,
        severity: ErrorSeverity.ERROR,
        message: 'Failed to connect to n8n',
        recoverable: true,
        retryable: true,
        retryAfter: 10,
      },
      [ErrorCodes.N8N_WORKFLOW_ERROR]: {
        category: ErrorCategory.N8N,
        severity: ErrorSeverity.ERROR,
        message: 'n8n workflow error',
        recoverable: true,
        retryable: true,
      },
      [ErrorCodes.RATE_LIMIT_MESSAGE]: {
        category: ErrorCategory.RATE_LIMIT,
        severity: ErrorSeverity.WARNING,
        message: 'Message rate limit exceeded',
        recoverable: true,
        retryable: true,
        retryAfter: 60,
      },
      [ErrorCodes.AUTH_SESSION_EXPIRED]: {
        category: ErrorCategory.AUTHENTICATION,
        severity: ErrorSeverity.ERROR,
        message: 'Session expired',
        recoverable: false,
        retryable: false,
      },
      [ErrorCodes.CONFIG_INSTANCE_DISABLED]: {
        category: ErrorCategory.CONFIGURATION,
        severity: ErrorSeverity.INFO,
        message: 'Instance is disabled',
        recoverable: false,
        retryable: false,
      },
    };
    
    return configs[code] || {
      category: ErrorCategory.SYSTEM,
      severity: ErrorSeverity.ERROR,
      message: 'Unknown error',
      recoverable: true,
      retryable: false,
    };
  }
  
  /**
   * Log error in development
   */
  private logError(error: FlowChatError): void {
    if (process.env.NODE_ENV === 'development') {
      console.error('[FlowChat Error]', error);
    }
  }
}

export const errorHandler = ErrorHandler.getInstance();
```

---

## Error UI Components

### Error Message Component

```tsx
// src/components/ErrorMessage/ErrorMessage.tsx

import React from 'react';
import { AlertCircle, WifiOff, Clock, RefreshCw, LogIn } from 'lucide-react';
import { FlowChatError, ErrorCategory } from '../../types/errors';
import { useConfig } from '../../hooks/useConfig';
import './ErrorMessage.css';

interface ErrorMessageProps {
  error: FlowChatError;
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
}

export const ErrorMessage: React.FC<ErrorMessageProps> = ({
  error,
  onRetry,
  onDismiss,
  compact = false,
}) => {
  const { config } = useConfig();
  
  const getIcon = () => {
    switch (error.category) {
      case ErrorCategory.NETWORK:
        return <WifiOff className="flowchat-error-icon" />;
      case ErrorCategory.RATE_LIMIT:
        return <Clock className="flowchat-error-icon" />;
      case ErrorCategory.AUTHENTICATION:
        return <LogIn className="flowchat-error-icon" />;
      default:
        return <AlertCircle className="flowchat-error-icon" />;
    }
  };
  
  const getSeverityClass = () => {
    return `flowchat-error--${error.severity}`;
  };
  
  if (compact) {
    return (
      <div className={`flowchat-error-compact ${getSeverityClass()}`}>
        {getIcon()}
        <span>{error.userMessage}</span>
        {error.retryable && onRetry && (
          <button 
            onClick={onRetry}
            className="flowchat-error-retry-inline"
            title={config.errorMessages?.try_again || 'Try again'}
          >
            <RefreshCw size={14} />
          </button>
        )}
      </div>
    );
  }
  
  return (
    <div className={`flowchat-error ${getSeverityClass()}`} role="alert">
      <div className="flowchat-error-content">
        {getIcon()}
        <div className="flowchat-error-text">
          <p className="flowchat-error-message">{error.userMessage}</p>
          {error.retryAfter && (
            <p className="flowchat-error-retry-info">
              <RetryCountdown seconds={error.retryAfter} onComplete={onRetry} />
            </p>
          )}
        </div>
      </div>
      
      <div className="flowchat-error-actions">
        {error.retryable && onRetry && (
          <button 
            onClick={onRetry}
            className="flowchat-error-retry-btn"
          >
            <RefreshCw size={16} />
            {config.errorMessages?.try_again || 'Try again'}
          </button>
        )}
        {onDismiss && (
          <button 
            onClick={onDismiss}
            className="flowchat-error-dismiss-btn"
            aria-label="Dismiss"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Countdown component for retry delays
const RetryCountdown: React.FC<{
  seconds: number;
  onComplete?: () => void;
}> = ({ seconds, onComplete }) => {
  const [remaining, setRemaining] = React.useState(seconds);
  
  React.useEffect(() => {
    if (remaining <= 0) {
      onComplete?.();
      return;
    }
    
    const timer = setTimeout(() => {
      setRemaining(r => r - 1);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [remaining, onComplete]);
  
  if (remaining <= 0) {
    return null;
  }
  
  return (
    <span className="flowchat-error-countdown">
      Retry available in {remaining}s
    </span>
  );
};
```

### Error Boundary Component

```tsx
// src/components/ErrorBoundary/ErrorBoundary.tsx

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { errorHandler } from '../../lib/error-handler';
import { ErrorCodes } from '../../constants/error-codes';
import { FlowChatError } from '../../types/errors';

interface Props {
  children: ReactNode;
  fallback?: ReactNode | ((error: FlowChatError, reset: () => void) => ReactNode);
  onError?: (error: FlowChatError) => void;
}

interface State {
  hasError: boolean;
  error: FlowChatError | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error: Error): Partial<State> {
    const flowChatError = errorHandler.createError(
      ErrorCodes.SYSTEM_UNKNOWN,
      { originalError: error.message, stack: error.stack }
    );
    
    return { hasError: true, error: flowChatError };
  }
  
  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('FlowChat Error Boundary caught error:', error, errorInfo);
    
    this.props.onError?.(this.state.error!);
  }
  
  handleReset = (): void => {
    this.setState({ hasError: false, error: null });
  };
  
  render(): ReactNode {
    if (this.state.hasError && this.state.error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      // Default fallback UI
      return (
        <div className="flowchat-error-boundary">
          <div className="flowchat-error-boundary-content">
            <h3>Something went wrong</h3>
            <p>{this.state.error.userMessage}</p>
            <button onClick={this.handleReset}>
              Try again
            </button>
          </div>
        </div>
      );
    }
    
    return this.props.children;
  }
}
```

### Toast Notification System

```tsx
// src/components/Toast/Toast.tsx

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FlowChatError, ErrorSeverity } from '../../types/errors';
import { ErrorMessage } from '../ErrorMessage/ErrorMessage';
import { errorHandler } from '../../lib/error-handler';

interface Toast {
  id: string;
  error: FlowChatError;
  onRetry?: () => void;
}

export const ToastContainer: React.FC = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  
  useEffect(() => {
    const unsubscribe = errorHandler.onError((error) => {
      // Only show toasts for warning and error severity
      if (error.severity === ErrorSeverity.INFO) {
        return;
      }
      
      const id = `toast-${Date.now()}`;
      setToasts(prev => [...prev, { id, error }]);
      
      // Auto-dismiss after 5 seconds for non-critical errors
      if (error.severity !== ErrorSeverity.CRITICAL) {
        setTimeout(() => {
          dismissToast(id);
        }, 5000);
      }
    });
    
    return unsubscribe;
  }, []);
  
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);
  
  if (toasts.length === 0) {
    return null;
  }
  
  return createPortal(
    <div className="flowchat-toast-container" role="log" aria-live="polite">
      {toasts.map(toast => (
        <div key={toast.id} className="flowchat-toast">
          <ErrorMessage
            error={toast.error}
            onRetry={toast.onRetry}
            onDismiss={() => dismissToast(toast.id)}
            compact
          />
        </div>
      ))}
    </div>,
    document.body
  );
};
```

---

## Recovery Strategies

### Connection Recovery

```typescript
// src/lib/connection-recovery.ts

import { errorHandler } from './error-handler';
import { ErrorCodes } from '../constants/error-codes';

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const defaultConfig: RetryConfig = {
  maxAttempts: 5,
  baseDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
};

export class ConnectionRecovery {
  private config: RetryConfig;
  private attemptCount: number = 0;
  private isRecovering: boolean = false;
  private onRecovered?: () => void;
  private onFailed?: () => void;
  
  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }
  
  /**
   * Start recovery process
   */
  async recover(
    operation: () => Promise<boolean>,
    onRecovered?: () => void,
    onFailed?: () => void
  ): Promise<boolean> {
    if (this.isRecovering) {
      return false;
    }
    
    this.isRecovering = true;
    this.attemptCount = 0;
    this.onRecovered = onRecovered;
    this.onFailed = onFailed;
    
    return this.attemptRecovery(operation);
  }
  
  /**
   * Attempt recovery with exponential backoff
   */
  private async attemptRecovery(
    operation: () => Promise<boolean>
  ): Promise<boolean> {
    this.attemptCount++;
    
    try {
      const success = await operation();
      
      if (success) {
        this.isRecovering = false;
        this.attemptCount = 0;
        this.onRecovered?.();
        return true;
      }
    } catch (error) {
      // Log but continue retry
      console.warn('Recovery attempt failed:', error);
    }
    
    if (this.attemptCount >= this.config.maxAttempts) {
      this.isRecovering = false;
      this.onFailed?.();
      errorHandler.createError(ErrorCodes.N8N_CONNECTION_FAILED, {
        attempts: this.attemptCount,
      });
      return false;
    }
    
    // Calculate delay with exponential backoff
    const delay = Math.min(
      this.config.baseDelay * Math.pow(this.config.backoffMultiplier, this.attemptCount - 1),
      this.config.maxDelay
    );
    
    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, delay));
    return this.attemptRecovery(operation);
  }
  
  /**
   * Cancel ongoing recovery
   */
  cancel(): void {
    this.isRecovering = false;
    this.attemptCount = 0;
  }
  
  /**
   * Get current recovery status
   */
  getStatus(): { isRecovering: boolean; attemptCount: number } {
    return {
      isRecovering: this.isRecovering,
      attemptCount: this.attemptCount,
    };
  }
}
```

### Offline Queue

```typescript
// src/lib/offline-queue.ts

interface QueuedMessage {
  id: string;
  instanceId: string;
  content: string;
  timestamp: number;
  attempts: number;
}

export class OfflineQueue {
  private static STORAGE_KEY = 'flowchat_offline_queue';
  private static MAX_QUEUE_SIZE = 10;
  private static MAX_AGE_MS = 24 * 60 * 60 * 1000; // 24 hours
  
  /**
   * Add message to offline queue
   */
  static enqueue(instanceId: string, content: string): string {
    const queue = this.getQueue();
    
    const message: QueuedMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      instanceId,
      content,
      timestamp: Date.now(),
      attempts: 0,
    };
    
    queue.push(message);
    
    // Trim to max size
    while (queue.length > this.MAX_QUEUE_SIZE) {
      queue.shift();
    }
    
    this.saveQueue(queue);
    return message.id;
  }
  
  /**
   * Get all queued messages
   */
  static getQueue(): QueuedMessage[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return [];
      
      const queue: QueuedMessage[] = JSON.parse(stored);
      
      // Filter out expired messages
      const now = Date.now();
      return queue.filter(msg => now - msg.timestamp < this.MAX_AGE_MS);
    } catch {
      return [];
    }
  }
  
  /**
   * Get pending messages for instance
   */
  static getPending(instanceId: string): QueuedMessage[] {
    return this.getQueue().filter(msg => msg.instanceId === instanceId);
  }
  
  /**
   * Remove message from queue (after successful send)
   */
  static dequeue(messageId: string): void {
    const queue = this.getQueue().filter(msg => msg.id !== messageId);
    this.saveQueue(queue);
  }
  
  /**
   * Increment attempt count
   */
  static incrementAttempts(messageId: string): number {
    const queue = this.getQueue();
    const message = queue.find(msg => msg.id === messageId);
    
    if (message) {
      message.attempts++;
      this.saveQueue(queue);
      return message.attempts;
    }
    
    return 0;
  }
  
  /**
   * Clear all queued messages
   */
  static clear(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
  
  /**
   * Save queue to storage
   */
  private static saveQueue(queue: QueuedMessage[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(queue));
    } catch (e) {
      console.warn('Failed to save offline queue:', e);
    }
  }
  
  /**
   * Check if there are pending messages
   */
  static hasPending(): boolean {
    return this.getQueue().length > 0;
  }
  
  /**
   * Get queue size
   */
  static size(): number {
    return this.getQueue().length;
  }
}
```

### Network Status Monitor

```typescript
// src/hooks/useNetworkStatus.ts

import { useState, useEffect, useCallback } from 'react';
import { errorHandler } from '../lib/error-handler';
import { ErrorCodes } from '../constants/error-codes';

interface NetworkStatus {
  isOnline: boolean;
  wasOffline: boolean;
  connectionType?: string;
  effectiveType?: string;
}

export function useNetworkStatus(): NetworkStatus {
  const [status, setStatus] = useState<NetworkStatus>({
    isOnline: navigator.onLine,
    wasOffline: false,
  });
  
  const updateStatus = useCallback((online: boolean) => {
    setStatus(prev => ({
      isOnline: online,
      wasOffline: prev.wasOffline || !online,
      connectionType: (navigator as any).connection?.type,
      effectiveType: (navigator as any).connection?.effectiveType,
    }));
    
    if (!online) {
      errorHandler.createError(ErrorCodes.NETWORK_OFFLINE);
    }
  }, []);
  
  useEffect(() => {
    const handleOnline = () => updateStatus(true);
    const handleOffline = () => updateStatus(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Monitor connection changes
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', () => {
        setStatus(prev => ({
          ...prev,
          connectionType: connection.type,
          effectiveType: connection.effectiveType,
        }));
      });
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updateStatus]);
  
  return status;
}
```

---

## Admin Error Dashboard

### Recent Errors View

```php
<?php
// includes/admin/class-error-dashboard.php

namespace FlowChat\Admin;

class Error_Dashboard {
    
    public function __construct() {
        add_action('admin_menu', [$this, 'add_submenu']);
        add_action('wp_ajax_flowchat_clear_errors', [$this, 'clear_errors']);
    }
    
    public function add_submenu() {
        add_submenu_page(
            'flowchat',
            __('Error Log', 'flowchat'),
            __('Error Log', 'flowchat'),
            'manage_options',
            'flowchat-errors',
            [$this, 'render_page']
        );
    }
    
    public function render_page() {
        $errors = get_transient('flowchat_recent_errors') ?: [];
        ?>
        <div class="wrap">
            <h1><?php _e('FlowChat Error Log', 'flowchat'); ?></h1>
            
            <?php if (empty($errors)): ?>
                <p><?php _e('No errors recorded.', 'flowchat'); ?></p>
            <?php else: ?>
                <p>
                    <button type="button" id="flowchat-clear-errors" class="button">
                        <?php _e('Clear Error Log', 'flowchat'); ?>
                    </button>
                </p>
                
                <table class="wp-list-table widefat fixed striped">
                    <thead>
                        <tr>
                            <th style="width: 150px;"><?php _e('Time', 'flowchat'); ?></th>
                            <th style="width: 100px;"><?php _e('Code', 'flowchat'); ?></th>
                            <th><?php _e('Message', 'flowchat'); ?></th>
                            <th style="width: 200px;"><?php _e('Details', 'flowchat'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($errors as $error): ?>
                            <tr>
                                <td>
                                    <?php echo esc_html(
                                        wp_date('Y-m-d H:i:s', $error['timestamp'])
                                    ); ?>
                                </td>
                                <td>
                                    <code><?php echo esc_html($error['code']); ?></code>
                                </td>
                                <td><?php echo esc_html($error['message']); ?></td>
                                <td>
                                    <?php if (!empty($error['data']['details'])): ?>
                                        <details>
                                            <summary><?php _e('View', 'flowchat'); ?></summary>
                                            <pre><?php 
                                                echo esc_html(
                                                    wp_json_encode($error['data']['details'], JSON_PRETTY_PRINT)
                                                ); 
                                            ?></pre>
                                        </details>
                                    <?php endif; ?>
                                </td>
                            </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            <?php endif; ?>
        </div>
        
        <script>
        jQuery(document).ready(function($) {
            $('#flowchat-clear-errors').on('click', function() {
                if (confirm('<?php _e('Clear all error logs?', 'flowchat'); ?>')) {
                    $.post(ajaxurl, {
                        action: 'flowchat_clear_errors',
                        nonce: '<?php echo wp_create_nonce('flowchat_clear_errors'); ?>'
                    }, function() {
                        location.reload();
                    });
                }
            });
        });
        </script>
        <?php
    }
    
    public function clear_errors() {
        check_ajax_referer('flowchat_clear_errors', 'nonce');
        
        if (!current_user_can('manage_options')) {
            wp_die('Unauthorized');
        }
        
        delete_transient('flowchat_recent_errors');
        wp_send_json_success();
    }
}
```

---

## Error Messages Customization UI

```tsx
// src/admin/components/ErrorMessagesEditor/ErrorMessagesEditor.tsx

import React, { useState } from 'react';
import { useSettings } from '../../hooks/useSettings';

const errorMessageFields = [
  { key: 'network_offline', label: 'Network Offline', default: 'You appear to be offline...' },
  { key: 'network_timeout', label: 'Network Timeout', default: 'The request timed out...' },
  { key: 'connection_failed', label: 'Connection Failed', default: 'Unable to connect...' },
  { key: 'n8n_unavailable', label: 'Service Unavailable', default: 'Chat service is temporarily unavailable...' },
  { key: 'n8n_timeout', label: 'Response Timeout', default: 'Response is taking longer than expected...' },
  { key: 'n8n_error', label: 'Processing Error', default: 'An error occurred processing your message...' },
  { key: 'rate_limited', label: 'Rate Limited', default: 'You\'re sending messages too quickly...' },
  { key: 'session_expired', label: 'Session Expired', default: 'Your session has expired...' },
  { key: 'login_required', label: 'Login Required', default: 'Please log in to use this chat.' },
  { key: 'access_denied', label: 'Access Denied', default: 'You don\'t have permission...' },
  { key: 'generic_error', label: 'Generic Error', default: 'Something went wrong. Please try again.' },
];

export const ErrorMessagesEditor: React.FC = () => {
  const { settings, updateSettings, isSaving } = useSettings();
  const [messages, setMessages] = useState(settings.errorMessages || {});
  
  const handleChange = (key: string, value: string) => {
    setMessages(prev => ({
      ...prev,
      [key]: value,
    }));
  };
  
  const handleSave = async () => {
    await updateSettings({ errorMessages: messages });
  };
  
  const handleReset = (key: string) => {
    setMessages(prev => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };
  
  return (
    <div className="flowchat-error-messages-editor">
      <h3>Error Messages</h3>
      <p className="description">
        Customize the error messages shown to users. Leave blank to use defaults.
      </p>
      
      <table className="form-table">
        <tbody>
          {errorMessageFields.map(field => (
            <tr key={field.key}>
              <th scope="row">
                <label htmlFor={`error-${field.key}`}>{field.label}</label>
              </th>
              <td>
                <input
                  type="text"
                  id={`error-${field.key}`}
                  className="regular-text"
                  value={messages[field.key] || ''}
                  placeholder={field.default}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                />
                {messages[field.key] && (
                  <button
                    type="button"
                    className="button-link"
                    onClick={() => handleReset(field.key)}
                  >
                    Reset to default
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      <p className="submit">
        <button
          type="button"
          className="button button-primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? 'Saving...' : 'Save Messages'}
        </button>
      </p>
    </div>
  );
};
```

---

## CSS Styles

```css
/* src/styles/error.css */

/* Error Message */
.flowchat-error {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  padding: var(--flowchat-spacing-md);
  border-radius: var(--flowchat-radius-md);
  margin: var(--flowchat-spacing-sm) 0;
  animation: flowchat-error-appear 0.2s ease;
}

.flowchat-error--warning {
  background-color: #fef3cd;
  border: 1px solid #ffc107;
  color: #856404;
}

.flowchat-error--error {
  background-color: #f8d7da;
  border: 1px solid #dc3545;
  color: #721c24;
}

.flowchat-error--critical {
  background-color: #721c24;
  border: 1px solid #dc3545;
  color: #fff;
}

.flowchat-error-content {
  display: flex;
  align-items: flex-start;
  gap: var(--flowchat-spacing-sm);
}

.flowchat-error-icon {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
}

.flowchat-error-message {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
}

.flowchat-error-retry-info {
  margin: 4px 0 0;
  font-size: 12px;
  opacity: 0.8;
}

.flowchat-error-actions {
  display: flex;
  align-items: center;
  gap: var(--flowchat-spacing-xs);
}

.flowchat-error-retry-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 12px;
  border: none;
  border-radius: var(--flowchat-radius-sm);
  background: rgba(0, 0, 0, 0.1);
  color: inherit;
  font-size: 13px;
  cursor: pointer;
  transition: background-color 0.15s;
}

.flowchat-error-retry-btn:hover {
  background: rgba(0, 0, 0, 0.2);
}

.flowchat-error-dismiss-btn {
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
  opacity: 0.6;
  transition: opacity 0.15s;
}

.flowchat-error-dismiss-btn:hover {
  opacity: 1;
}

/* Compact Error */
.flowchat-error-compact {
  display: flex;
  align-items: center;
  gap: var(--flowchat-spacing-xs);
  padding: var(--flowchat-spacing-xs) var(--flowchat-spacing-sm);
  font-size: 13px;
}

.flowchat-error-compact .flowchat-error-icon {
  width: 16px;
  height: 16px;
}

.flowchat-error-retry-inline {
  padding: 2px;
  border: none;
  background: none;
  color: inherit;
  cursor: pointer;
  opacity: 0.6;
}

.flowchat-error-retry-inline:hover {
  opacity: 1;
}

/* Toast Container */
.flowchat-toast-container {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 100001;
  display: flex;
  flex-direction: column-reverse;
  gap: var(--flowchat-spacing-sm);
  max-width: 400px;
}

.flowchat-toast {
  animation: flowchat-toast-slide-in 0.3s ease;
}

/* Error Boundary */
.flowchat-error-boundary {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  padding: var(--flowchat-spacing-lg);
  text-align: center;
}

.flowchat-error-boundary-content h3 {
  margin: 0 0 var(--flowchat-spacing-sm);
  font-size: 18px;
}

.flowchat-error-boundary-content p {
  margin: 0 0 var(--flowchat-spacing-md);
  color: var(--flowchat-text-secondary);
}

.flowchat-error-boundary-content button {
  padding: var(--flowchat-spacing-sm) var(--flowchat-spacing-lg);
  border: none;
  border-radius: var(--flowchat-radius-md);
  background: var(--flowchat-primary);
  color: #fff;
  cursor: pointer;
}

/* Animations */
@keyframes flowchat-error-appear {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes flowchat-toast-slide-in {
  from {
    opacity: 0;
    transform: translateX(100%);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}
```

---

## Testing Error Scenarios

### Debug Mode

```php
<?php
// includes/class-debug-mode.php

namespace FlowChat;

class Debug_Mode {
    
    public static function is_enabled(): bool {
        return defined('FLOWCHAT_DEBUG') && FLOWCHAT_DEBUG;
    }
    
    /**
     * Simulate error for testing
     */
    public static function simulate_error(string $error_type): void {
        if (!self::is_enabled() || !current_user_can('manage_options')) {
            return;
        }
        
        switch ($error_type) {
            case 'network':
                // Frontend will handle via query param
                break;
            case 'n8n_timeout':
                sleep(35); // Exceed typical timeout
                break;
            case 'rate_limit':
                header('HTTP/1.1 429 Too Many Requests');
                header('Retry-After: 60');
                exit;
            case 'server_error':
                header('HTTP/1.1 500 Internal Server Error');
                exit;
        }
    }
}
```

### Error Simulation for Development

```typescript
// src/lib/error-simulator.ts (development only)

export class ErrorSimulator {
  static enabled = process.env.NODE_ENV === 'development';
  
  static simulateFromUrl(): void {
    if (!this.enabled) return;
    
    const params = new URLSearchParams(window.location.search);
    const errorType = params.get('flowchat_simulate_error');
    
    if (errorType) {
      this.simulate(errorType);
    }
  }
  
  static simulate(errorType: string): void {
    const { errorHandler } = await import('./error-handler');
    const { ErrorCodes } = await import('../constants/error-codes');
    
    switch (errorType) {
      case 'offline':
        errorHandler.createError(ErrorCodes.NETWORK_OFFLINE);
        break;
      case 'timeout':
        errorHandler.createError(ErrorCodes.NETWORK_TIMEOUT);
        break;
      case 'n8n':
        errorHandler.createError(ErrorCodes.N8N_CONNECTION_FAILED);
        break;
      case 'rate':
        errorHandler.createError(ErrorCodes.RATE_LIMIT_MESSAGE);
        break;
      case 'auth':
        errorHandler.createError(ErrorCodes.AUTH_SESSION_EXPIRED);
        break;
    }
  }
}
```

---

This completes the error handling specification with comprehensive coverage of error types, recovery strategies, and user-facing messages.
