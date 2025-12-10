/**
 * FlowChat Error Handling System
 *
 * Centralized error management for the frontend with
 * user-friendly messages and recovery strategies.
 */

export type ErrorCategory =
  | 'connection'
  | 'authentication'
  | 'validation'
  | 'file'
  | 'configuration'
  | 'rate_limit'
  | 'session'
  | 'internal'
  | 'external';

export type RecoveryAction =
  | 'retry'
  | 'refresh'
  | 'login'
  | 'reconnect'
  | 'new_session'
  | 'fallback'
  | 'wait'
  | 'none';

export interface FlowChatError {
  code: string;
  category: ErrorCategory;
  message: string;
  recovery: RecoveryAction;
  retryable: boolean;
  fallback: boolean;
  originalError?: Error;
  context?: Record<string, unknown>;
}

export interface ErrorDefinition {
  category: ErrorCategory;
  message: string;
  userMessage: string;
  recovery: RecoveryAction;
}

/**
 * Error code definitions matching PHP backend
 */
const ERROR_DEFINITIONS: Record<string, ErrorDefinition> = {
  // Connection errors (E1xxx)
  E1001: {
    category: 'connection',
    message: 'Unable to connect to the chat service',
    userMessage: "We're having trouble connecting. Please try again in a moment.",
    recovery: 'retry',
  },
  E1002: {
    category: 'connection',
    message: 'Connection timeout',
    userMessage: 'The connection timed out. Please check your internet and try again.',
    recovery: 'retry',
  },
  E1003: {
    category: 'connection',
    message: 'Webhook URL unreachable',
    userMessage: 'Chat service is temporarily unavailable. Please try again later.',
    recovery: 'fallback',
  },
  E1004: {
    category: 'connection',
    message: 'SSL/TLS certificate error',
    userMessage: 'Secure connection failed. Please contact support.',
    recovery: 'none',
  },
  E1005: {
    category: 'connection',
    message: 'DNS resolution failed',
    userMessage: 'Unable to reach the chat service. Please try again.',
    recovery: 'retry',
  },

  // Authentication errors (E2xxx)
  E2001: {
    category: 'authentication',
    message: 'User not authenticated',
    userMessage: 'Please log in to use the chat.',
    recovery: 'login',
  },
  E2002: {
    category: 'authentication',
    message: 'Insufficient permissions',
    userMessage: "You don't have permission to access this chat.",
    recovery: 'none',
  },
  E2003: {
    category: 'authentication',
    message: 'Session expired',
    userMessage: 'Your session has expired. Please refresh the page.',
    recovery: 'refresh',
  },
  E2004: {
    category: 'authentication',
    message: 'Invalid nonce',
    userMessage: 'Security verification failed. Please refresh and try again.',
    recovery: 'refresh',
  },
  E2005: {
    category: 'authentication',
    message: 'JWT token invalid or expired',
    userMessage: 'Your session has expired. Reconnecting...',
    recovery: 'reconnect',
  },

  // Validation errors (E3xxx)
  E3001: {
    category: 'validation',
    message: 'Message is empty',
    userMessage: 'Please enter a message.',
    recovery: 'none',
  },
  E3002: {
    category: 'validation',
    message: 'Message too long',
    userMessage: 'Your message is too long. Please shorten it.',
    recovery: 'none',
  },
  E3003: {
    category: 'validation',
    message: 'Invalid instance ID',
    userMessage: 'Chat configuration error. Please contact support.',
    recovery: 'none',
  },
  E3004: {
    category: 'validation',
    message: 'Invalid session ID',
    userMessage: 'Session error. Starting a new conversation...',
    recovery: 'new_session',
  },
  E3005: {
    category: 'validation',
    message: 'Invalid input format',
    userMessage: 'Invalid input. Please check and try again.',
    recovery: 'none',
  },

  // File errors (E4xxx)
  E4001: {
    category: 'file',
    message: 'File too large',
    userMessage: 'File is too large. Maximum size is {max_size}.',
    recovery: 'none',
  },
  E4002: {
    category: 'file',
    message: 'Invalid file type',
    userMessage: 'This file type is not allowed.',
    recovery: 'none',
  },
  E4003: {
    category: 'file',
    message: 'File upload failed',
    userMessage: 'Failed to upload file. Please try again.',
    recovery: 'retry',
  },
  E4004: {
    category: 'file',
    message: 'File not found',
    userMessage: 'The file could not be found.',
    recovery: 'none',
  },
  E4005: {
    category: 'file',
    message: 'Too many files',
    userMessage: 'Too many files. Maximum is {max_files} files.',
    recovery: 'none',
  },

  // Configuration errors (E5xxx)
  E5001: {
    category: 'configuration',
    message: 'Instance not found',
    userMessage: 'Chat is not configured. Please contact the site administrator.',
    recovery: 'none',
  },
  E5002: {
    category: 'configuration',
    message: 'Webhook URL not configured',
    userMessage: 'Chat service is not configured. Please contact support.',
    recovery: 'none',
  },
  E5003: {
    category: 'configuration',
    message: 'Invalid configuration',
    userMessage: 'Configuration error. Please contact support.',
    recovery: 'none',
  },
  E5004: {
    category: 'configuration',
    message: 'Feature disabled',
    userMessage: 'This feature is not available.',
    recovery: 'none',
  },

  // Rate limit errors (E6xxx)
  E6001: {
    category: 'rate_limit',
    message: 'Too many requests',
    userMessage: 'Too many messages. Please wait a moment before sending another.',
    recovery: 'wait',
  },
  E6002: {
    category: 'rate_limit',
    message: 'Daily limit reached',
    userMessage: "You've reached your daily message limit. Please try again tomorrow.",
    recovery: 'none',
  },
  E6003: {
    category: 'rate_limit',
    message: 'Concurrent request limit',
    userMessage: 'Please wait for the current response to complete.',
    recovery: 'wait',
  },

  // Session errors (E7xxx)
  E7001: {
    category: 'session',
    message: 'Session creation failed',
    userMessage: 'Failed to start chat session. Please refresh the page.',
    recovery: 'refresh',
  },
  E7002: {
    category: 'session',
    message: 'Session not found',
    userMessage: 'Session not found. Starting a new conversation...',
    recovery: 'new_session',
  },
  E7003: {
    category: 'session',
    message: 'Session locked',
    userMessage: 'This session is being used elsewhere.',
    recovery: 'none',
  },

  // Internal errors (E8xxx)
  E8001: {
    category: 'internal',
    message: 'Database error',
    userMessage: 'An error occurred. Please try again.',
    recovery: 'retry',
  },
  E8002: {
    category: 'internal',
    message: 'Plugin error',
    userMessage: 'An unexpected error occurred. Please try again.',
    recovery: 'retry',
  },
  E8003: {
    category: 'internal',
    message: 'Memory limit exceeded',
    userMessage: 'Service temporarily unavailable. Please try again.',
    recovery: 'retry',
  },

  // External errors (E9xxx)
  E9001: {
    category: 'external',
    message: 'n8n workflow error',
    userMessage: 'The chat service encountered an error. Please try again.',
    recovery: 'retry',
  },
  E9002: {
    category: 'external',
    message: 'n8n response invalid',
    userMessage: 'Received an invalid response. Please try again.',
    recovery: 'retry',
  },
  E9003: {
    category: 'external',
    message: 'n8n service unavailable',
    userMessage: 'Chat service is temporarily unavailable. Please try again later.',
    recovery: 'fallback',
  },
  E9004: {
    category: 'external',
    message: 'AI provider error',
    userMessage: 'The AI service is experiencing issues. Please try again.',
    recovery: 'retry',
  },
};

/**
 * Create a FlowChat error from code
 */
export function createError(
  code: string,
  context?: Record<string, unknown>,
  originalError?: Error
): FlowChatError {
  const definition = ERROR_DEFINITIONS[code] || {
    category: 'internal' as ErrorCategory,
    message: 'Unknown error',
    userMessage: 'An unexpected error occurred.',
    recovery: 'none' as RecoveryAction,
  };

  let message = definition.userMessage;

  // Process placeholders
  if (context) {
    Object.entries(context).forEach(([key, value]) => {
      message = message.replace(`{${key}}`, String(value));
    });
  }

  return {
    code,
    category: definition.category,
    message,
    recovery: definition.recovery,
    retryable: definition.recovery === 'retry',
    fallback: definition.recovery === 'fallback',
    originalError,
    context,
  };
}

/**
 * Create error from API response
 */
export function createErrorFromResponse(response: {
  error?: {
    code?: string;
    message?: string;
    recovery?: RecoveryAction;
  };
}): FlowChatError {
  if (!response.error) {
    return createError('E8002');
  }

  const { code, message, recovery } = response.error;

  if (code && ERROR_DEFINITIONS[code]) {
    return createError(code);
  }

  return {
    code: code || 'UNKNOWN',
    category: 'internal',
    message: message || 'An unexpected error occurred.',
    recovery: recovery || 'none',
    retryable: recovery === 'retry',
    fallback: recovery === 'fallback',
  };
}

/**
 * Create error from network failure
 */
export function createNetworkError(originalError: Error): FlowChatError {
  // Check for specific error types
  if (originalError.name === 'AbortError') {
    return createError('E1002', undefined, originalError);
  }

  if (originalError.message.includes('Failed to fetch')) {
    return createError('E1001', undefined, originalError);
  }

  if (originalError.message.includes('NetworkError')) {
    return createError('E1003', undefined, originalError);
  }

  return createError('E1001', undefined, originalError);
}

/**
 * Check if error is retryable
 */
export function isRetryable(error: FlowChatError): boolean {
  return error.retryable;
}

/**
 * Check if error should trigger fallback
 */
export function shouldFallback(error: FlowChatError): boolean {
  return error.fallback;
}

/**
 * Get recovery action for error
 */
export function getRecoveryAction(error: FlowChatError): RecoveryAction {
  return error.recovery;
}

/**
 * Error class for FlowChat
 */
export class FlowChatException extends Error {
  public readonly error: FlowChatError;

  constructor(error: FlowChatError) {
    super(error.message);
    this.name = 'FlowChatException';
    this.error = error;
  }

  get code(): string {
    return this.error.code;
  }

  get category(): ErrorCategory {
    return this.error.category;
  }

  get recovery(): RecoveryAction {
    return this.error.recovery;
  }

  get isRetryable(): boolean {
    return this.error.retryable;
  }

  get shouldFallback(): boolean {
    return this.error.fallback;
  }
}

/**
 * Retry helper with exponential backoff
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    shouldRetry?: (error: FlowChatError) => boolean;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    shouldRetry = isRetryable,
  } = options;

  let lastError: FlowChatError | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const error =
        err instanceof FlowChatException
          ? err.error
          : createNetworkError(err instanceof Error ? err : new Error(String(err)));

      lastError = error;

      if (attempt === maxRetries || !shouldRetry(error)) {
        throw new FlowChatException(error);
      }

      // Exponential backoff with jitter
      const delay = Math.min(baseDelay * Math.pow(2, attempt) + Math.random() * 1000, maxDelay);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new FlowChatException(lastError || createError('E8002'));
}

/**
 * Format error for display
 */
export function formatErrorForDisplay(error: FlowChatError): {
  title: string;
  message: string;
  showRetry: boolean;
  showRefresh: boolean;
  showLogin: boolean;
} {
  const titles: Record<ErrorCategory, string> = {
    connection: 'Connection Error',
    authentication: 'Authentication Required',
    validation: 'Invalid Input',
    file: 'File Error',
    configuration: 'Configuration Error',
    rate_limit: 'Rate Limited',
    session: 'Session Error',
    internal: 'Error',
    external: 'Service Error',
  };

  return {
    title: titles[error.category] || 'Error',
    message: error.message,
    showRetry: error.retryable,
    showRefresh: error.recovery === 'refresh' || error.recovery === 'reconnect',
    showLogin: error.recovery === 'login',
  };
}
