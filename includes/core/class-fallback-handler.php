<?php
/**
 * Fallback Handler for n8n Chat
 *
 * Handles fallback contact form when n8n is unavailable.
 * Stores messages and notifies admins.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

defined('ABSPATH') || exit;

/**
 * Fallback Handler class
 */
class Fallback_Handler {

    /**
     * Table name for fallback messages
     */
    const TABLE_NAME = 'n8n_chat_fallback_messages';

    /**
     * Singleton instance
     */
    private static ?Fallback_Handler $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Fallback_Handler {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Schedule cleanup cron
        if (!wp_next_scheduled('n8n_chat_cleanup_fallback_messages')) {
            wp_schedule_event(time(), 'daily', 'n8n_chat_cleanup_fallback_messages');
        }

        add_action('n8n_chat_cleanup_fallback_messages', [$this, 'cleanup_old_messages']);
    }

    /**
     * Check if n8n webhook is available
     *
     * @param string $webhook_url Webhook URL to check
     * @param int    $timeout Request timeout in seconds
     * @return array Health check result
     */
    public function check_webhook_health(string $webhook_url, int $timeout = 5): array {
        $cache_key = 'n8n_chat_webhook_health_' . md5($webhook_url);
        $cached = get_transient($cache_key);

        if ($cached !== false) {
            return $cached;
        }

        $result = [
            'available' => false,
            'response_time' => null,
            'error' => null,
            'checked_at' => current_time('mysql'),
        ];

        $start_time = microtime(true);

        // Send a HEAD request to check availability
        $response = wp_remote_head($webhook_url, [
            'timeout' => $timeout,
            'sslverify' => apply_filters('n8n_chat_ssl_verify', true),
        ]);

        $result['response_time'] = round((microtime(true) - $start_time) * 1000); // ms

        if (is_wp_error($response)) {
            $result['error'] = $response->get_error_message();
        } else {
            $status_code = wp_remote_retrieve_response_code($response);
            // n8n webhooks typically return 405 for HEAD requests, which means it's available
            $result['available'] = in_array($status_code, [200, 405, 400], true);

            if (!$result['available']) {
                $result['error'] = "HTTP {$status_code}";
            }
        }

        // Cache for 1 minute
        set_transient($cache_key, $result, MINUTE_IN_SECONDS);

        return $result;
    }

    /**
     * Check if fallback should be activated
     *
     * @param int $instance_id Instance ID
     * @return bool Should use fallback
     */
    public function should_use_fallback(int $instance_id): bool {
        $instance_manager = Instance_Manager::get_instance();
        $instance = $instance_manager->get($instance_id);

        if (!$instance) {
            return true;
        }

        // Check if fallback is enabled for this instance
        $config = $instance['config'] ?? [];
        if (empty($config['fallback_enabled'])) {
            return false;
        }

        // Check webhook health
        $webhook_url = $instance['webhook_url'] ?? '';
        if (empty($webhook_url)) {
            return true;
        }

        $health = $this->check_webhook_health($webhook_url);

        return !$health['available'];
    }

    /**
     * Get fallback configuration for instance
     *
     * @param int $instance_id Instance ID
     * @return array Fallback config
     */
    public function get_fallback_config(int $instance_id): array {
        $instance_manager = Instance_Manager::get_instance();
        $instance = $instance_manager->get($instance_id);

        $config = $instance['config'] ?? [];

        return [
            'enabled' => !empty($config['fallback_enabled']),
            'title' => $config['fallback_title'] ?? __('Contact Us', 'n8n-chat'),
            'message' => $config['fallback_message'] ?? __('Our chat is currently unavailable. Please leave your message and we\'ll get back to you soon.', 'n8n-chat'),
            'fields' => $config['fallback_fields'] ?? ['name', 'email', 'message'],
            'require_email' => $config['fallback_require_email'] ?? true,
            'success_message' => $config['fallback_success_message'] ?? __('Thank you! We\'ll get back to you soon.', 'n8n-chat'),
            'notification_email' => $config['fallback_notification_email'] ?? get_option('admin_email'),
        ];
    }

    /**
     * Submit fallback message
     *
     * @param int   $instance_id Instance ID
     * @param array $data Form data
     * @return array Result
     */
    public function submit_message(int $instance_id, array $data): array {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        // Validate required fields
        $config = $this->get_fallback_config($instance_id);

        if ($config['require_email'] && empty($data['email'])) {
            return [
                'success' => false,
                'error' => __('Email is required.', 'n8n-chat'),
            ];
        }

        if (empty($data['message'])) {
            return [
                'success' => false,
                'error' => __('Message is required.', 'n8n-chat'),
            ];
        }

        // Sanitize data
        $insert_data = [
            'instance_id' => $instance_id,
            'name' => sanitize_text_field($data['name'] ?? ''),
            'email' => sanitize_email($data['email'] ?? ''),
            'phone' => sanitize_text_field($data['phone'] ?? ''),
            'message' => sanitize_textarea_field($data['message']),
            'page_url' => esc_url_raw($data['page_url'] ?? ''),
            'user_id' => get_current_user_id(),
            'ip_address' => $this->get_client_ip(),
            'user_agent' => isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '',
            'metadata' => wp_json_encode($data['metadata'] ?? []),
            'status' => 'new',
            'created_at' => current_time('mysql'),
        ];

        // Insert into database
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery -- Inserting fallback message into custom table
        $result = $wpdb->insert($table, $insert_data, [
            '%d', '%s', '%s', '%s', '%s', '%s', '%d', '%s', '%s', '%s', '%s', '%s',
        ]);

        if ($result === false) {
            return [
                'success' => false,
                'error' => __('Failed to save message. Please try again.', 'n8n-chat'),
            ];
        }

        $message_id = $wpdb->insert_id;

        // Send notification email
        $this->send_notification_email($instance_id, $message_id, $insert_data);

        // Fire action
        do_action('n8n_chat_fallback_message_submitted', $message_id, $insert_data, $instance_id);

        return [
            'success' => true,
            'message_id' => $message_id,
            'message' => $config['success_message'],
        ];
    }

    /**
     * Send notification email to admin
     *
     * @param int   $instance_id Instance ID
     * @param int   $message_id Message ID
     * @param array $data Message data
     */
    private function send_notification_email(int $instance_id, int $message_id, array $data): void {
        $config = $this->get_fallback_config($instance_id);
        $to = $config['notification_email'];

        if (empty($to)) {
            return;
        }

        $instance_manager = Instance_Manager::get_instance();
        $instance = $instance_manager->get($instance_id);
        $instance_name = $instance['name'] ?? 'Unknown';

        $subject = sprintf(
            /* translators: 1: Site name, 2: Instance name */
            __('[%1$s] New n8n Chat Message from %2$s', 'n8n-chat'),
            get_bloginfo('name'),
            $instance_name
        );

        /* translators: %1$s: instance name, %2$s: user name, %3$s: user email, %4$s: user phone, %5$s: page URL, %6$s: user message */
        $body = sprintf(
            __( "New message received via n8n Chat fallback form.\n\nInstance: %1\$s\nName: %2\$s\nEmail: %3\$s\nPhone: %4\$s\nPage URL: %5\$s\n\nMessage:\n%6\$s\n\n---\nView all messages in your WordPress admin.", 'n8n-chat' ),
            $instance_name,
            $data['name'] ?: __( 'Not provided', 'n8n-chat' ),
            $data['email'] ?: __( 'Not provided', 'n8n-chat' ),
            $data['phone'] ?: __( 'Not provided', 'n8n-chat' ),
            $data['page_url'] ?: __( 'Unknown', 'n8n-chat' ),
            $data['message']
        );

        $headers = [];

        if (!empty($data['email'])) {
            $reply_name = $data['name'] ?: $data['email'];
            $headers[] = 'Reply-To: ' . $reply_name . ' <' . $data['email'] . '>';
        }

        wp_mail($to, $subject, $body, $headers);
    }

    /**
     * Get client IP address
     *
     * @return string IP address
     */
    private function get_client_ip(): string {
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP',
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($ip_keys as $key) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- Properly sanitized with wp_unslash and sanitize_text_field
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field(wp_unslash($_SERVER[$key]));
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return 'unknown';
    }

    /**
     * Get fallback messages
     *
     * @param array $args Query arguments
     * @return array Messages
     */
    public function get_messages(array $args = []): array {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        $defaults = [
            'instance_id' => null,
            'status' => null,
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'created_at',
            'order' => 'DESC',
        ];

        $args = wp_parse_args($args, $defaults);

        $where = ['1=1'];
        $values = [];

        if ($args['instance_id'] !== null) {
            $where[] = 'instance_id = %d';
            $values[] = $args['instance_id'];
        }

        if ($args['status'] !== null) {
            $where[] = 'status = %s';
            $values[] = $args['status'];
        }

        $orderby = in_array($args['orderby'], ['created_at', 'id', 'status'], true)
            ? $args['orderby']
            : 'created_at';

        $order = strtoupper($args['order']) === 'ASC' ? 'ASC' : 'DESC';

        $sql = "SELECT * FROM {$table} WHERE " . implode(' AND ', $where);
        $sql .= " ORDER BY {$orderby} {$order}";
        $sql .= " LIMIT %d OFFSET %d";

        $values[] = $args['limit'];
        $values[] = $args['offset'];

        if (!empty($values)) {
            // phpcs:ignore WordPress.DB.PreparedSQL.NotPrepared -- SQL is dynamically constructed but properly prepared with $wpdb->prepare()
            $sql = $wpdb->prepare($sql, $values);
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared -- SQL is prepared above
        $results = $wpdb->get_results($sql, ARRAY_A);

        return $results ?: [];
    }

    /**
     * Get message by ID
     *
     * @param int $message_id Message ID
     * @return array|null Message or null
     */
    public function get_message(int $message_id): ?array {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name safely constructed from $wpdb->prefix
        $result = $wpdb->get_row(
            $wpdb->prepare("SELECT * FROM {$table} WHERE id = %d", $message_id),
            ARRAY_A
        );

        return $result ?: null;
    }

    /**
     * Update message status
     *
     * @param int    $message_id Message ID
     * @param string $status New status (new, read, replied, archived)
     * @return bool Success
     */
    public function update_status(int $message_id, string $status): bool {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        $valid_statuses = ['new', 'read', 'replied', 'archived'];
        if (!in_array($status, $valid_statuses, true)) {
            return false;
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Updating fallback message status
        $result = $wpdb->update(
            $table,
            [
                'status' => $status,
                'updated_at' => current_time('mysql'),
            ],
            ['id' => $message_id],
            ['%s', '%s'],
            ['%d']
        );

        return $result !== false;
    }

    /**
     * Delete message
     *
     * @param int $message_id Message ID
     * @return bool Success
     */
    public function delete_message(int $message_id): bool {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Deleting fallback message
        $result = $wpdb->delete($table, ['id' => $message_id], ['%d']);

        return $result !== false;
    }

    /**
     * Get message count by status
     *
     * @param int|null $instance_id Instance ID (null for all)
     * @return array Counts by status
     */
    public function get_counts(?int $instance_id = null): array {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        $where = '';
        if ($instance_id !== null) {
            $where = $wpdb->prepare(' WHERE instance_id = %d', $instance_id);
        }

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared, WordPress.DB.PreparedSQL.NotPrepared -- Table name safely constructed, where clause is prepared
        $results = $wpdb->get_results(
            "SELECT status, COUNT(*) as count FROM {$table}{$where} GROUP BY status",
            ARRAY_A
        );

        $counts = [
            'new' => 0,
            'read' => 0,
            'replied' => 0,
            'archived' => 0,
            'total' => 0,
        ];

        foreach ($results as $row) {
            $counts[$row['status']] = (int) $row['count'];
            $counts['total'] += (int) $row['count'];
        }

        return $counts;
    }

    /**
     * Cleanup old messages
     *
     * @param int $days Days to keep messages
     */
    public function cleanup_old_messages(int $days = 90): void {
        global $wpdb;

        $table = $wpdb->prefix . self::TABLE_NAME;

        // Delete archived messages older than X days
        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- Table name safely constructed from $wpdb->prefix
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$table} WHERE status = 'archived' AND created_at < DATE_SUB(NOW(), INTERVAL %d DAY)",
                $days
            )
        );

        do_action('n8n_chat_fallback_messages_cleaned', $days);
    }

    /**
     * Export messages to CSV
     *
     * @param array $args Query arguments
     * @return string CSV content
     */
    public function export_csv(array $args = []): string {
        $messages = $this->get_messages(array_merge($args, ['limit' => 10000]));

        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen -- Using php://temp for CSV generation in memory
        $csv = fopen('php://temp', 'r+');

        // Header row
        fputcsv($csv, [
            'ID',
            'Instance ID',
            'Name',
            'Email',
            'Phone',
            'Message',
            'Page URL',
            'Status',
            'Created At',
        ]);

        // Data rows
        foreach ($messages as $message) {
            fputcsv($csv, [
                $message['id'],
                $message['instance_id'],
                $message['name'],
                $message['email'],
                $message['phone'],
                $message['message'],
                $message['page_url'],
                $message['status'],
                $message['created_at'],
            ]);
        }

        rewind($csv);
        $content = stream_get_contents($csv);
        // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose -- Closing php://temp stream
        fclose($csv);

        return $content;
    }

    /**
     * Check if fallback form should be shown
     * Based on webhook health and instance config
     *
     * @param int $instance_id Instance ID
     * @return array Fallback status
     */
    public function get_fallback_status(int $instance_id): array {
        $config = $this->get_fallback_config($instance_id);

        if (!$config['enabled']) {
            return [
                'show_fallback' => false,
                'reason' => 'disabled',
            ];
        }

        $should_fallback = $this->should_use_fallback($instance_id);

        return [
            'show_fallback' => $should_fallback,
            'reason' => $should_fallback ? 'webhook_unavailable' : 'chat_available',
            'config' => $should_fallback ? $config : null,
        ];
    }
}
