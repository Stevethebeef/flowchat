<?php
/**
 * Plugin Deactivator
 *
 * Handles plugin deactivation tasks: cleanup cron jobs, etc.
 * Note: Database tables and options are NOT removed on deactivation.
 * Full cleanup happens in uninstall.php
 *
 * @package FlowChat
 */

namespace FlowChat;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Deactivator
 */
class Deactivator {

    /**
     * Run deactivation tasks
     */
    public static function deactivate(): void {
        self::clear_cron_jobs();
        self::flush_caches();

        // Flush rewrite rules
        flush_rewrite_rules();

        // Store deactivation time for reference
        update_option('flowchat_deactivated_at', current_time('mysql'));
    }

    /**
     * Clear all scheduled cron jobs
     */
    private static function clear_cron_jobs(): void {
        // Clear file cleanup cron
        $timestamp = wp_next_scheduled('flowchat_cleanup_files');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'flowchat_cleanup_files');
        }

        // Clear session cleanup cron
        $timestamp = wp_next_scheduled('flowchat_cleanup_sessions');
        if ($timestamp) {
            wp_unschedule_event($timestamp, 'flowchat_cleanup_sessions');
        }

        // Clear any other scheduled hooks
        wp_clear_scheduled_hook('flowchat_cleanup_files');
        wp_clear_scheduled_hook('flowchat_cleanup_sessions');
    }

    /**
     * Flush any cached data
     */
    private static function flush_caches(): void {
        // Clear transients
        delete_transient('flowchat_active_sessions_count');
        delete_transient('flowchat_instances_cache');

        // If using object cache, flush plugin-related data
        if (function_exists('wp_cache_flush_group')) {
            wp_cache_flush_group('flowchat');
        }
    }
}
