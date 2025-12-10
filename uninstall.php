<?php
/**
 * FlowChat Uninstall
 *
 * Fired when the plugin is uninstalled (deleted).
 * Removes all plugin data from the database.
 *
 * @package FlowChat
 */

// If uninstall not called from WordPress, exit
if (!defined('WP_UNINSTALL_PLUGIN')) {
    exit;
}

/**
 * Clean up all FlowChat data
 */
function flowchat_uninstall(): void {
    global $wpdb;

    // Check if we should preserve data (user preference)
    $settings = get_option('flowchat_global_settings', []);
    if (!empty($settings['preserve_data_on_uninstall'])) {
        return;
    }

    // Drop custom tables
    $tables = [
        $wpdb->prefix . 'flowchat_sessions',
        $wpdb->prefix . 'flowchat_messages',
        $wpdb->prefix . 'flowchat_fallback_messages',
    ];

    foreach ($tables as $table) {
        $wpdb->query("DROP TABLE IF EXISTS {$table}");
    }

    // Delete options
    $options = [
        'flowchat_version',
        'flowchat_db_version',
        'flowchat_instances',
        'flowchat_global_settings',
        'flowchat_error_messages',
        'flowchat_custom_templates',
        'flowchat_license_key',
        'flowchat_license_status',
        'flowchat_activated_at',
        'flowchat_deactivated_at',
    ];

    foreach ($options as $option) {
        delete_option($option);
    }

    // Delete transients
    $wpdb->query(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_flowchat_%'"
    );
    $wpdb->query(
        "DELETE FROM {$wpdb->options} WHERE option_name LIKE '_transient_timeout_flowchat_%'"
    );

    // Clear scheduled hooks
    wp_clear_scheduled_hook('flowchat_cleanup_files');
    wp_clear_scheduled_hook('flowchat_cleanup_sessions');

    // Delete upload directory
    $upload_dir = wp_upload_dir();
    $flowchat_dir = $upload_dir['basedir'] . '/flowchat';

    if (is_dir($flowchat_dir)) {
        flowchat_delete_directory($flowchat_dir);
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
function flowchat_delete_directory(string $dir): bool {
    if (!is_dir($dir)) {
        return false;
    }

    $files = array_diff(scandir($dir), ['.', '..']);

    foreach ($files as $file) {
        $path = $dir . '/' . $file;

        if (is_dir($path)) {
            flowchat_delete_directory($path);
        } else {
            unlink($path);
        }
    }

    return rmdir($dir);
}

// Run uninstall
flowchat_uninstall();
