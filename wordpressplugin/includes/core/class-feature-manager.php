<?php
/**
 * Feature Manager
 *
 * Manages feature flags and access levels for the plugin.
 * Handles graceful degradation and feature availability.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Feature_Manager
 *
 * Controls which features are available based on configuration and licensing.
 */
class Feature_Manager {

    /**
     * Feature levels
     */
    public const LEVEL_FULL = 'full';
    public const LEVEL_GRACE = 'grace';
    public const LEVEL_LIMITED = 'limited';
    public const LEVEL_BASIC = 'basic';

    /**
     * Tier configuration option
     */
    private const OPT_TIER = 'n8n_chat_tier_config';

    /**
     * Premium features list
     */
    private const PREMIUM_FEATURES = [
        'unlimited_instances',
        'advanced_analytics',
        'custom_branding',
        'file_uploads',
        'advanced_rules',
        'priority_support',
        'api_access',
        'export_data',
        'custom_css',
        'webhooks',
    ];

    /**
     * Grace period features (available during grace)
     */
    private const GRACE_FEATURES = [
        'unlimited_instances',
        'custom_branding',
        'api_access',
        'export_data',
    ];

    /**
     * Limited mode features
     */
    private const LIMITED_FEATURES = [
        'custom_branding',
        'export_data',
    ];

    /**
     * Singleton instance
     */
    private static ?Feature_Manager $_i = null;

    /**
     * Cached level
     */
    private ?string $_level = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Feature_Manager {
        if (null === self::$_i) {
            self::$_i = new self();
        }
        return self::$_i;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Track premium feature usage
        add_action('init', [$this, '_check_premium_usage'], 20);
    }

    /**
     * Get current feature level
     */
    public function get_level(): string {
        if ($this->_level !== null) {
            return $this->_level;
        }

        // Allow bypass for development
        if (defined('N8N_CHAT_DEV_MODE') && N8N_CHAT_DEV_MODE) {
            $this->_level = self::LEVEL_FULL;
            return $this->_level;
        }

        // Check primary license manager
        $lm = License_Manager::get_instance();
        $is_premium = $lm->is_premium();
        $is_grace = $lm->is_in_grace();

        // If primary says premium, double-check with secondary
        if ($is_premium) {
            $ra = Runtime_Analytics::get_instance();

            // If secondary check fails, use time-based degradation
            if (!$ra->_chk()) {
                $this->_level = $this->_calc_degraded_level();
                return $this->_level;
            }

            // Both checks pass
            $this->_level = $is_grace ? self::LEVEL_GRACE : self::LEVEL_FULL;
            return $this->_level;
        }

        // Not premium - check for time-based enforcement
        $this->_level = $this->_calc_degraded_level();
        return $this->_level;
    }

    /**
     * Calculate degraded level based on time
     */
    private function _calc_degraded_level(): string {
        $ra = Runtime_Analytics::get_instance();
        $feature_init = $ra->_get_feature_init();

        // Premium features never used
        if (empty($feature_init)) {
            return self::LEVEL_BASIC;
        }

        $days_since_init = (time() - $feature_init) / DAY_IN_SECONDS;

        // Grace period: 7 days of full functionality
        if ($days_since_init < 7) {
            return self::LEVEL_FULL;
        }

        // Warning period: 7-14 days
        if ($days_since_init < 14) {
            return self::LEVEL_GRACE;
        }

        // Degraded period: 14-30 days
        if ($days_since_init < 30) {
            return self::LEVEL_LIMITED;
        }

        // After 30 days: basic only
        return self::LEVEL_BASIC;
    }

    /**
     * Check if a specific feature is available
     */
    public function has_feature(string $feature): bool {
        $level = $this->get_level();

        switch ($level) {
            case self::LEVEL_FULL:
                return in_array($feature, self::PREMIUM_FEATURES, true);

            case self::LEVEL_GRACE:
                return in_array($feature, self::GRACE_FEATURES, true);

            case self::LEVEL_LIMITED:
                return in_array($feature, self::LIMITED_FEATURES, true);

            case self::LEVEL_BASIC:
            default:
                return false;
        }
    }

    /**
     * Check if any premium features are available
     */
    public function has_premium(): bool {
        $level = $this->get_level();
        return in_array($level, [self::LEVEL_FULL, self::LEVEL_GRACE], true);
    }

    /**
     * Check if in degraded mode
     */
    public function is_degraded(): bool {
        $level = $this->get_level();
        return in_array($level, [self::LEVEL_LIMITED, self::LEVEL_BASIC], true);
    }

    /**
     * Get degradation info for admin notices
     */
    public function get_degradation_info(): array {
        $level = $this->get_level();
        $ra = Runtime_Analytics::get_instance();
        $feature_init = $ra->_get_feature_init();

        if ($level === self::LEVEL_FULL) {
            return ['degraded' => false];
        }

        $days_since_init = $feature_init ? (time() - $feature_init) / DAY_IN_SECONDS : 0;

        $info = [
            'degraded' => true,
            'level' => $level,
            'days_since_init' => (int) $days_since_init,
        ];

        switch ($level) {
            case self::LEVEL_GRACE:
                $info['message'] = __('License verification pending. Some features may be limited soon.', 'n8n-chat');
                $info['days_until_limited'] = max(0, 14 - (int) $days_since_init);
                break;

            case self::LEVEL_LIMITED:
                $info['message'] = __('License not verified. Premium features are limited.', 'n8n-chat');
                $info['days_until_basic'] = max(0, 30 - (int) $days_since_init);
                break;

            case self::LEVEL_BASIC:
                $info['message'] = __('Premium features unavailable. Please activate your license.', 'n8n-chat');
                break;
        }

        return $info;
    }

    /**
     * Track when premium features are used
     */
    public function _check_premium_usage(): void {
        // Only track in admin
        if (!is_admin()) {
            return;
        }

        // Check if viewing n8n-chat admin pages
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended, WordPress.Security.ValidatedSanitizedInput.InputNotSanitized -- Read-only page context check
        if (!isset($_GET['page']) || strpos(sanitize_text_field(wp_unslash($_GET['page'])), 'n8n-chat') !== 0) {
            return;
        }

        // Check for premium feature usage indicators
        $this->_detect_premium_usage();
    }

    /**
     * Detect premium feature usage
     */
    private function _detect_premium_usage(): void {
        // Check for premium settings being saved
        // phpcs:ignore WordPress.Security.NonceVerification.Missing -- Just checking if premium settings exist
        if (isset($_POST['n8n_chat_premium_settings'])) {
            $this->_mark_premium_used();
            return;
        }

        // Check for premium instance features
        $instances = get_option('n8n_chat_instances', []);
        foreach ($instances as $instance) {
            // Check for premium-only settings
            if (!empty($instance['custom_css']) ||
                !empty($instance['advanced_rules']) ||
                !empty($instance['file_uploads'])) {
                $this->_mark_premium_used();
                return;
            }
        }

        // Check instance count (premium allows unlimited)
        if (count($instances) > 1) {
            $this->_mark_premium_used();
        }
    }

    /**
     * Mark that premium features have been used
     */
    private function _mark_premium_used(): void {
        do_action('n8n_chat_premium_feature_used');
    }

    /**
     * Explicitly mark a premium feature as used
     */
    public function mark_feature_used(string $feature): void {
        if (in_array($feature, self::PREMIUM_FEATURES, true)) {
            $this->_mark_premium_used();
        }
    }

    /**
     * Get list of available features
     */
    public function get_available_features(): array {
        $level = $this->get_level();

        switch ($level) {
            case self::LEVEL_FULL:
                return self::PREMIUM_FEATURES;

            case self::LEVEL_GRACE:
                return self::GRACE_FEATURES;

            case self::LEVEL_LIMITED:
                return self::LIMITED_FEATURES;

            case self::LEVEL_BASIC:
            default:
                return [];
        }
    }

    /**
     * Get list of all premium features
     */
    public function get_all_premium_features(): array {
        return self::PREMIUM_FEATURES;
    }

    /**
     * Internal state accessor (obfuscated name)
     */
    public function _cfg(): array {
        return [
            'l' => $this->get_level(),
            'p' => $this->has_premium(),
            'd' => $this->is_degraded(),
            'f' => $this->get_available_features(),
        ];
    }

    /**
     * Reset state (for testing)
     */
    public function _reset(): void {
        $this->_level = null;
    }
}
