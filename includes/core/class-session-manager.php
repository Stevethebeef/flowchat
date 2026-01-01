<?php
/**
 * Session Manager
 *
 * Handles chat session creation and management.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Session_Manager
 *
 * phpcs:disable WordPress.DB.PreparedSQL.NotPrepared -- TABLE_NAME and MESSAGES_TABLE are class constants (fixed strings), not dynamic variables
 */
class Session_Manager {

    /**
     * Sessions table name (without prefix)
     */
    private const TABLE_NAME = 'n8n_chat_sessions';

    /**
     * Messages table name (without prefix)
     */
    private const MESSAGES_TABLE = 'n8n_chat_messages';

    /**
     * Singleton instance
     */
    private static ?Session_Manager $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Session_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Register cleanup hooks
        add_action('n8n_chat_cleanup_sessions', [$this, 'cleanup_old_sessions']);
    }

    /**
     * Get or create a session for an instance
     *
     * @param string $instance_id Instance ID
     * @param string|null $existing_session_uuid Existing session UUID from client
     * @return string Session UUID
     */
    public function get_or_create_session(string $instance_id, ?string $existing_session_uuid = null): string {
        // If client has existing session UUID, validate it
        if ($existing_session_uuid) {
            $session = $this->get_session_by_uuid($existing_session_uuid);

            if ($session && $session->instance_id === $instance_id && $session->status === 'active') {
                // Update last activity
                $this->update_session_activity($existing_session_uuid);
                return $existing_session_uuid;
            }
        }

        // Create new session
        return $this->create_session($instance_id);
    }

    /**
     * Create a new session
     *
     * @param string $instance_id Instance ID
     * @return string Session UUID
     */
    public function create_session(string $instance_id): string {
        global $wpdb;

        $uuid = wp_generate_uuid4();
        $user_id = get_current_user_id() ?: null;
        $visitor_id = $this->get_visitor_id();

        $wpdb->insert(
            $wpdb->prefix . self::TABLE_NAME,
            [
                'uuid' => $uuid,
                'instance_id' => $instance_id,
                'user_id' => $user_id,
                'visitor_id' => $visitor_id,
                'status' => 'active',
                'started_at' => current_time('mysql'),
                'last_activity_at' => current_time('mysql'),
            ],
            ['%s', '%s', '%d', '%s', '%s', '%s', '%s']
        );

        return $uuid;
    }

    /**
     * Get session by UUID
     *
     * @param string $uuid Session UUID
     * @return object|null Session data
     */
    public function get_session_by_uuid(string $uuid): ?object {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}" . self::TABLE_NAME . " WHERE uuid = %s",
                $uuid
            )
        );

        return $session ?: null;
    }

    /**
     * Get session by ID
     *
     * @param int $id Session ID
     * @return object|null Session data
     */
    public function get_session_by_id(int $id): ?object {
        global $wpdb;

        $session = $wpdb->get_row(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}" . self::TABLE_NAME . " WHERE id = %d",
                $id
            )
        );

        return $session ?: null;
    }

    /**
     * Update session last activity timestamp
     *
     * @param string $uuid Session UUID
     * @return bool Success
     */
    public function update_session_activity(string $uuid): bool {
        global $wpdb;

        $result = $wpdb->update(
            $wpdb->prefix . self::TABLE_NAME,
            ['last_activity_at' => current_time('mysql')],
            ['uuid' => $uuid],
            ['%s'],
            ['%s']
        );

        return $result !== false;
    }

    /**
     * Close a session
     *
     * @param string $uuid Session UUID
     * @return bool Success
     */
    public function close_session(string $uuid): bool {
        global $wpdb;

        $result = $wpdb->update(
            $wpdb->prefix . self::TABLE_NAME,
            [
                'status' => 'closed',
                'closed_at' => current_time('mysql'),
            ],
            ['uuid' => $uuid],
            ['%s', '%s'],
            ['%s']
        );

        return $result !== false;
    }

    /**
     * Save a message to session history
     *
     * @param string $session_uuid Session UUID
     * @param string $role Message role (user, assistant, system)
     * @param array $content Message content
     * @param array $metadata Optional metadata
     * @return int|false Message ID or false on failure
     */
    public function save_message(string $session_uuid, string $role, array $content, array $metadata = []) {
        global $wpdb;

        $session = $this->get_session_by_uuid($session_uuid);

        if (!$session) {
            return false;
        }

        $result = $wpdb->insert(
            $wpdb->prefix . self::MESSAGES_TABLE,
            [
                'session_id' => $session->id,
                'session_uuid' => $session_uuid,
                'role' => $role,
                'content' => wp_json_encode($content),
                'metadata' => !empty($metadata) ? wp_json_encode($metadata) : null,
                'created_at' => current_time('mysql'),
            ],
            ['%d', '%s', '%s', '%s', '%s', '%s']
        );

        if ($result) {
            // Update session activity
            $this->update_session_activity($session_uuid);
            return $wpdb->insert_id;
        }

        return false;
    }

    /**
     * Get messages for a session
     *
     * @param string $session_uuid Session UUID
     * @param int $limit Max messages to return
     * @param int $offset Offset for pagination
     * @return array Messages
     */
    public function get_messages(string $session_uuid, int $limit = 100, int $offset = 0): array {
        global $wpdb;

        $messages = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}" . self::MESSAGES_TABLE . "
                WHERE session_uuid = %s
                ORDER BY created_at ASC
                LIMIT %d OFFSET %d",
                $session_uuid,
                $limit,
                $offset
            )
        );

        return array_map(function($message) {
            $message->content = json_decode($message->content, true);
            $message->metadata = $message->metadata ? json_decode($message->metadata, true) : null;
            return $message;
        }, $messages ?: []);
    }

    /**
     * Get sessions for an instance
     *
     * @param string $instance_id Instance ID
     * @param array $args Query arguments
     * @return array Sessions
     */
    public function get_sessions_for_instance(string $instance_id, array $args = []): array {
        global $wpdb;

        $defaults = [
            'status' => null,
            'limit' => 50,
            'offset' => 0,
            'orderby' => 'last_activity_at',
            'order' => 'DESC',
        ];

        $args = wp_parse_args($args, $defaults);

        $where = ['instance_id = %s'];
        $params = [$instance_id];

        if ($args['status']) {
            $where[] = 'status = %s';
            $params[] = $args['status'];
        }

        $where_clause = implode(' AND ', $where);
        $orderby = sanitize_sql_orderby($args['orderby'] . ' ' . $args['order']) ?: 'last_activity_at DESC';

        $params[] = $args['limit'];
        $params[] = $args['offset'];

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Sessions need direct DB access
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $where_clause and $orderby are safely constructed
        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}" . self::TABLE_NAME . "
                WHERE {$where_clause}
                ORDER BY {$orderby}
                LIMIT %d OFFSET %d",
                ...$params
            )
        );

        return $sessions ?: [];
    }

    /**
     * Get session count for an instance
     *
     * @param string $instance_id Instance ID
     * @param string|null $status Filter by status
     * @return int Count
     */
    public function get_session_count(string $instance_id, ?string $status = null): int {
        global $wpdb;

        $where = ['instance_id = %s'];
        $params = [$instance_id];

        if ($status) {
            $where[] = 'status = %s';
            $params[] = $status;
        }

        $where_clause = implode(' AND ', $where);

        // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching -- Count query
        // phpcs:ignore WordPress.DB.PreparedSQL.InterpolatedNotPrepared -- $where_clause contains prepared placeholders
        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}" . self::TABLE_NAME . " WHERE {$where_clause}",
                ...$params
            )
        );
    }

    /**
     * Get total message count for a session
     *
     * @param string $session_uuid Session UUID
     * @return int Count
     */
    public function get_message_count(string $session_uuid): int {
        global $wpdb;

        return (int) $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}" . self::MESSAGES_TABLE . " WHERE session_uuid = %s",
                $session_uuid
            )
        );
    }

    /**
     * Cleanup old closed sessions
     *
     * @return int Number of deleted sessions
     */
    public function cleanup_old_sessions(): int {
        global $wpdb;

        $settings = get_option('n8n_chat_global_settings', []);
        $retention_days = $settings['history_retention_days'] ?? 90;

        $cutoff_date = gmdate('Y-m-d H:i:s', strtotime("-{$retention_days} days"));

        // Delete old messages first (foreign key constraint)
        $wpdb->query(
            $wpdb->prepare(
                "DELETE m FROM {$wpdb->prefix}" . self::MESSAGES_TABLE . " m
                INNER JOIN {$wpdb->prefix}" . self::TABLE_NAME . " s ON m.session_id = s.id
                WHERE s.status = 'closed' AND s.closed_at < %s",
                $cutoff_date
            )
        );

        // Delete old sessions
        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}" . self::TABLE_NAME . "
                WHERE status = 'closed' AND closed_at < %s",
                $cutoff_date
            )
        );

        return (int) $deleted;
    }

    /**
     * Get or generate visitor ID
     *
     * @return string Visitor ID
     */
    private function get_visitor_id(): string {
        // Check if user is logged in
        if (is_user_logged_in()) {
            return 'user_' . get_current_user_id();
        }

        // For guests, generate a consistent ID based on available data
        $ip = $this->get_client_ip();
        $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';

        return 'guest_' . substr(md5($ip . $user_agent), 0, 16);
    }

    /**
     * Get client IP address
     *
     * @return string IP address
     */
    private function get_client_ip(): string {
        $ip_keys = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];

        foreach ($ip_keys as $key) {
            // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized, WordPress.Security.ValidatedSanitizedInput.MissingUnslash -- Properly sanitized below
            if (!empty($_SERVER[$key])) {
                $ip = sanitize_text_field(wp_unslash($_SERVER[$key]));

                // Handle comma-separated IPs (X-Forwarded-For)
                if (str_contains($ip, ',')) {
                    $ip = trim(explode(',', $ip)[0]);
                }

                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }

        return '0.0.0.0';
    }

    /**
     * Delete all sessions for an instance
     *
     * @param string $instance_id Instance ID
     * @return int Number of deleted sessions
     */
    public function delete_instance_sessions(string $instance_id): int {
        global $wpdb;

        // Get session IDs first
        $session_ids = $wpdb->get_col(
            $wpdb->prepare(
                "SELECT id FROM {$wpdb->prefix}" . self::TABLE_NAME . " WHERE instance_id = %s",
                $instance_id
            )
        );

        if (empty($session_ids)) {
            return 0;
        }

        // Delete messages
        $ids_placeholder = implode(',', array_fill(0, count($session_ids), '%d'));
        $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}" . self::MESSAGES_TABLE . " WHERE session_id IN ({$ids_placeholder})",
                ...$session_ids
            )
        );

        // Delete sessions
        $deleted = $wpdb->query(
            $wpdb->prepare(
                "DELETE FROM {$wpdb->prefix}" . self::TABLE_NAME . " WHERE instance_id = %s",
                $instance_id
            )
        );

        return (int) $deleted;
    }
}
