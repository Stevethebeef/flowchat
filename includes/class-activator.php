<?php
/**
 * Plugin Activator
 *
 * Handles plugin activation tasks: database table creation, default options, etc.
 *
 * @package N8nChat
 */

namespace N8nChat;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Activator
 */
class Activator {

    /**
     * Current database schema version
     */
    private const DB_VERSION = '1.0.0';

    /**
     * Run activation tasks
     */
    public static function activate(): void {
        self::create_tables();
        self::set_default_options();
        self::create_upload_directory();
        self::schedule_cron_jobs();

        // Flush rewrite rules
        flush_rewrite_rules();

        // Store activation time for reference
        update_option('n8n_chat_activated_at', current_time('mysql'));
    }

    /**
     * Create custom database tables
     */
    private static function create_tables(): void {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        // Sessions table
        $sessions_table = $wpdb->prefix . 'n8n_chat_sessions';
        $sessions_sql = "CREATE TABLE {$sessions_table} (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            uuid VARCHAR(36) NOT NULL,
            instance_id VARCHAR(64) NOT NULL,
            user_id BIGINT UNSIGNED DEFAULT NULL,
            visitor_id VARCHAR(64) DEFAULT NULL,
            status ENUM('active', 'closed', 'archived') DEFAULT 'active',
            metadata JSON DEFAULT NULL,
            started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            last_activity_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            closed_at DATETIME DEFAULT NULL,
            UNIQUE KEY idx_uuid (uuid),
            KEY idx_instance (instance_id),
            KEY idx_user (user_id),
            KEY idx_status (status),
            KEY idx_last_activity (last_activity_at)
        ) {$charset_collate};";

        // Messages table
        $messages_table = $wpdb->prefix . 'n8n_chat_messages';
        $messages_sql = "CREATE TABLE {$messages_table} (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            session_id BIGINT UNSIGNED NOT NULL,
            session_uuid VARCHAR(36) NOT NULL,
            role ENUM('user', 'assistant', 'system') NOT NULL,
            content JSON NOT NULL,
            metadata JSON DEFAULT NULL,
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            KEY idx_session_id (session_id),
            KEY idx_session_uuid (session_uuid),
            KEY idx_created (created_at)
        ) {$charset_collate};";

        // Fallback messages table (when n8n is down)
        $fallback_table = $wpdb->prefix . 'n8n_chat_fallback_messages';
        $fallback_sql = "CREATE TABLE {$fallback_table} (
            id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            instance_id VARCHAR(64) NOT NULL,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            status ENUM('pending', 'replied', 'spam') DEFAULT 'pending',
            created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            replied_at DATETIME DEFAULT NULL,
            KEY idx_instance (instance_id),
            KEY idx_status (status)
        ) {$charset_collate};";

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        dbDelta($sessions_sql);
        dbDelta($messages_sql);
        dbDelta($fallback_sql);

        // Store the database version
        update_option('n8n_chat_db_version', self::DB_VERSION);
    }

    /**
     * Set default plugin options
     */
    private static function set_default_options(): void {
        // Only set defaults if options don't exist
        if (false === get_option('n8n_chat_instances')) {
            update_option('n8n_chat_instances', []);
        }

        if (false === get_option('n8n_chat_global_settings')) {
            update_option('n8n_chat_global_settings', [
                'default_instance' => '',
                'enable_history' => true,
                'history_retention_days' => 90,
                'file_retention_hours' => 24,
                'enable_analytics' => false,
                'custom_css' => '',
            ]);
        }

        if (false === get_option('n8n_chat_error_messages')) {
            update_option('n8n_chat_error_messages', [
                'connection_error' => __('Unable to connect to the chat service. Please try again later.', 'n8n-chat'),
                'timeout_error' => __('The request timed out. Please try again.', 'n8n-chat'),
                'access_denied' => __('You do not have permission to access this chat.', 'n8n-chat'),
                'instance_disabled' => __('This chat is currently unavailable.', 'n8n-chat'),
            ]);
        }
    }

    /**
     * Create upload directory for temporary files
     */
    private static function create_upload_directory(): void {
        $upload_dir = wp_upload_dir();
        $n8n_chat_dir = $upload_dir['basedir'] . '/n8n-chat/temp';

        if (!file_exists($n8n_chat_dir)) {
            wp_mkdir_p($n8n_chat_dir);
        }

        // Add .htaccess to prevent direct PHP execution
        $htaccess_file = $upload_dir['basedir'] . '/n8n-chat/.htaccess';
        if (!file_exists($htaccess_file)) {
            $htaccess_content = "# n8n Chat upload protection\n";
            $htaccess_content .= "<FilesMatch \"\.php$\">\n";
            $htaccess_content .= "    Order Allow,Deny\n";
            $htaccess_content .= "    Deny from all\n";
            $htaccess_content .= "</FilesMatch>\n";

            file_put_contents($htaccess_file, $htaccess_content);
        }

        // Add index.php for directory browsing protection
        $index_file = $upload_dir['basedir'] . '/n8n-chat/index.php';
        if (!file_exists($index_file)) {
            file_put_contents($index_file, '<?php // Silence is golden');
        }
    }

    /**
     * Schedule cron jobs for cleanup tasks
     */
    private static function schedule_cron_jobs(): void {
        // File cleanup cron
        if (!wp_next_scheduled('n8n_chat_cleanup_files')) {
            wp_schedule_event(time(), 'hourly', 'n8n_chat_cleanup_files');
        }

        // Session cleanup cron (cleanup old closed sessions)
        if (!wp_next_scheduled('n8n_chat_cleanup_sessions')) {
            wp_schedule_event(time(), 'daily', 'n8n_chat_cleanup_sessions');
        }
    }
}
