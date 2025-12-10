<?php
/**
 * Error Handler for FlowChat
 *
 * Centralized error handling with user-friendly messages,
 * logging, and recovery strategies.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Error Handler class
 */
class Error_Handler {

    /**
     * Error categories and code ranges
     */
    const CATEGORY_CONNECTION = 'connection';    // E1xxx
    const CATEGORY_AUTH = 'authentication';      // E2xxx
    const CATEGORY_VALIDATION = 'validation';    // E3xxx
    const CATEGORY_FILE = 'file';                // E4xxx
    const CATEGORY_CONFIG = 'configuration';     // E5xxx
    const CATEGORY_RATE_LIMIT = 'rate_limit';    // E6xxx
    const CATEGORY_SESSION = 'session';          // E7xxx
    const CATEGORY_INTERNAL = 'internal';        // E8xxx
    const CATEGORY_EXTERNAL = 'external';        // E9xxx

    /**
     * Error codes and their details
     */
    private static array $error_definitions = [
        // Connection errors (E1xxx)
        'E1001' => [
            'category' => self::CATEGORY_CONNECTION,
            'message' => 'Unable to connect to the chat service',
            'user_message' => 'We\'re having trouble connecting. Please try again in a moment.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E1002' => [
            'category' => self::CATEGORY_CONNECTION,
            'message' => 'Connection timeout',
            'user_message' => 'The connection timed out. Please check your internet and try again.',
            'recovery' => 'retry',
            'log_level' => 'warning',
        ],
        'E1003' => [
            'category' => self::CATEGORY_CONNECTION,
            'message' => 'Webhook URL unreachable',
            'user_message' => 'Chat service is temporarily unavailable. Please try again later.',
            'recovery' => 'fallback',
            'log_level' => 'error',
        ],
        'E1004' => [
            'category' => self::CATEGORY_CONNECTION,
            'message' => 'SSL/TLS certificate error',
            'user_message' => 'Secure connection failed. Please contact support.',
            'recovery' => 'none',
            'log_level' => 'error',
        ],
        'E1005' => [
            'category' => self::CATEGORY_CONNECTION,
            'message' => 'DNS resolution failed',
            'user_message' => 'Unable to reach the chat service. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],

        // Authentication errors (E2xxx)
        'E2001' => [
            'category' => self::CATEGORY_AUTH,
            'message' => 'User not authenticated',
            'user_message' => 'Please log in to use the chat.',
            'recovery' => 'login',
            'log_level' => 'info',
        ],
        'E2002' => [
            'category' => self::CATEGORY_AUTH,
            'message' => 'Insufficient permissions',
            'user_message' => 'You don\'t have permission to access this chat.',
            'recovery' => 'none',
            'log_level' => 'warning',
        ],
        'E2003' => [
            'category' => self::CATEGORY_AUTH,
            'message' => 'Session expired',
            'user_message' => 'Your session has expired. Please refresh the page.',
            'recovery' => 'refresh',
            'log_level' => 'info',
        ],
        'E2004' => [
            'category' => self::CATEGORY_AUTH,
            'message' => 'Invalid nonce',
            'user_message' => 'Security verification failed. Please refresh and try again.',
            'recovery' => 'refresh',
            'log_level' => 'warning',
        ],
        'E2005' => [
            'category' => self::CATEGORY_AUTH,
            'message' => 'JWT token invalid or expired',
            'user_message' => 'Your session has expired. Reconnecting...',
            'recovery' => 'reconnect',
            'log_level' => 'info',
        ],

        // Validation errors (E3xxx)
        'E3001' => [
            'category' => self::CATEGORY_VALIDATION,
            'message' => 'Message is empty',
            'user_message' => 'Please enter a message.',
            'recovery' => 'none',
            'log_level' => 'debug',
        ],
        'E3002' => [
            'category' => self::CATEGORY_VALIDATION,
            'message' => 'Message too long',
            'user_message' => 'Your message is too long. Please shorten it.',
            'recovery' => 'none',
            'log_level' => 'debug',
        ],
        'E3003' => [
            'category' => self::CATEGORY_VALIDATION,
            'message' => 'Invalid instance ID',
            'user_message' => 'Chat configuration error. Please contact support.',
            'recovery' => 'none',
            'log_level' => 'error',
        ],
        'E3004' => [
            'category' => self::CATEGORY_VALIDATION,
            'message' => 'Invalid session ID',
            'user_message' => 'Session error. Starting a new conversation...',
            'recovery' => 'new_session',
            'log_level' => 'warning',
        ],
        'E3005' => [
            'category' => self::CATEGORY_VALIDATION,
            'message' => 'Invalid input format',
            'user_message' => 'Invalid input. Please check and try again.',
            'recovery' => 'none',
            'log_level' => 'warning',
        ],

        // File errors (E4xxx)
        'E4001' => [
            'category' => self::CATEGORY_FILE,
            'message' => 'File too large',
            'user_message' => 'File is too large. Maximum size is {max_size}.',
            'recovery' => 'none',
            'log_level' => 'info',
        ],
        'E4002' => [
            'category' => self::CATEGORY_FILE,
            'message' => 'Invalid file type',
            'user_message' => 'This file type is not allowed.',
            'recovery' => 'none',
            'log_level' => 'info',
        ],
        'E4003' => [
            'category' => self::CATEGORY_FILE,
            'message' => 'File upload failed',
            'user_message' => 'Failed to upload file. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E4004' => [
            'category' => self::CATEGORY_FILE,
            'message' => 'File not found',
            'user_message' => 'The file could not be found.',
            'recovery' => 'none',
            'log_level' => 'warning',
        ],
        'E4005' => [
            'category' => self::CATEGORY_FILE,
            'message' => 'Too many files',
            'user_message' => 'Too many files. Maximum is {max_files} files.',
            'recovery' => 'none',
            'log_level' => 'info',
        ],

        // Configuration errors (E5xxx)
        'E5001' => [
            'category' => self::CATEGORY_CONFIG,
            'message' => 'Instance not found',
            'user_message' => 'Chat is not configured. Please contact the site administrator.',
            'recovery' => 'none',
            'log_level' => 'error',
        ],
        'E5002' => [
            'category' => self::CATEGORY_CONFIG,
            'message' => 'Webhook URL not configured',
            'user_message' => 'Chat service is not configured. Please contact support.',
            'recovery' => 'none',
            'log_level' => 'error',
        ],
        'E5003' => [
            'category' => self::CATEGORY_CONFIG,
            'message' => 'Invalid configuration',
            'user_message' => 'Configuration error. Please contact support.',
            'recovery' => 'none',
            'log_level' => 'error',
        ],
        'E5004' => [
            'category' => self::CATEGORY_CONFIG,
            'message' => 'Feature disabled',
            'user_message' => 'This feature is not available.',
            'recovery' => 'none',
            'log_level' => 'info',
        ],

        // Rate limit errors (E6xxx)
        'E6001' => [
            'category' => self::CATEGORY_RATE_LIMIT,
            'message' => 'Too many requests',
            'user_message' => 'Too many messages. Please wait a moment before sending another.',
            'recovery' => 'wait',
            'log_level' => 'warning',
        ],
        'E6002' => [
            'category' => self::CATEGORY_RATE_LIMIT,
            'message' => 'Daily limit reached',
            'user_message' => 'You\'ve reached your daily message limit. Please try again tomorrow.',
            'recovery' => 'none',
            'log_level' => 'info',
        ],
        'E6003' => [
            'category' => self::CATEGORY_RATE_LIMIT,
            'message' => 'Concurrent request limit',
            'user_message' => 'Please wait for the current response to complete.',
            'recovery' => 'wait',
            'log_level' => 'info',
        ],

        // Session errors (E7xxx)
        'E7001' => [
            'category' => self::CATEGORY_SESSION,
            'message' => 'Session creation failed',
            'user_message' => 'Failed to start chat session. Please refresh the page.',
            'recovery' => 'refresh',
            'log_level' => 'error',
        ],
        'E7002' => [
            'category' => self::CATEGORY_SESSION,
            'message' => 'Session not found',
            'user_message' => 'Session not found. Starting a new conversation...',
            'recovery' => 'new_session',
            'log_level' => 'warning',
        ],
        'E7003' => [
            'category' => self::CATEGORY_SESSION,
            'message' => 'Session locked',
            'user_message' => 'This session is being used elsewhere.',
            'recovery' => 'none',
            'log_level' => 'warning',
        ],

        // Internal errors (E8xxx)
        'E8001' => [
            'category' => self::CATEGORY_INTERNAL,
            'message' => 'Database error',
            'user_message' => 'An error occurred. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E8002' => [
            'category' => self::CATEGORY_INTERNAL,
            'message' => 'Plugin error',
            'user_message' => 'An unexpected error occurred. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E8003' => [
            'category' => self::CATEGORY_INTERNAL,
            'message' => 'Memory limit exceeded',
            'user_message' => 'Service temporarily unavailable. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],

        // External errors (E9xxx)
        'E9001' => [
            'category' => self::CATEGORY_EXTERNAL,
            'message' => 'n8n workflow error',
            'user_message' => 'The chat service encountered an error. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E9002' => [
            'category' => self::CATEGORY_EXTERNAL,
            'message' => 'n8n response invalid',
            'user_message' => 'Received an invalid response. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
        'E9003' => [
            'category' => self::CATEGORY_EXTERNAL,
            'message' => 'n8n service unavailable',
            'user_message' => 'Chat service is temporarily unavailable. Please try again later.',
            'recovery' => 'fallback',
            'log_level' => 'error',
        ],
        'E9004' => [
            'category' => self::CATEGORY_EXTERNAL,
            'message' => 'AI provider error',
            'user_message' => 'The AI service is experiencing issues. Please try again.',
            'recovery' => 'retry',
            'log_level' => 'error',
        ],
    ];

    /**
     * Log levels
     */
    const LOG_DEBUG = 'debug';
    const LOG_INFO = 'info';
    const LOG_WARNING = 'warning';
    const LOG_ERROR = 'error';

    /**
     * Singleton instance
     */
    private static ?Error_Handler $instance = null;

    /**
     * Whether debug mode is enabled
     */
    private bool $debug_mode = false;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Error_Handler {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->debug_mode = defined('WP_DEBUG') && WP_DEBUG;
    }

    /**
     * Create an error response
     *
     * @param string $code Error code (e.g., 'E1001')
     * @param array  $context Additional context data
     * @return array Error response array
     */
    public function create_error(string $code, array $context = []): array {
        $definition = self::$error_definitions[$code] ?? [
            'category' => self::CATEGORY_INTERNAL,
            'message' => 'Unknown error',
            'user_message' => 'An unexpected error occurred.',
            'recovery' => 'none',
            'log_level' => 'error',
        ];

        // Process placeholders in user message
        $user_message = $this->process_placeholders($definition['user_message'], $context);

        // Log the error
        $this->log_error($code, $definition, $context);

        $error = [
            'success' => false,
            'error' => [
                'code' => $code,
                'category' => $definition['category'],
                'message' => $user_message,
                'recovery' => $definition['recovery'],
            ],
        ];

        // Add debug info if enabled
        if ($this->debug_mode) {
            $error['error']['debug'] = [
                'internal_message' => $definition['message'],
                'context' => $context,
                'timestamp' => current_time('mysql'),
            ];
        }

        return $error;
    }

    /**
     * Create a WP_Error from error code
     *
     * @param string $code Error code
     * @param array  $context Additional context
     * @return \WP_Error
     */
    public function create_wp_error(string $code, array $context = []): \WP_Error {
        $error = $this->create_error($code, $context);

        return new \WP_Error(
            $code,
            $error['error']['message'],
            [
                'status' => $this->get_http_status($code),
                'category' => $error['error']['category'],
                'recovery' => $error['error']['recovery'],
            ]
        );
    }

    /**
     * Create REST API error response
     *
     * @param string $code Error code
     * @param array  $context Additional context
     * @return \WP_REST_Response
     */
    public function create_rest_error(string $code, array $context = []): \WP_REST_Response {
        $error = $this->create_error($code, $context);
        $status = $this->get_http_status($code);

        return new \WP_REST_Response($error, $status);
    }

    /**
     * Get HTTP status code for error
     *
     * @param string $code Error code
     * @return int HTTP status code
     */
    public function get_http_status(string $code): int {
        $definition = self::$error_definitions[$code] ?? null;

        if (!$definition) {
            return 500;
        }

        return match ($definition['category']) {
            self::CATEGORY_AUTH => 401,
            self::CATEGORY_VALIDATION => 400,
            self::CATEGORY_FILE => 400,
            self::CATEGORY_CONFIG => 500,
            self::CATEGORY_RATE_LIMIT => 429,
            self::CATEGORY_SESSION => 400,
            self::CATEGORY_CONNECTION => 503,
            self::CATEGORY_EXTERNAL => 502,
            default => 500,
        };
    }

    /**
     * Log an error
     *
     * @param string $code Error code
     * @param array  $definition Error definition
     * @param array  $context Additional context
     */
    private function log_error(string $code, array $definition, array $context): void {
        $log_level = $definition['log_level'] ?? self::LOG_ERROR;

        // Only log based on level
        if (!$this->should_log($log_level)) {
            return;
        }

        $message = sprintf(
            '[FlowChat] [%s] %s: %s',
            strtoupper($log_level),
            $code,
            $definition['message']
        );

        if (!empty($context)) {
            $message .= ' | Context: ' . wp_json_encode($context);
        }

        // Use WordPress debug log
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log($message);
        }

        // Store in database for admin review
        $this->store_error_log($code, $definition, $context);

        // Fire action for external logging
        do_action('flowchat_error_logged', $code, $definition, $context);
    }

    /**
     * Check if should log based on level
     *
     * @param string $level Log level
     * @return bool
     */
    private function should_log(string $level): bool {
        if (!$this->debug_mode && $level === self::LOG_DEBUG) {
            return false;
        }
        return true;
    }

    /**
     * Store error in database log
     *
     * @param string $code Error code
     * @param array  $definition Error definition
     * @param array  $context Additional context
     */
    private function store_error_log(string $code, array $definition, array $context): void {
        $logs = get_option('flowchat_error_log', []);

        // Keep only last 100 errors
        if (count($logs) >= 100) {
            array_shift($logs);
        }

        $logs[] = [
            'code' => $code,
            'category' => $definition['category'],
            'message' => $definition['message'],
            'context' => $context,
            'timestamp' => current_time('mysql'),
            'user_id' => get_current_user_id(),
            'ip' => $this->get_client_ip(),
        ];

        update_option('flowchat_error_log', $logs, false);
    }

    /**
     * Get client IP address
     *
     * @return string
     */
    private function get_client_ip(): string {
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($ip_keys as $key) {
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field(wp_unslash($_SERVER[$key]));
                // Handle comma-separated IPs (X-Forwarded-For)
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Process placeholders in message
     *
     * @param string $message Message with placeholders
     * @param array  $context Context data
     * @return string Processed message
     */
    private function process_placeholders(string $message, array $context): string {
        foreach ($context as $key => $value) {
            if (is_scalar($value)) {
                $message = str_replace('{' . $key . '}', (string) $value, $message);
            }
        }
        return $message;
    }

    /**
     * Get error logs for admin display
     *
     * @param int $limit Number of logs to return
     * @return array
     */
    public function get_error_logs(int $limit = 50): array {
        $logs = get_option('flowchat_error_log', []);
        return array_slice(array_reverse($logs), 0, $limit);
    }

    /**
     * Clear error logs
     */
    public function clear_error_logs(): void {
        delete_option('flowchat_error_log');
    }

    /**
     * Get error definition
     *
     * @param string $code Error code
     * @return array|null
     */
    public function get_error_definition(string $code): ?array {
        return self::$error_definitions[$code] ?? null;
    }

    /**
     * Get all error codes for a category
     *
     * @param string $category Error category
     * @return array
     */
    public function get_errors_by_category(string $category): array {
        return array_filter(
            self::$error_definitions,
            fn($def) => $def['category'] === $category
        );
    }

    /**
     * Check if error code suggests retry
     *
     * @param string $code Error code
     * @return bool
     */
    public function should_retry(string $code): bool {
        $definition = self::$error_definitions[$code] ?? null;
        return $definition && $definition['recovery'] === 'retry';
    }

    /**
     * Check if error should trigger fallback
     *
     * @param string $code Error code
     * @return bool
     */
    public function should_fallback(string $code): bool {
        $definition = self::$error_definitions[$code] ?? null;
        return $definition && $definition['recovery'] === 'fallback';
    }

    /**
     * Get recovery action for error
     *
     * @param string $code Error code
     * @return string Recovery action
     */
    public function get_recovery_action(string $code): string {
        $definition = self::$error_definitions[$code] ?? null;
        return $definition['recovery'] ?? 'none';
    }

    /**
     * Format error for JavaScript/frontend
     *
     * @param string $code Error code
     * @param array  $context Additional context
     * @return array Frontend-friendly error format
     */
    public function format_for_frontend(string $code, array $context = []): array {
        $error = $this->create_error($code, $context);

        return [
            'code' => $code,
            'message' => $error['error']['message'],
            'recovery' => $error['error']['recovery'],
            'retryable' => $this->should_retry($code),
            'fallback' => $this->should_fallback($code),
        ];
    }
}
