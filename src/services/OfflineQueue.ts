/**
 * OfflineQueue
 *
 * Manages queued messages when offline or during connection issues.
 * Per 11-error-handling.md spec.
 */

export interface QueuedMessage {
  /** Unique queue ID */
  id: string;
  /** Instance ID */
  instanceId: string;
  /** Message content */
  content: string;
  /** Attached file URLs */
  attachments: string[];
  /** Queue timestamp */
  queuedAt: number;
  /** Number of send attempts */
  attempts: number;
  /** Last error message */
  lastError?: string;
  /** Message expiry timestamp */
  expiresAt: number;
}

export interface OfflineQueueConfig {
  /** Maximum queue size */
  maxSize: number;
  /** Message expiry time in ms (default 24h) */
  expiryTime: number;
  /** Storage key prefix */
  storageKey: string;
  /** Maximum retry attempts before removing */
  maxAttempts: number;
}

const DEFAULT_CONFIG: OfflineQueueConfig = {
  maxSize: 10,
  expiryTime: 24 * 60 * 60 * 1000, // 24 hours
  storageKey: 'flowchat_offline_queue',
  maxAttempts: 5,
};

/**
 * OfflineQueue class for managing offline messages
 */
export class OfflineQueue {
  private config: OfflineQueueConfig;
  private queue: QueuedMessage[] = [];
  private listeners: Set<(queue: QueuedMessage[]) => void> = new Set();
  private isProcessing = false;
  private sendHandler: ((message: QueuedMessage) => Promise<boolean>) | null = null;

  constructor(config: Partial<OfflineQueueConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.loadFromStorage();
    this.cleanExpired();
  }

  /**
   * Load queue from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.config.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
      }
    } catch {
      this.queue = [];
    }
  }

  /**
   * Save queue to localStorage
   */
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.queue));
    } catch {
      // Storage might be full or unavailable
    }
  }

  /**
   * Clean expired messages
   */
  private cleanExpired(): void {
    const now = Date.now();
    const before = this.queue.length;
    this.queue = this.queue.filter((msg) => msg.expiresAt > now);
    if (this.queue.length !== before) {
      this.saveToStorage();
      this.notifyListeners();
    }
  }

  /**
   * Notify listeners of queue change
   */
  private notifyListeners(): void {
    const queueCopy = [...this.queue];
    this.listeners.forEach((listener) => listener(queueCopy));
  }

  /**
   * Generate unique ID
   */
  private generateId(): string {
    return `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add message to queue
   */
  add(instanceId: string, content: string, attachments: string[] = []): QueuedMessage | null {
    // Check queue size
    if (this.queue.length >= this.config.maxSize) {
      // Remove oldest message
      this.queue.shift();
    }

    const message: QueuedMessage = {
      id: this.generateId(),
      instanceId,
      content,
      attachments,
      queuedAt: Date.now(),
      attempts: 0,
      expiresAt: Date.now() + this.config.expiryTime,
    };

    this.queue.push(message);
    this.saveToStorage();
    this.notifyListeners();

    return message;
  }

  /**
   * Remove message from queue
   */
  remove(id: string): boolean {
    const index = this.queue.findIndex((msg) => msg.id === id);
    if (index === -1) return false;

    this.queue.splice(index, 1);
    this.saveToStorage();
    this.notifyListeners();

    return true;
  }

  /**
   * Get all queued messages
   */
  getAll(): QueuedMessage[] {
    this.cleanExpired();
    return [...this.queue];
  }

  /**
   * Get messages for a specific instance
   */
  getByInstance(instanceId: string): QueuedMessage[] {
    this.cleanExpired();
    return this.queue.filter((msg) => msg.instanceId === instanceId);
  }

  /**
   * Get queue size
   */
  size(): number {
    return this.queue.length;
  }

  /**
   * Check if queue is empty
   */
  isEmpty(): boolean {
    return this.queue.length === 0;
  }

  /**
   * Clear entire queue
   */
  clear(): void {
    this.queue = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Clear queue for specific instance
   */
  clearInstance(instanceId: string): void {
    this.queue = this.queue.filter((msg) => msg.instanceId !== instanceId);
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Set the send handler for processing queue
   */
  setSendHandler(handler: (message: QueuedMessage) => Promise<boolean>): void {
    this.sendHandler = handler;
  }

  /**
   * Process queue (attempt to send all messages)
   */
  async process(): Promise<{ sent: number; failed: number }> {
    if (this.isProcessing || !this.sendHandler) {
      return { sent: 0, failed: 0 };
    }

    this.isProcessing = true;
    let sent = 0;
    let failed = 0;

    try {
      this.cleanExpired();

      for (const message of [...this.queue]) {
        message.attempts++;

        try {
          const success = await this.sendHandler(message);

          if (success) {
            this.remove(message.id);
            sent++;
          } else {
            if (message.attempts >= this.config.maxAttempts) {
              this.remove(message.id);
            } else {
              message.lastError = 'Send failed';
              this.saveToStorage();
            }
            failed++;
          }
        } catch (error) {
          message.lastError = error instanceof Error ? error.message : 'Unknown error';
          if (message.attempts >= this.config.maxAttempts) {
            this.remove(message.id);
          } else {
            this.saveToStorage();
          }
          failed++;
        }
      }
    } finally {
      this.isProcessing = false;
      this.notifyListeners();
    }

    return { sent, failed };
  }

  /**
   * Subscribe to queue changes
   */
  subscribe(callback: (queue: QueuedMessage[]) => void): () => void {
    this.listeners.add(callback);
    // Immediately notify with current queue
    callback([...this.queue]);
    return () => this.listeners.delete(callback);
  }

  /**
   * Check if currently processing
   */
  isCurrentlyProcessing(): boolean {
    return this.isProcessing;
  }
}

/**
 * Create an offline queue instance
 */
export function createOfflineQueue(config?: Partial<OfflineQueueConfig>): OfflineQueue {
  return new OfflineQueue(config);
}

export default OfflineQueue;
