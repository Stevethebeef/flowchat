<?php
/**
 * n8n Chat Uninstall
 *
 * Fired when the plugin is uninstalled (deleted).
 * Removes all plugin data from the database.
 *
 * @package N8nChat
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

/**
 * Clean up all n8n Chat data
 */
function n8n_chat_uninstall(): void {
    global $wpdb;

    // Check if we should preserve data (user preference)
    $settings = get_option('n8n_chat_global_settings', []);
    if (!empty($settings['preserve_data_on_uninstall'])) {
        return;
    }

    // Drop custom tables
    $tables = [
        $wpdb->prefix . 'n8n_chat_sessions',
        $wpdb->prefix . 'n8n_chat_messages',
        $wpdb->prefix . 'n8n_chat_fallback_messages',
    ];

    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }

    // Delete options
    $options = [
        'n8n_chat_version',
        'n8n_chat_db_version',
        'n8n_chat_instances',
        'n8n_chat_global_settings',
        'n8n_chat_error_messages',
        'n8n_chat_custom_templates',
        'n8n_chat_license_key',
        'n8n_chat_license_status',
        'n8n_chat_activated_at',
        'n8n_chat_deactivated_at',
        'n8n_chat_jwt_secret',
    ];

    foreach ($options as $option) {
        delete_option($option);
    }

    // Delete transients
    $wpdb->query(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_n8n_chat_%'"
    );
    $wpdb->query(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_n8n_chat_%'"
    );

    // Clear scheduled hooks
    wp_clear_scheduled_hook('n8n_chat_cleanup_files');
    wp_clear_scheduled_hook('n8n_chat_cleanup_sessions');

    // Delete upload directory
    $upload_dir = wp_upload_dir();
    $n8n_chat_dir = $upload_dir['basedir'] . '/n8n-chat';

    if (is_dir($n8n_chat_dir)) {
        n8n_chat_delete_directory($n8n_chat_dir);
    }

    // Clear any cached data
    wp_cache_flush();
}

/**
 * Recursively delete a directory
 *
 * @param string $dir Directory path
 * @return bool Success
 */
function n8n_chat_delete_directory(string $dir): bool {
    if (!is_dir($dir)) {
        return false;
    }

    $files = array_diff(scandir($dir), ['.', '..']);

    foreach ($files as $file) {
        $path = $dir . '/' . $file;

        if (is_dir($path)) {
            n8n_chat_delete_directory($path);
        } else {
            unlink($path);
        }
    }

    return rmdir($dir);
}

// Run uninstall
n8n_chat_uninstall();
