/**
 * RetryManager
 *
 * Handles automatic retry and recovery for failed operations.
 * Per 11-error-handling.md spec.
 */

export interface RetryConfig {
  /** Maximum number of retry attempts */
  maxAttempts: number;
  /** Initial delay in milliseconds */
  initialDelay: number;
  /** Maximum delay in milliseconds */
  maxDelay: number;
  /** Backoff multiplier */
  backoffMultiplier: number;
  /** Whether to add jitter to delays */
  useJitter: boolean;
  /** HTTP status codes that should trigger retry */
  retryableStatuses: number[];
  /** Error codes that should trigger retry */
  retryableErrors: string[];
}

export interface RetryState {
  /** Current attempt number (1-based) */
  attempt: number;
  /** Whether retry is in progress */
  isRetrying: boolean;
  /** Next retry delay in milliseconds */
  nextDelay: number;
  /** Last error encountered */
  lastError: Error | null;
}

export type RetryCallback<T> = () => Promise<T>;

/**
 * Default retry configuration
 */
const DEFAULT_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffMultiplier: 2,
  useJitter: true,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'ENETUNREACH',
    'CONNECTION_TIMEOUT',
    'network_error',
  ],
};

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(
  attempt: number,
  initialDelay: number,
  maxDelay: number,
  multiplier: number,
  useJitter: boolean
): number {
  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const boundedDelay = Math.min(exponentialDelay, maxDelay);

  if (useJitter) {
    // Add random jitter of +/- 25%
    const jitter = boundedDelay * 0.25 * (Math.random() * 2 - 1);
    return Math.round(boundedDelay + jitter);
  }

  return Math.round(boundedDelay);
}

/**
 * Check if an error is retryable
 */
function isRetryable(error: unknown, config: RetryConfig): boolean {
  if (!error) return false;

  // Check HTTP status
  if (typeof error === 'object' && error !== null) {
    const errorObj = error as Record<string, unknown>;
    const status = errorObj.status || errorObj.statusCode;
    if (typeof status === 'number' && config.retryableStatuses.includes(status)) {
      return true;
    }

    // Check error code
    const code = errorObj.code || errorObj.errorCode;
    if (typeof code === 'string' && config.retryableErrors.includes(code)) {
      return true;
    }
  }

  // Check error message for common patterns
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    if (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnreset') ||
      message.includes('fetch failed')
    ) {
      return true;
    }
  }

  return false;
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute a function with retry logic
 */
export async function withRetry<T>(
  fn: RetryCallback<T>,
  config: Partial<RetryConfig> = {},
  onRetry?: (state: RetryState) => void
): Promise<T> {
  const mergedConfig: RetryConfig = { ...DEFAULT_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= mergedConfig.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if we should retry
      if (attempt < mergedConfig.maxAttempts && isRetryable(error, mergedConfig)) {
        const delay = calculateDelay(
          attempt,
          mergedConfig.initialDelay,
          mergedConfig.maxDelay,
          mergedConfig.backoffMultiplier,
          mergedConfig.useJitter
        );

        const state: RetryState = {
          attempt,
          isRetrying: true,
          nextDelay: delay,
          lastError,
        };

        onRetry?.(state);
        await sleep(delay);
      } else {
        // Not retryable or max attempts reached
        throw lastError;
      }
    }
  }

  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * RetryManager class for managing retry operations
 */
export class RetryManager {
  private config: RetryConfig;
  private listeners: Set<(state: RetryState) => void> = new Set();

  constructor(config: Partial<RetryConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a function with retry
   */
  async execute<T>(fn: RetryCallback<T>): Promise<T> {
    return withRetry(fn, this.config, (state) => {
      this.listeners.forEach((listener) => listener(state));
    });
  }

  /**
   * Subscribe to retry events
   */
  onRetry(callback: (state: RetryState) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<RetryConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): RetryConfig {
    return { ...this.config };
  }
}

/**
 * Create a retry manager with custom configuration
 */
export function createRetryManager(config?: Partial<RetryConfig>): RetryManager {
  return new RetryManager(config);
}

export default RetryManager;
