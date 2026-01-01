<?php
/**
 * Plugin Name:       n8n Chat – Beautiful Chat Widget
 * Plugin URI:        https://n8.chat
 * Description:       Beautiful, customizable chat widget for n8n workflows. Streaming responses, file uploads, voice input, templates gallery, and full design control. Connect WordPress to any n8n automation.
 * Version:           1.0.0
 * Requires at least: 6.0
 * Requires PHP:      7.4
 * Author:            n8.chat
 * Author URI:        https://n8.chat
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       n8n-chat
 * Domain Path:       /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants - Updated for CORS proxy support
define('N8N_CHAT_VERSION', '1.0.2');
define('N8N_CHAT_PLUGIN_FILE', __FILE__);
define('N8N_CHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('N8N_CHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('N8N_CHAT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Minimum requirements
define('N8N_CHAT_MIN_PHP_VERSION', '7.4');
define('N8N_CHAT_MIN_WP_VERSION', '6.0');

/**
 * Check minimum requirements before loading the plugin
 */
function n8n_chat_check_requirements(): bool {
    $errors = [];

    if (version_compare(PHP_VERSION, N8N_CHAT_MIN_PHP_VERSION, '<')) {
        $errors[] = sprintf(
            /* translators: 1: Current PHP version, 2: Required PHP version */
            __('n8n Chat requires PHP %2$s or higher. Your server is running PHP %1$s.', 'n8n-chat'),
            PHP_VERSION,
            N8N_CHAT_MIN_PHP_VERSION
        );
    }

    global $wp_version;
    if (version_compare($wp_version, N8N_CHAT_MIN_WP_VERSION, '<')) {
        $errors[] = sprintf(
            /* translators: 1: Current WordPress version, 2: Required WordPress version */
            __('n8n Chat requires WordPress %2$s or higher. You are running WordPress %1$s.', 'n8n-chat'),
            $wp_version,
            N8N_CHAT_MIN_WP_VERSION
        );
    }

    if (!empty($errors)) {
        add_action('admin_notices', function() use ($errors) {
            foreach ($errors as $error) {
                printf(
                    '<div class="notice notice-error"><p>%s</p></div>',
                    esc_html($error)
                );
            }
        });
        return false;
    }

    return true;
}

/**
 * Initialize the plugin
 */
function n8n_chat_init(): void {
    if (!n8n_chat_check_requirements()) {
        return;
    }

    // Load autoloader
    require_once N8N_CHAT_PLUGIN_DIR . 'includes/autoload.php';

    // Load template tags for theme developers
    require_once N8N_CHAT_PLUGIN_DIR . 'includes/template-tags.php';

    // Register activation/deactivation hooks
    register_activation_hook(__FILE__, ['N8nChat\\Activator', 'activate']);
    register_deactivation_hook(__FILE__, ['N8nChat\\Deactivator', 'deactivate']);

    // Initialize the plugin
    add_action('plugins_loaded', function() {
        N8nChat\Plugin::get_instance();
    });
}

// Start the plugin
n8n_chat_init();
