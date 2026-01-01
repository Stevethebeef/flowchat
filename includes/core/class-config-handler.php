<?php
/**
 * Configuration Handler
 *
 * Manages plugin configuration and optimization settings.
 * Handles configuration caching and validation.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Config_Handler
 *
 * Centralizes configuration management and validation.
 */
class Config_Handler {

    /**
     * Configuration option name
     */
    private const OPT_CFG = 'n8n_chat_runtime_cfg';

    /**
     * Baseline checksums (generated at build time)
     * Format: base64 encoded, split for obfuscation
     */
    private static $_b1 = '';  // Will be populated at build
    private static $_b2 = '';  // Will be populated at build

    /**
     * Singleton instance
     */
    private static ?Config_Handler $_i = null;

    /**
     * Cached configuration
     */
    private ?array $_c = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Config_Handler {
        if (null === self::$_i) {
            self::$_i = new self();
        }
        return self::$_i;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Initialize on admin
        if (is_admin()) {
            add_action('admin_init', [$this, '_validate_config'], 1);
        }
    }

    /**
     * Get configuration value
     *
     * @param string $key Configuration key
     * @param mixed $default Default value
     * @return mixed
     */
    public function get(string $key, $default = null) {
        $config = $this->_load_config();
        return $config[$key] ?? $default;
    }

    /**
     * Set configuration value
     *
     * @param string $key Configuration key
     * @param mixed $value Configuration value
     * @return bool
     */
    public function set(string $key, $value): bool {
        $config = $this->_load_config();
        $config[$key] = $value;
        $config['_u'] = time();

        return update_option(self::OPT_CFG, $config);
    }

    /**
     * Load configuration
     */
    private function _load_config(): array {
        if ($this->_c !== null) {
            return $this->_c;
        }

        $config = get_option(self::OPT_CFG, []);
        $this->_c = is_array($config) ? $config : [];

        return $this->_c;
    }

    /**
     * Validate configuration and runtime state
     */
    public function _validate_config(): void {
        // Check file integrity
        $integrity = $this->_check_integrity();

        // Store result
        $config = $this->_load_config();
        $config['_int'] = $integrity ? 'ok' : 'mod';
        $config['_chk'] = time();

        update_option(self::OPT_CFG, $config);

        // If integrity failed, notify Feature Manager
        if (!$integrity && class_exists('\N8nChat\Core\Runtime_Analytics')) {
            $ra = Runtime_Analytics::get_instance();
            // This will flag the tampering
        }
    }

    /**
     * Check file integrity
     *
     * @return bool True if integrity is intact
     */
    private function _check_integrity(): bool {
        // Critical files to verify
        $files = [
            dirname(__FILE__) . '/class-license-manager.php',
            dirname(__FILE__) . '/class-runtime-analytics.php',
            dirname(__FILE__) . '/class-feature-manager.php',
            dirname(dirname(__FILE__)) . '/class-plugin.php',
            dirname(dirname(__FILE__)) . '/template-tags.php',
        ];

        // Check each file exists and has expected patterns
        foreach ($files as $file) {
            if (!file_exists($file)) {
                return false;
            }

            // Verify file contains expected license check patterns
            // (pirates often remove or modify these)
            $content = file_get_contents($file);

            // Check for presence of key functions/patterns (obfuscated check)
            $patterns = $this->_get_patterns();
            $found = 0;

            foreach ($patterns as $pattern) {
                if (strpos($content, base64_decode($pattern)) !== false) {
                    $found++;
                }
            }

            // Require at least some patterns present
            if ($found < 2) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get verification patterns (encoded)
     *
     * @return array
     */
    private function _get_patterns(): array {
        return [
            'TGljZW5zZV9NYW5hZ2Vy',           // License_Manager
            'aXNfcHJlbWl1bQ==',               // is_premium
            'UnVudGltZV9BbmFseXRpY3M=',       // Runtime_Analytics
            'RmVhdHVyZV9NYW5hZ2Vy',           // Feature_Manager
            'X2Noaw==',                        // _chk
            'X3ZhbGlkYXRl',                   // _validate
            'Z2V0X2xpY2Vuc2U=',               // get_license
        ];
    }

    /**
     * Get integrity status
     *
     * @return bool
     */
    public function is_intact(): bool {
        $config = $this->_load_config();
        return ($config['_int'] ?? '') === 'ok';
    }

    /**
     * Get last check timestamp
     *
     * @return int
     */
    public function get_last_check(): int {
        $config = $this->_load_config();
        return (int) ($config['_chk'] ?? 0);
    }

    /**
     * Reset configuration
     */
    public function reset(): void {
        delete_option(self::OPT_CFG);
        $this->_c = null;
    }
}
