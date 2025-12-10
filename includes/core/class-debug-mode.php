<?php
/**
 * Debug Mode for FlowChat
 *
 * Provides debugging tools and diagnostic information
 * for development and troubleshooting.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Debug Mode class
 */
class Debug_Mode {

    /**
     * Singleton instance
     */
    private static ?Debug_Mode $instance = null;

    /**
     * Whether debug mode is enabled
     */
    private bool $enabled = false;

    /**
     * Debug log entries
     */
    private array $log_entries = [];

    /**
     * Start time for performance tracking
     */
    private float $start_time;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Debug_Mode {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->start_time = microtime(true);
        $this->enabled = $this->is_debug_enabled();

        if ($this->enabled) {
            $this->init_debug_hooks();
        }
    }

    /**
     * Check if debug mode is enabled
     *
     * @return bool
     */
    private function is_debug_enabled(): bool {
        // Check WordPress debug constant
        if (defined('FLOWCHAT_DEBUG') && FLOWCHAT_DEBUG) {
            return true;
        }

        // Check option
        $settings = get_option('flowchat_settings', []);
        if (!empty($settings['debug_mode'])) {
            return true;
        }

        // Check query parameter (only for admins)
        if (isset($_GET['flowchat_debug']) && current_user_can('manage_options')) {
            return true;
        }

        return false;
    }

    /**
     * Initialize debug hooks
     */
    private function init_debug_hooks(): void {
        // Log API requests
        add_action('flowchat_api_request', [$this, 'log_api_request'], 10, 3);
        add_action('flowchat_api_response', [$this, 'log_api_response'], 10, 3);

        // Log errors
        add_action('flowchat_error_logged', [$this, 'log_error'], 10, 3);

        // Log instance events
        add_action('flowchat_instance_matched', [$this, 'log_instance_match'], 10, 2);
        add_action('flowchat_session_created', [$this, 'log_session_created'], 10, 2);

        // Add debug info to footer
        add_action('wp_footer', [$this, 'output_debug_footer'], 999);

        // Add debug panel in admin
        add_action('admin_footer', [$this, 'output_admin_debug'], 999);
    }

    /**
     * Log a debug message
     *
     * @param string $category Log category
     * @param string $message Log message
     * @param array  $context Additional context
     */
    public function log(string $category, string $message, array $context = []): void {
        if (!$this->enabled) {
            return;
        }

        $entry = [
            'timestamp' => microtime(true) - $this->start_time,
            'category' => $category,
            'message' => $message,
            'context' => $context,
            'memory' => memory_get_usage(true),
        ];

        $this->log_entries[] = $entry;

        // Also log to error_log if WP_DEBUG_LOG is enabled
        if (defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            $log_message = sprintf(
                '[FlowChat Debug] [%s] %s',
                $category,
                $message
            );

            if (!empty($context)) {
                $log_message .= ' | ' . wp_json_encode($context);
            }

            error_log($log_message);
        }
    }

    /**
     * Log API request
     *
     * @param string $endpoint Endpoint
     * @param string $method HTTP method
     * @param array  $params Parameters
     */
    public function log_api_request(string $endpoint, string $method, array $params): void {
        $this->log('api', "Request: {$method} {$endpoint}", [
            'params' => $this->sanitize_sensitive_data($params),
        ]);
    }

    /**
     * Log API response
     *
     * @param string $endpoint Endpoint
     * @param int    $status HTTP status
     * @param mixed  $response Response data
     */
    public function log_api_response(string $endpoint, int $status, $response): void {
        $this->log('api', "Response: {$status} {$endpoint}", [
            'response_type' => gettype($response),
            'response_size' => strlen(wp_json_encode($response)),
        ]);
    }

    /**
     * Log error
     *
     * @param string $code Error code
     * @param array  $definition Error definition
     * @param array  $context Error context
     */
    public function log_error(string $code, array $definition, array $context): void {
        $this->log('error', "Error {$code}: {$definition['message']}", $context);
    }

    /**
     * Log instance match
     *
     * @param array  $instance Matched instance
     * @param string $url Current URL
     */
    public function log_instance_match(array $instance, string $url): void {
        $this->log('routing', 'Instance matched', [
            'instance_id' => $instance['id'] ?? 0,
            'instance_name' => $instance['name'] ?? '',
            'url' => $url,
        ]);
    }

    /**
     * Log session created
     *
     * @param string $session_id Session ID
     * @param int    $instance_id Instance ID
     */
    public function log_session_created(string $session_id, int $instance_id): void {
        $this->log('session', 'Session created', [
            'session_id' => $session_id,
            'instance_id' => $instance_id,
        ]);
    }

    /**
     * Sanitize sensitive data from logs
     *
     * @param array $data Data to sanitize
     * @return array Sanitized data
     */
    private function sanitize_sensitive_data(array $data): array {
        $sensitive_keys = ['password', 'token', 'secret', 'api_key', 'webhook_url'];

        foreach ($data as $key => $value) {
            foreach ($sensitive_keys as $sensitive) {
                if (stripos($key, $sensitive) !== false) {
                    $data[$key] = '[REDACTED]';
                    break;
                }
            }

            if (is_array($value)) {
                $data[$key] = $this->sanitize_sensitive_data($value);
            }
        }

        return $data;
    }

    /**
     * Get all log entries
     *
     * @return array Log entries
     */
    public function get_log_entries(): array {
        return $this->log_entries;
    }

    /**
     * Get diagnostic information
     *
     * @return array Diagnostic data
     */
    public function get_diagnostics(): array {
        global $wpdb;

        $instance_manager = Instance_Manager::get_instance();
        $instances = $instance_manager->get_all_instances();

        return [
            'plugin' => [
                'version' => FLOWCHAT_VERSION,
                'debug_mode' => $this->enabled,
                'plugin_dir' => FLOWCHAT_PLUGIN_DIR,
            ],
            'wordpress' => [
                'version' => get_bloginfo('version'),
                'multisite' => is_multisite(),
                'site_url' => site_url(),
                'home_url' => home_url(),
                'timezone' => wp_timezone_string(),
                'language' => get_locale(),
            ],
            'php' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
                'extensions' => [
                    'curl' => extension_loaded('curl'),
                    'json' => extension_loaded('json'),
                    'mbstring' => extension_loaded('mbstring'),
                ],
            ],
            'database' => [
                'version' => $wpdb->db_version(),
                'prefix' => $wpdb->prefix,
                'tables' => $this->check_database_tables(),
            ],
            'instances' => [
                'count' => count($instances),
                'active' => count(array_filter($instances, fn($i) => !empty($i['is_active']))),
            ],
            'theme' => [
                'name' => wp_get_theme()->get('Name'),
                'version' => wp_get_theme()->get('Version'),
                'is_block_theme' => function_exists('wp_is_block_theme') && wp_is_block_theme(),
            ],
            'active_plugins' => $this->get_active_plugins_info(),
            'server' => [
                'software' => sanitize_text_field($_SERVER['SERVER_SOFTWARE'] ?? 'Unknown'),
                'https' => is_ssl(),
            ],
        ];
    }

    /**
     * Check database tables
     *
     * @return array Table status
     */
    private function check_database_tables(): array {
        global $wpdb;

        $tables = [
            'sessions' => $wpdb->prefix . 'flowchat_sessions',
            'messages' => $wpdb->prefix . 'flowchat_messages',
            'fallback_messages' => $wpdb->prefix . 'flowchat_fallback_messages',
        ];

        $status = [];

        foreach ($tables as $name => $table) {
            $exists = $wpdb->get_var(
                $wpdb->prepare("SHOW TABLES LIKE %s", $table)
            ) === $table;

            $status[$name] = [
                'exists' => $exists,
                'table' => $table,
            ];

            if ($exists) {
                $count = $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
                $status[$name]['rows'] = (int) $count;
            }
        }

        return $status;
    }

    /**
     * Get active plugins info
     *
     * @return array Plugin info
     */
    private function get_active_plugins_info(): array {
        $active_plugins = get_option('active_plugins', []);
        $plugins = [];

        foreach ($active_plugins as $plugin) {
            $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin);
            $plugins[] = [
                'name' => $plugin_data['Name'],
                'version' => $plugin_data['Version'],
            ];
        }

        return $plugins;
    }

    /**
     * Test webhook connectivity
     *
     * @param string $webhook_url Webhook URL
     * @return array Test results
     */
    public function test_webhook(string $webhook_url): array {
        $start = microtime(true);

        $response = wp_remote_post($webhook_url, [
            'timeout' => 10,
            'body' => wp_json_encode([
                'action' => 'sendMessage',
                'sessionId' => 'test-' . wp_generate_uuid4(),
                'chatInput' => 'FlowChat connection test',
                '_flowchat_test' => true,
            ]),
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'sslverify' => apply_filters('flowchat_ssl_verify', true),
        ]);

        $duration = round((microtime(true) - $start) * 1000);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'error' => $response->get_error_message(),
                'duration_ms' => $duration,
            ];
        }

        $status = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);

        return [
            'success' => $status >= 200 && $status < 300,
            'status_code' => $status,
            'duration_ms' => $duration,
            'response_size' => strlen($body),
            'response_preview' => substr($body, 0, 500),
        ];
    }

    /**
     * Output debug info in footer
     */
    public function output_debug_footer(): void {
        if (!$this->enabled || !current_user_can('manage_options')) {
            return;
        }

        $execution_time = round((microtime(true) - $this->start_time) * 1000, 2);
        $memory = round(memory_get_peak_usage(true) / 1024 / 1024, 2);

        echo '<!-- FlowChat Debug -->';
        echo '<script>';
        echo 'console.group("FlowChat Debug");';
        echo 'console.log("Execution time: ' . $execution_time . 'ms");';
        echo 'console.log("Peak memory: ' . $memory . 'MB");';
        echo 'console.log("Log entries:", ' . wp_json_encode($this->log_entries) . ');';
        echo 'console.groupEnd();';
        echo '</script>';
        echo '<!-- /FlowChat Debug -->';
    }

    /**
     * Output admin debug panel
     */
    public function output_admin_debug(): void {
        if (!$this->enabled) {
            return;
        }

        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'flowchat') === false) {
            return;
        }

        $diagnostics = $this->get_diagnostics();

        echo '<script>';
        echo 'if (window.flowchatAdmin) {';
        echo '  window.flowchatAdmin.debug = ' . wp_json_encode([
            'enabled' => true,
            'diagnostics' => $diagnostics,
            'log' => $this->log_entries,
        ]) . ';';
        echo '}';
        echo '</script>';
    }

    /**
     * Check if debug mode is enabled
     *
     * @return bool
     */
    public function is_enabled(): bool {
        return $this->enabled;
    }

    /**
     * Generate system report
     *
     * @return string Plain text report
     */
    public function generate_system_report(): string {
        $diagnostics = $this->get_diagnostics();

        $report = "=== FlowChat System Report ===\n\n";
        $report .= "Generated: " . current_time('mysql') . "\n\n";

        // Plugin Info
        $report .= "--- Plugin ---\n";
        $report .= "Version: {$diagnostics['plugin']['version']}\n";
        $report .= "Debug Mode: " . ($diagnostics['plugin']['debug_mode'] ? 'Enabled' : 'Disabled') . "\n\n";

        // WordPress Info
        $report .= "--- WordPress ---\n";
        $report .= "Version: {$diagnostics['wordpress']['version']}\n";
        $report .= "Multisite: " . ($diagnostics['wordpress']['multisite'] ? 'Yes' : 'No') . "\n";
        $report .= "Site URL: {$diagnostics['wordpress']['site_url']}\n";
        $report .= "Language: {$diagnostics['wordpress']['language']}\n\n";

        // PHP Info
        $report .= "--- PHP ---\n";
        $report .= "Version: {$diagnostics['php']['version']}\n";
        $report .= "Memory Limit: {$diagnostics['php']['memory_limit']}\n";
        $report .= "Extensions:\n";
        foreach ($diagnostics['php']['extensions'] as $ext => $loaded) {
            $report .= "  - {$ext}: " . ($loaded ? 'Loaded' : 'Not loaded') . "\n";
        }
        $report .= "\n";

        // Database
        $report .= "--- Database ---\n";
        $report .= "Version: {$diagnostics['database']['version']}\n";
        $report .= "Tables:\n";
        foreach ($diagnostics['database']['tables'] as $name => $info) {
            $status = $info['exists'] ? "OK ({$info['rows']} rows)" : 'MISSING';
            $report .= "  - {$name}: {$status}\n";
        }
        $report .= "\n";

        // Instances
        $report .= "--- Instances ---\n";
        $report .= "Total: {$diagnostics['instances']['count']}\n";
        $report .= "Active: {$diagnostics['instances']['active']}\n\n";

        // Theme
        $report .= "--- Theme ---\n";
        $report .= "Name: {$diagnostics['theme']['name']}\n";
        $report .= "Version: {$diagnostics['theme']['version']}\n";
        $report .= "Block Theme: " . ($diagnostics['theme']['is_block_theme'] ? 'Yes' : 'No') . "\n\n";

        // Plugins
        $report .= "--- Active Plugins ---\n";
        foreach ($diagnostics['active_plugins'] as $plugin) {
            $report .= "- {$plugin['name']} ({$plugin['version']})\n";
        }

        return $report;
    }
}
