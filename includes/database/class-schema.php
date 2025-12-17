<?php
/**
 * Database Schema Handler
 *
 * Handles database table creation and migrations.
 *
 * @package N8nChat
 */

namespace N8nChat\Database;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Schema
 */
class Schema {

    /**
     * Current schema version
     */
    private const VERSION = '1.0.0';

    /**
     * Table names (without prefix)
     */
    private const TABLES = [
        'sessions' => 'n8n_chat_sessions',
        'messages' => 'n8n_chat_messages',
        'fallback' => 'n8n_chat_fallback_messages',
    ];

    /**
     * Get table name with prefix
     *
     * @param string $table Table key
     * @return string Full table name
     */
    public static function get_table_name(string $table): string {
        global $wpdb;
        return $wpdb->prefix . (self::TABLES[$table] ?? $table);
    }

    /**
     * Create all tables
     */
    public static function create_tables(): void {
        global $wpdb;

        $charset_collate = $wpdb->get_charset_collate();

        require_once ABSPATH . 'wp-admin/includes/upgrade.php';

        // Sessions table
        $sessions_sql = "CREATE TABLE " . self::get_table_name('sessions') . " (
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

        dbDelta($sessions_sql);

        // Messages table
        $messages_sql = "CREATE TABLE " . self::get_table_name('messages') . " (
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

        dbDelta($messages_sql);

        // Fallback messages table
        $fallback_sql = "CREATE TABLE " . self::get_table_name('fallback') . " (
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

        dbDelta($fallback_sql);

        // Update schema version
        update_option('n8n_chat_db_version', self::VERSION);
    }

    /**
     * Drop all tables
     */
    public static function drop_tables(): void {
        global $wpdb;

        foreach (self::TABLES as $table) {
            $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}{$table}");
        }

        delete_option('n8n_chat_db_version');
    }

    /**
     * Check if tables exist
     *
     * @return bool
     */
    public static function tables_exist(): bool {
        global $wpdb;

        foreach (self::TABLES as $table) {
            $table_name = $wpdb->prefix . $table;
            $result = $wpdb->get_var(
                $wpdb->prepare("SHOW TABLES LIKE %s", $table_name)
            );

            if ($result !== $table_name) {
                return false;
            }
        }

        return true;
    }

    /**
     * Check if schema needs update
     *
     * @return bool
     */
    public static function needs_update(): bool {
        $installed_version = get_option('n8n_chat_db_version', '0.0.0');
        return version_compare($installed_version, self::VERSION, '<');
    }

    /**
     * Run schema migrations
     */
    public static function migrate(): void {
        $installed_version = get_option('n8n_chat_db_version', '0.0.0');

        // Run migrations based on version
        // Example:
        // if (version_compare($installed_version, '1.1.0', '<')) {
        //     self::migrate_to_1_1_0();
        // }

        // Update to current version
        if (self::needs_update()) {
            self::create_tables();
        }
    }

    /**
     * Get database statistics
     *
     * @return array
     */
    public static function get_stats(): array {
        global $wpdb;

        $stats = [];

        foreach (self::TABLES as $key => $table) {
            $table_name = $wpdb->prefix . $table;

            // Row count
            $count = $wpdb->get_var("SELECT COUNT(*) FROM {$table_name}");
            $stats[$key]['count'] = (int) $count;

            // Table size
            $size = $wpdb->get_row(
                $wpdb->prepare(
                    "SELECT
                        DATA_LENGTH + INDEX_LENGTH as size
                    FROM information_schema.TABLES
                    WHERE TABLE_SCHEMA = %s
                    AND TABLE_NAME = %s",
                    DB_NAME,
                    $table_name
                )
            );

            $stats[$key]['size'] = $size ? (int) $size->size : 0;
            $stats[$key]['size_formatted'] = size_format($stats[$key]['size']);
        }

        return $stats;
    }

    /**
     * Optimize tables
     */
    public static function optimize_tables(): void {
        global $wpdb;

        foreach (self::TABLES as $table) {
            $wpdb->query("OPTIMIZE TABLE {$wpdb->prefix}{$table}");
        }
    }

    /**
     * Truncate all tables (remove all data)
     */
    public static function truncate_tables(): void {
        global $wpdb;

        // Disable foreign key checks
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 0');

        foreach (self::TABLES as $table) {
            $wpdb->query("TRUNCATE TABLE {$wpdb->prefix}{$table}");
        }

        // Re-enable foreign key checks
        $wpdb->query('SET FOREIGN_KEY_CHECKS = 1');
    }
}
