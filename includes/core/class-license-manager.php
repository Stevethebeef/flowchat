<?php
/**
 * License Manager
 *
 * Handles license validation, caching, and premium feature gating.
 * Integrates with the n8.chat license validation API.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class License_Manager
 *
 * Manages license activation, validation, and status checking for premium features.
 */
class License_Manager {

    /**
     * Option name for storing license data
     */
    private const OPTION_NAME = 'n8n_chat_license';

    /**
     * Transient name for license cache
     */
    private const CACHE_TRANSIENT = 'n8n_chat_license_cache';

    /**
     * License API endpoint
     */
    private const API_ENDPOINT = 'https://n8.chat/api/license/validate';

    /**
     * Resend license URL
     */
    private const RESEND_URL = 'https://n8.chat/resend-license';

    /**
     * Purchase URL
     */
    private const PURCHASE_URL = 'https://n8.chat';

    /**
     * Product identifier
     */
    private const PRODUCT = 'wordpress';

    /**
     * Cache duration for valid licenses (12 hours)
     */
    private const CACHE_DURATION_VALID = 12 * HOUR_IN_SECONDS;

    /**
     * Cache duration for grace period (1 hour - check more frequently)
     */
    private const CACHE_DURATION_GRACE = HOUR_IN_SECONDS;

    /**
     * Cache duration for invalid licenses (1 hour)
     */
    private const CACHE_DURATION_INVALID = HOUR_IN_SECONDS;

    /**
     * Cache duration for errors (5 minutes)
     */
    private const CACHE_DURATION_ERROR = 5 * MINUTE_IN_SECONDS;

    /**
     * License key format regex
     * Format: N8C-XXXX-XXXX-XXXX-XXXX (4 groups of 4 alphanumeric chars)
     */
    private const LICENSE_KEY_PATTERN = '/^N8C-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/';

    /**
     * Singleton instance
     */
    private static ?License_Manager $instance = null;

    /**
     * Cached license data
     */
    private ?array $cached_license = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): License_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->init_hooks();
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks(): void {
        // Check license on admin login
        add_action('wp_login', [$this, 'on_admin_login'], 10, 2);

        // Schedule daily license check
        add_action('n8n_chat_license_check', [$this, 'scheduled_check']);

        // Ensure cron is scheduled
        if (!wp_next_scheduled('n8n_chat_license_check')) {
            wp_schedule_event(time(), 'daily', 'n8n_chat_license_check');
        }

        // Admin notices for license status
        add_action('admin_notices', [$this, 'display_license_notices']);

        // Add license-related actions
        add_action('n8n_chat_settings_updated', [$this, 'on_settings_updated']);
    }

    /**
     * Validate license key format
     *
     * @param string $license_key License key to validate
     * @return bool True if format is valid
     */
    public function is_valid_format(string $license_key): bool {
        return (bool) preg_match(self::LICENSE_KEY_PATTERN, strtoupper(trim($license_key)));
    }

    /**
     * Format license key (uppercase with hyphens)
     *
     * @param string $license_key Raw license key
     * @return string Formatted license key
     */
    public function format_license_key(string $license_key): string {
        return strtoupper(trim($license_key));
    }

    /**
     * Mask license key for display
     *
     * @param string $license_key License key to mask
     * @return string Masked license key (e.g., N8C-XXXX-****-****-XXXX)
     */
    public function mask_license_key(string $license_key): string {
        if (empty($license_key)) {
            return '';
        }

        $key = $this->format_license_key($license_key);

        // Show first 8 characters (N8C-XXXX) and last 4 characters
        if (strlen($key) >= 23) {
            return substr($key, 0, 8) . '-****-****-' . substr($key, -4);
        }

        return str_repeat('*', strlen($key));
    }

    /**
     * Get current license data
     *
     * @return array License data or empty defaults
     */
    public function get_license(): array {
        if (null !== $this->cached_license) {
            return $this->cached_license;
        }

        $license = get_option(self::OPTION_NAME, []);

        if (!is_array($license)) {
            $license = [];
        }

        $this->cached_license = array_merge($this->get_defaults(), $license);

        return $this->cached_license;
    }

    /**
     * Get default license structure
     *
     * @return array
     */
    private function get_defaults(): array {
        return [
            'license_key' => '',
            'email' => '',
            'status' => 'inactive', // inactive, active, grace, expired, revoked, not_found
            'valid_until' => '',
            'grace_until' => '',
            'days_left' => null,
            'warning' => '',
            'checked_at' => '',
            'activated_at' => '',
            'last_error' => '',
            'offline_mode' => false,
        ];
    }

    /**
     * Save license data
     *
     * @param array $data License data to save
     * @return bool
     */
    private function save_license(array $data): bool {
        $this->cached_license = null;

        // Merge with existing data
        $existing = get_option(self::OPTION_NAME, []);
        if (!is_array($existing)) {
            $existing = [];
        }

        $license = array_merge($this->get_defaults(), $existing, $data);

        return update_option(self::OPTION_NAME, $license);
    }

    /**
     * Get appropriate cache duration based on license status
     *
     * @param array $result API response
     * @return int Cache duration in seconds
     */
    private function get_cache_duration(array $result): int {
        // Error responses - short cache
        if (isset($result['error_code'])) {
            return self::CACHE_DURATION_ERROR;
        }

        // Invalid license
        if (empty($result['valid']) || $result['valid'] !== true) {
            return self::CACHE_DURATION_INVALID;
        }

        // Grace period - check more frequently
        if (isset($result['warning']) && $result['warning'] === 'grace') {
            return self::CACHE_DURATION_GRACE;
        }

        // Valid license
        return self::CACHE_DURATION_VALID;
    }

    /**
     * Activate license
     *
     * @param string $license_key License key
     * @param string $email Email address
     * @return array Result with success, status, and message
     */
    public function activate(string $license_key, string $email): array {
        $license_key = $this->format_license_key($license_key);
        $email = strtolower(sanitize_email(trim($email)));

        // Validate license key format
        if (!$this->is_valid_format($license_key)) {
            return [
                'success' => false,
                'status' => 'invalid',
                'message' => __('Invalid license key format. Expected: N8C-XXXX-XXXX-XXXX-XXXX', 'n8n-chat'),
            ];
        }

        // Validate email
        if (empty($email) || !is_email($email)) {
            return [
                'success' => false,
                'status' => 'error',
                'message' => __('A valid email address is required.', 'n8n-chat'),
            ];
        }

        // Clear existing cache
        delete_transient(self::CACHE_TRANSIENT);

        // Make API request
        $response = $this->call_api($license_key, $email);

        if (is_wp_error($response)) {
            // Network error - check if we have a cached valid license
            $existing = $this->get_license();
            if ($existing['status'] === 'active' || $existing['status'] === 'grace') {
                $this->save_license([
                    'last_error' => $response->get_error_message(),
                    'offline_mode' => true,
                ]);

                return [
                    'success' => true,
                    'status' => 'offline',
                    'message' => __('Could not connect to license server. Using cached license.', 'n8n-chat'),
                ];
            }

            return [
                'success' => false,
                'status' => 'error',
                'message' => __('Could not connect to license server. ', 'n8n-chat') . $response->get_error_message(),
                'error_code' => 'connection_error',
            ];
        }

        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);
        $http_code = wp_remote_retrieve_response_code($response);

        // Handle rate limiting
        if ($http_code === 429) {
            return [
                'success' => false,
                'status' => 'error',
                'message' => __('Too many requests. Please try again in a few minutes.', 'n8n-chat'),
                'error_code' => 'rate_limited',
            ];
        }

        // Handle HTTP errors
        if ($http_code !== 200 || !$data) {
            return [
                'success' => false,
                'status' => 'error',
                'message' => __('License server error. Please try again later.', 'n8n-chat'),
                'error_code' => 'server_error',
                'http_status' => $http_code,
            ];
        }

        // Cache the result
        $cache_duration = $this->get_cache_duration($data);
        set_transient(self::CACHE_TRANSIENT, $data, $cache_duration);

        // Process valid response
        if (!empty($data['valid']) && $data['valid'] === true) {
            $status = $data['status'] ?? 'active';
            $valid_until = $data['valid_until'] ?? '';
            $grace_until = $data['grace_until'] ?? '';
            $days_left = $data['days_left'] ?? null;
            $warning = $data['warning'] ?? '';

            $this->save_license([
                'license_key' => $license_key,
                'email' => $email,
                'status' => $status,
                'valid_until' => $valid_until,
                'grace_until' => $grace_until,
                'days_left' => $days_left,
                'warning' => $warning,
                'checked_at' => current_time('c'),
                'activated_at' => current_time('c'),
                'last_error' => '',
                'offline_mode' => false,
            ]);

            // Fire activation hook
            do_action('n8n_license_activated', $license_key, $status);

            // Fire grace hook if in grace period
            if ($warning === 'grace') {
                do_action('n8n_license_grace', $license_key, $days_left);
            }

            $message = $status === 'grace' || $warning === 'grace'
                ? sprintf(
                    /* translators: %d: number of days remaining in grace period */
                    __('License activated. Payment attention required - %d days remaining.', 'n8n-chat'),
                    $days_left ?? 15
                )
                : __('License activated successfully!', 'n8n-chat');

            return [
                'success' => true,
                'status' => $status,
                'valid_until' => $valid_until,
                'grace_until' => $grace_until,
                'days_left' => $days_left,
                'message' => $message,
            ];
        }

        // License not valid
        $status = $data['status'] ?? 'invalid';

        $this->save_license([
            'license_key' => $license_key,
            'email' => $email,
            'status' => $status,
            'checked_at' => current_time('c'),
            'last_error' => $data['message'] ?? '',
            'offline_mode' => false,
        ]);

        // Fire expiry hook if expired
        if ($status === 'expired') {
            do_action('n8n_license_expired', $license_key);
        }

        // Map status to user-friendly message
        $error_messages = [
            'not_found' => __('License not found. Please check your license key and email.', 'n8n-chat'),
            'expired' => __('Your license has expired. Please renew to continue using premium features.', 'n8n-chat'),
            'revoked' => __('This license has been revoked. Please contact support.', 'n8n-chat'),
            'product_mismatch' => __('This license is for a different product.', 'n8n-chat'),
            'invalid' => __('Invalid license key format.', 'n8n-chat'),
        ];

        $message = $error_messages[$status] ?? ($data['message'] ?? __('License is not valid.', 'n8n-chat'));

        return [
            'success' => false,
            'status' => $status,
            'message' => $message,
        ];
    }

    /**
     * Validate license (with caching)
     *
     * @param bool $force_refresh Bypass cache
     * @return array Validation result
     */
    public function validate(bool $force_refresh = false): array {
        $license = $this->get_license();

        // No license configured
        if (empty($license['license_key']) || empty($license['email'])) {
            return [
                'valid' => false,
                'status' => 'not_configured',
                'message' => __('No license key configured.', 'n8n-chat'),
            ];
        }

        // Check cache first (unless force refresh)
        if (!$force_refresh) {
            $cached = get_transient(self::CACHE_TRANSIENT);
            if ($cached !== false) {
                return $cached;
            }
        }

        // Make API request
        $result = $this->activate($license['license_key'], $license['email']);

        return $result;
    }

    /**
     * Deactivate license (local only)
     *
     * @return bool
     */
    public function deactivate(): bool {
        $license = $this->get_license();

        // Clear license data but keep email for convenience
        $this->save_license([
            'license_key' => '',
            'status' => 'inactive',
            'valid_until' => '',
            'grace_until' => '',
            'days_left' => null,
            'warning' => '',
            'checked_at' => '',
            'activated_at' => '',
            'offline_mode' => false,
        ]);

        delete_transient(self::CACHE_TRANSIENT);

        return true;
    }

    /**
     * Call license API
     *
     * @param string $license_key License key
     * @param string $email Email address
     * @return array|\WP_Error Response or error
     */
    private function call_api(string $license_key, string $email) {
        $body = [
            'license_key' => $this->format_license_key($license_key),
            'email' => strtolower(trim($email)),
            'site_url' => home_url(),
            'product' => self::PRODUCT,
        ];

        $response = wp_remote_post(self::API_ENDPOINT, [
            'timeout' => 15,
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($body),
        ]);

        return $response;
    }

    /**
     * Check if premium features are available
     *
     * @return bool
     */
    public function is_premium(): bool {
        $license = $this->get_license();
        $status = $license['status'] ?? 'inactive';

        // Active and grace statuses allow premium features
        if (in_array($status, ['active', 'grace'], true)) {
            // Double-check expiration for cached data
            if (!empty($license['grace_until'])) {
                $grace_until = strtotime($license['grace_until']);
                if ($grace_until && $grace_until < time()) {
                    // Grace period expired
                    return false;
                }
            } elseif (!empty($license['valid_until'])) {
                $valid_until = strtotime($license['valid_until']);
                if ($valid_until && $valid_until < time()) {
                    return false;
                }
            }

            return true;
        }

        return false;
    }

    /**
     * Check if license is in grace period
     *
     * @return bool
     */
    public function is_in_grace(): bool {
        $license = $this->get_license();
        return ($license['status'] === 'grace') || (!empty($license['warning']) && $license['warning'] === 'grace');
    }

    /**
     * Get days left in grace period
     *
     * @return int|null
     */
    public function get_grace_days_left(): ?int {
        $license = $this->get_license();

        if (!empty($license['days_left'])) {
            return (int) $license['days_left'];
        }

        if (!empty($license['grace_until'])) {
            $grace_until = strtotime($license['grace_until']);
            if ($grace_until) {
                return max(0, (int) ceil(($grace_until - time()) / DAY_IN_SECONDS));
            }
        }

        return null;
    }

    /**
     * Get premium status with detailed info
     *
     * @return array
     */
    public function get_premium_status(): array {
        $license = $this->get_license();
        $is_premium = $this->is_premium();

        $result = [
            'is_premium' => $is_premium,
            'status' => $license['status'] ?? 'inactive',
            'email' => $license['email'] ?? '',
            'license_key_masked' => $this->mask_license_key($license['license_key'] ?? ''),
            'valid_until' => $license['valid_until'] ?? '',
            'grace_until' => $license['grace_until'] ?? '',
            'days_left' => null,
            'grace_days_left' => null,
            'warning' => $license['warning'] ?? '',
            'offline_mode' => $license['offline_mode'] ?? false,
            'last_checked' => $license['checked_at'] ?? '',
        ];

        // Calculate days left
        if (!empty($license['valid_until'])) {
            $valid_until = strtotime($license['valid_until']);
            if ($valid_until) {
                $days = ceil(($valid_until - time()) / DAY_IN_SECONDS);
                $result['days_left'] = max(0, (int) $days);
            }
        }

        // Grace days from API response or calculate
        if (!empty($license['days_left']) && $this->is_in_grace()) {
            $result['grace_days_left'] = (int) $license['days_left'];
        } elseif (!empty($license['grace_until']) && $this->is_in_grace()) {
            $grace_until = strtotime($license['grace_until']);
            if ($grace_until) {
                $days = ceil(($grace_until - time()) / DAY_IN_SECONDS);
                $result['grace_days_left'] = max(0, (int) $days);
            }
        }

        return $result;
    }

    /**
     * Revalidate existing license
     *
     * @return array Result
     */
    public function revalidate(): array {
        $license = $this->get_license();

        if (empty($license['license_key']) || empty($license['email'])) {
            return [
                'success' => false,
                'status' => 'inactive',
                'message' => __('No license to validate.', 'n8n-chat'),
            ];
        }

        // Force refresh
        delete_transient(self::CACHE_TRANSIENT);

        return $this->activate($license['license_key'], $license['email']);
    }

    /**
     * Check if a revalidation is needed
     *
     * @return bool
     */
    public function needs_revalidation(): bool {
        $cached = get_transient(self::CACHE_TRANSIENT);
        return $cached === false;
    }

    /**
     * Handle admin login - check license if needed
     *
     * @param string $user_login Username
     * @param \WP_User $user User object
     */
    public function on_admin_login(string $user_login, \WP_User $user): void {
        // Only for users who can manage options
        if (!user_can($user, 'manage_options')) {
            return;
        }

        // Check if revalidation is needed
        if ($this->needs_revalidation()) {
            $license = $this->get_license();

            if (!empty($license['license_key']) && !empty($license['email'])) {
                // Revalidate in background - don't block login
                $this->revalidate();
            }
        }
    }

    /**
     * Scheduled license check
     */
    public function scheduled_check(): void {
        $license = $this->get_license();

        if (!empty($license['license_key']) && !empty($license['email'])) {
            $this->revalidate();
        }
    }

    /**
     * Handle settings update - revalidate license
     */
    public function on_settings_updated(): void {
        if ($this->needs_revalidation()) {
            $this->revalidate();
        }
    }

    /**
     * Display admin notices for license status
     */
    public function display_license_notices(): void {
        // Only show on n8n-chat admin pages
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'n8n-chat') === false) {
            return;
        }

        // Skip on license page itself
        if (strpos($screen->id, 'n8n-chat-license') !== false) {
            return;
        }

        $license = $this->get_license();
        $status = $license['status'] ?? 'inactive';

        // Grace period warning
        if ($this->is_in_grace()) {
            $grace_days = $this->get_grace_days_left() ?? 0;

            $renew_url = add_query_arg([
                'utm_source' => 'plugin',
                'utm_medium' => 'admin',
                'utm_campaign' => 'renewal',
            ], self::PURCHASE_URL);

            printf(
                '<div class="notice notice-warning is-dismissible" style="border-left-color: #f59e0b;">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        <strong>%s</strong> %s
                        <a href="%s" target="_blank" style="color: #f59e0b; text-decoration: underline;">%s</a>
                    </p>
                </div>',
                esc_html__('Payment Issue:', 'n8n-chat'),
                sprintf(
                    /* translators: %d: number of days until premium features are disabled */
                    esc_html__('Your n8.chat license payment failed. Premium features will be disabled in %d days.', 'n8n-chat'),
                    (int) $grace_days
                ),
                esc_url($renew_url),
                esc_html__('Update payment method', 'n8n-chat')
            );
        }

        // Expired notice
        if ($status === 'expired') {
            $purchase_url = add_query_arg([
                'utm_source' => 'plugin',
                'utm_medium' => 'admin',
                'utm_campaign' => 'expired',
            ], self::PURCHASE_URL . '/#pricing');

            printf(
                '<div class="notice notice-error">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        <strong>%s</strong> %s
                        <a href="%s" target="_blank" style="color: #dc2626; text-decoration: underline;">%s</a>
                    </p>
                </div>',
                esc_html__('License expired:', 'n8n-chat'),
                esc_html__('Premium features are disabled.', 'n8n-chat'),
                esc_url($purchase_url),
                esc_html__('Renew now', 'n8n-chat')
            );
        }

        // Revoked notice
        if ($status === 'revoked') {
            printf(
                '<div class="notice notice-error">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        <strong>%s</strong> %s
                    </p>
                </div>',
                esc_html__('License revoked:', 'n8n-chat'),
                esc_html__('This license has been revoked. Please contact support.', 'n8n-chat')
            );
        }

        // Offline mode notice
        if (!empty($license['offline_mode'])) {
            printf(
                '<div class="notice notice-info is-dismissible">
                    <p style="font-family: -apple-system, BlinkMacSystemFont, sans-serif;">
                        %s
                    </p>
                </div>',
                esc_html__('Could not verify license. Using cached license status.', 'n8n-chat')
            );
        }
    }

    /**
     * Get resend license URL
     *
     * @param string $email Optional email to prefill
     * @return string
     */
    public function get_resend_url(string $email = ''): string {
        $url = self::RESEND_URL;

        if (!empty($email)) {
            $url = add_query_arg('email', rawurlencode($email), $url);
        }

        return $url;
    }

    /**
     * Get purchase URL with UTM params
     *
     * @param string $campaign Campaign name
     * @return string
     */
    public function get_purchase_url(string $campaign = 'plugin'): string {
        return add_query_arg([
            'utm_source' => 'plugin',
            'utm_medium' => 'admin',
            'utm_campaign' => $campaign,
        ], self::PURCHASE_URL);
    }

    /**
     * Get current license status string
     *
     * @return string
     */
    public function get_status(): string {
        $license = $this->get_license();
        return $license['status'] ?? 'inactive';
    }

    /**
     * Get license expiration date
     *
     * @return string|null ISO 8601 date string
     */
    public function get_valid_until(): ?string {
        $license = $this->get_license();
        return !empty($license['valid_until']) ? $license['valid_until'] : null;
    }

    /**
     * Clear all license data
     *
     * @return bool
     */
    public function clear(): bool {
        $this->cached_license = null;
        delete_option(self::OPTION_NAME);
        delete_transient(self::CACHE_TRANSIENT);
        return true;
    }
}
