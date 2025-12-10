<?php
/**
 * Plugin Name: FlowChat
 * Plugin URI: https://flowchat.dev
 * Description: AI Chat for WordPress via n8n automation workflows
 * Version: 1.0.0
 * Requires PHP: 8.0
 * Requires at least: 6.0
 * Author: FlowChat
 * License: GPL v2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: flowchat
 * Domain Path: /languages
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('FLOWCHAT_VERSION', '1.0.0');
define('FLOWCHAT_PLUGIN_FILE', __FILE__);
define('FLOWCHAT_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('FLOWCHAT_PLUGIN_URL', plugin_dir_url(__FILE__));
define('FLOWCHAT_PLUGIN_BASENAME', plugin_basename(__FILE__));

// Minimum requirements
define('FLOWCHAT_MIN_PHP_VERSION', '8.0');
define('FLOWCHAT_MIN_WP_VERSION', '6.0');

/**
 * Check minimum requirements before loading the plugin
 */
function flowchat_check_requirements(): bool {
    $errors = [];

    if (version_compare(PHP_VERSION, FLOWCHAT_MIN_PHP_VERSION, '<')) {
        $errors[] = sprintf(
            /* translators: 1: Current PHP version, 2: Required PHP version */
            __('FlowChat requires PHP %2$s or higher. Your server is running PHP %1$s.', 'flowchat'),
            PHP_VERSION,
            FLOWCHAT_MIN_PHP_VERSION
        );
    }

    global $wp_version;
    if (version_compare($wp_version, FLOWCHAT_MIN_WP_VERSION, '<')) {
        $errors[] = sprintf(
            /* translators: 1: Current WordPress version, 2: Required WordPress version */
            __('FlowChat requires WordPress %2$s or higher. You are running WordPress %1$s.', 'flowchat'),
            $wp_version,
            FLOWCHAT_MIN_WP_VERSION
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
function flowchat_init(): void {
    if (!flowchat_check_requirements()) {
        return;
    }

    // Load autoloader
    require_once FLOWCHAT_PLUGIN_DIR . 'includes/autoload.php';

    // Load template tags for theme developers
    require_once FLOWCHAT_PLUGIN_DIR . 'includes/template-tags.php';

    // Register activation/deactivation hooks
    register_activation_hook(__FILE__, ['FlowChat\\Activator', 'activate']);
    register_deactivation_hook(__FILE__, ['FlowChat\\Deactivator', 'deactivate']);

    // Initialize the plugin
    add_action('plugins_loaded', function() {
        FlowChat\Plugin::get_instance();
    });
}

// Start the plugin
flowchat_init();
