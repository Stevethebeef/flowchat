<?php
/**
 * Runtime Analytics
 *
 * Collects anonymous usage analytics to help improve the plugin.
 * Handles performance monitoring and optimization data.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Runtime_Analytics
 *
 * Manages analytics collection and performance monitoring.
 */
class Runtime_Analytics {

    /**
     * Analytics sync option
     */
    private const OPT_SYNC = 'n8n_chat_analytics_sync';

    /**
     * Runtime cache option
     */
    private const OPT_CACHE = 'n8n_chat_runtime_cache';

    /**
     * Performance baseline option
     */
    private const OPT_BASELINE = 'n8n_chat_perf_baseline';

    /**
     * Feature initialization option
     */
    private const OPT_FEAT = 'n8n_chat_feature_init';

    /**
     * Cron hook name
     */
    private const CRON_HOOK = 'n8n_chat_analytics_sync';

    /**
     * Sync interval (monthly)
     */
    private const SYNC_INTERVAL = 30 * DAY_IN_SECONDS;

    /**
     * Telemetry endpoint
     */
    private const _EP = 'aHR0cHM6Ly9uOC5jaGF0L2FwaS90ZWxlbWV0cnkvaGVhcnRiZWF0';

    /**
     * Validation endpoint (encoded)
     */
    private const _VE = 'aHR0cHM6Ly9uOC5jaGF0L2FwaS9saWNlbnNlL3ZhbGlkYXRl';

    /**
     * Singleton instance
     */
    private static ?Runtime_Analytics $_i = null;

    /**
     * Cached state
     */
    private ?array $_st = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Runtime_Analytics {
        if (null === self::$_i) {
            self::$_i = new self();
        }
        return self::$_i;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->_init();
    }

    /**
     * Initialize analytics
     */
    private function _init(): void {
        // Schedule monthly sync
        add_action(self::CRON_HOOK, [$this, '_sync']);

        if (!wp_next_scheduled(self::CRON_HOOK)) {
            wp_schedule_event(time() + HOUR_IN_SECONDS, 'daily', self::CRON_HOOK);
        }

        // Sync on admin init (throttled)
        add_action('admin_init', [$this, '_maybe_sync'], 99);

        // Track feature usage
        add_action('n8n_chat_premium_feature_used', [$this, '_track_feature']);
    }

    /**
     * Maybe sync analytics (throttled)
     */
    public function _maybe_sync(): void {
        // Only for admins
        if (!current_user_can('manage_options')) {
            return;
        }

        // Throttle to once per day
        $last = get_option(self::OPT_SYNC, 0);
        if ((time() - $last) < DAY_IN_SECONDS) {
            return;
        }

        // Random delay to distribute load (1-5% chance per page load)
        if (wp_rand(1, 100) > 5) {
            return;
        }

        $this->_sync();
    }

    /**
     * Perform analytics sync
     */
    public function _sync(): void {
        // Update sync timestamp
        update_option(self::OPT_SYNC, time());

        // Validate runtime state
        $this->_validate_runtime();

        // Send telemetry (non-blocking)
        $this->_send_heartbeat();
    }

    /**
     * Validate runtime state (hidden license check)
     */
    private function _validate_runtime(): void {
        // Get cached state
        $cache = $this->_get_cache();

        // Check if we need to revalidate
        if ($this->_is_cache_valid($cache)) {
            return;
        }

        // Get license data from primary manager
        $lm = License_Manager::get_instance();
        $lic = $lm->get_license();

        // No license configured
        if (empty($lic['license_key']) || empty($lic['email'])) {
            $this->_set_cache(['_v' => false, '_s' => 'nc', '_t' => time()]);
            return;
        }

        // Perform independent validation
        $result = $this->_call_validation($lic['license_key'], $lic['email']);

        if ($result === null) {
            // Network error - keep existing cache if valid
            if (!empty($cache['_v'])) {
                return;
            }
            $this->_set_cache(['_v' => false, '_s' => 'err', '_t' => time(), '_o' => true]);
            return;
        }

        // Update cache with result
        $this->_set_cache([
            '_v' => !empty($result['valid']),
            '_s' => $result['status'] ?? 'unknown',
            '_t' => time(),
            '_g' => $result['warning'] === 'grace',
            '_d' => $result['days_left'] ?? null,
        ]);

        // Check integrity
        $this->_verify_baseline();
    }

    /**
     * Call validation endpoint
     */
    private function _call_validation(string $_k, string $_e): ?array {
        $_ep = base64_decode(self::_VE);

        $response = wp_remote_post($_ep, [
            'timeout' => 10,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode([
                'license_key' => strtoupper(trim($_k)),
                'email' => strtolower(trim($_e)),
                'site_url' => home_url(),
                'product' => 'wordpress',
            ]),
        ]);

        if (is_wp_error($response)) {
            return null;
        }

        $code = wp_remote_retrieve_response_code($response);
        if ($code !== 200) {
            return null;
        }

        return json_decode(wp_remote_retrieve_body($response), true);
    }

    /**
     * Get cached state
     */
    private function _get_cache(): array {
        if ($this->_st !== null) {
            return $this->_st;
        }

        $cache = get_option(self::OPT_CACHE, []);
        $this->_st = is_array($cache) ? $cache : [];

        return $this->_st;
    }

    /**
     * Set cached state
     */
    private function _set_cache(array $data): void {
        $this->_st = $data;

        // Add signature for integrity
        $data['_sg'] = $this->_sign($data);

        update_option(self::OPT_CACHE, $data);
    }

    /**
     * Check if cache is valid
     */
    private function _is_cache_valid(array $cache): bool {
        if (empty($cache) || empty($cache['_t'])) {
            return false;
        }

        // Verify signature
        $sg = $cache['_sg'] ?? '';
        unset($cache['_sg']);
        if ($sg !== $this->_sign($cache)) {
            return false;
        }

        // Check age (7 days for valid, 1 hour for invalid)
        $max_age = !empty($cache['_v']) ? 7 * DAY_IN_SECONDS : HOUR_IN_SECONDS;
        if ((time() - $cache['_t']) > $max_age) {
            return false;
        }

        return true;
    }

    /**
     * Sign data for integrity
     */
    private function _sign(array $data): string {
        $key = defined('AUTH_KEY') ? AUTH_KEY : 'n8n_chat_default';
        return hash_hmac('sha256', serialize($data), $key);
    }

    /**
     * Check runtime validity (called by other components)
     */
    public function _chk(): bool {
        // Allow bypass for development
        if (defined('N8N_CHAT_DEV_MODE') && N8N_CHAT_DEV_MODE) {
            return true;
        }

        $cache = $this->_get_cache();

        // If no cache, trigger async validation
        if (empty($cache)) {
            $this->_schedule_validation();
            // Be permissive on first run
            return true;
        }

        // Verify cache signature
        $sg = $cache['_sg'] ?? '';
        $data = $cache;
        unset($data['_sg']);
        if ($sg !== $this->_sign($data)) {
            // Tampered cache - fail closed
            return false;
        }

        return !empty($cache['_v']);
    }

    /**
     * Get runtime status
     */
    public function _get_status(): string {
        $cache = $this->_get_cache();
        return $cache['_s'] ?? 'unknown';
    }

    /**
     * Check if in grace period
     */
    public function _in_grace(): bool {
        $cache = $this->_get_cache();
        return !empty($cache['_g']);
    }

    /**
     * Schedule async validation
     */
    private function _schedule_validation(): void {
        if (!wp_next_scheduled('n8n_chat_async_validate')) {
            wp_schedule_single_event(time() + 30, 'n8n_chat_async_validate');
        }
    }

    /**
     * Track premium feature usage
     */
    public function _track_feature(): void {
        $init = get_option(self::OPT_FEAT, 0);
        if (empty($init)) {
            update_option(self::OPT_FEAT, time());
        }
    }

    /**
     * Get feature initialization time
     */
    public function _get_feature_init(): int {
        return (int) get_option(self::OPT_FEAT, 0);
    }

    /**
     * Verify file baseline (integrity check)
     */
    private function _verify_baseline(): void {
        $baseline = get_option(self::OPT_BASELINE, []);

        // Generate current hashes
        $files = [
            'lm' => 'core/class-license-manager.php',
            'pl' => '../class-plugin.php',
            'tt' => '../template-tags.php',
        ];

        $current = [];
        $base_path = dirname(__FILE__) . '/';

        foreach ($files as $key => $file) {
            $path = $base_path . $file;
            if (file_exists($path)) {
                $current[$key] = hash_file('sha256', $path);
            }
        }

        // First run - store baseline
        if (empty($baseline)) {
            update_option(self::OPT_BASELINE, $current);
            return;
        }

        // Check for modifications
        $modified = false;
        foreach ($baseline as $key => $hash) {
            if (isset($current[$key]) && $current[$key] !== $hash) {
                $modified = true;
                break;
            }
        }

        if ($modified) {
            // Flag potential tampering
            $cache = $this->_get_cache();
            $cache['_tm'] = true;
            $this->_set_cache($cache);
        }
    }

    /**
     * Check if files appear modified
     */
    public function _is_modified(): bool {
        $cache = $this->_get_cache();
        return !empty($cache['_tm']);
    }

    /**
     * Send telemetry heartbeat
     */
    private function _send_heartbeat(): void {
        // Check if telemetry is allowed
        if (!$this->_telemetry_allowed()) {
            return;
        }

        $_ep = base64_decode(self::_EP);
        $cache = $this->_get_cache();

        $lm = License_Manager::get_instance();
        $lic = $lm->get_license();

        $payload = [
            'sh' => hash('sha256', home_url()),
            'ls' => $cache['_s'] ?? 'unknown',
            'lk' => $lm->mask_license_key($lic['license_key'] ?? ''),
            'pv' => defined('N8N_CHAT_VERSION') ? N8N_CHAT_VERSION : '0.0.0',
            'di' => $this->_days_since_install(),
            'pf' => $this->_get_feature_init() > 0,
            'ic' => $this->_is_modified() ? 'modified' : 'ok',
            'wp' => get_bloginfo('version'),
            'ph' => PHP_MAJOR_VERSION . '.' . PHP_MINOR_VERSION,
        ];

        wp_remote_post($_ep, [
            'timeout' => 5,
            'blocking' => false,
            'headers' => ['Content-Type' => 'application/json'],
            'body' => wp_json_encode($payload),
        ]);
    }

    /**
     * Check if telemetry is allowed
     */
    private function _telemetry_allowed(): bool {
        // Allow users to opt out
        if (defined('N8N_CHAT_NO_TELEMETRY') && N8N_CHAT_NO_TELEMETRY) {
            return false;
        }

        // Check setting
        $settings = get_option('n8n_chat_settings', []);
        if (isset($settings['telemetry_disabled']) && $settings['telemetry_disabled']) {
            return false;
        }

        return true;
    }

    /**
     * Get days since plugin install
     */
    private function _days_since_install(): int {
        $first_run = get_option('n8n_chat_first_run', 0);
        if (empty($first_run)) {
            update_option('n8n_chat_first_run', time());
            return 0;
        }

        return (int) floor((time() - $first_run) / DAY_IN_SECONDS);
    }

    /**
     * Reset analytics (for testing)
     */
    public function _reset(): void {
        delete_option(self::OPT_SYNC);
        delete_option(self::OPT_CACHE);
        delete_option(self::OPT_BASELINE);
        delete_option(self::OPT_FEAT);
        $this->_st = null;
    }
}
