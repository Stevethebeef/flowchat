<?php
/**
 * Admin REST API Endpoints
 *
 * Handles admin-facing API endpoints for managing instances and settings.
 *
 * @package FlowChat
 */

namespace FlowChat\API;

use FlowChat\Core\Instance_Manager;
use FlowChat\Core\Session_Manager;
use FlowChat\Core\Context_Builder;
use FlowChat\Core\File_Handler;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Admin_Endpoints
 */
class Admin_Endpoints {

    /**
     * API namespace
     */
    private const NAMESPACE = 'flowchat/v1/admin';

    /**
     * Instance manager
     *
     * @var Instance_Manager
     */
    private Instance_Manager $instance_manager;

    /**
     * Session manager
     *
     * @var Session_Manager
     */
    private Session_Manager $session_manager;

    /**
     * Constructor
     */
    public function __construct() {
        $this->instance_manager = new Instance_Manager();
        $this->session_manager = new Session_Manager();

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void {
        // Instances CRUD
        register_rest_route(self::NAMESPACE, '/instances', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_instances'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => 'POST',
                'callback' => [$this, 'create_instance'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        register_rest_route(self::NAMESPACE, '/instances/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_instance'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'update_instance'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_instance'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Duplicate instance
        register_rest_route(self::NAMESPACE, '/instances/(?P<id>[a-zA-Z0-9_-]+)/duplicate', [
            'methods' => 'POST',
            'callback' => [$this, 'duplicate_instance'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Test webhook connection
        register_rest_route(self::NAMESPACE, '/instances/(?P<id>[a-zA-Z0-9_-]+)/test', [
            'methods' => 'POST',
            'callback' => [$this, 'test_webhook'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Test webhook URL directly (for new instances)
        register_rest_route(self::NAMESPACE, '/test-webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'test_webhook_url'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'url' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ],
            ],
        ]);

        // Settings
        register_rest_route(self::NAMESPACE, '/settings', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_settings'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
            [
                'methods' => 'PUT',
                'callback' => [$this, 'update_settings'],
                'permission_callback' => [$this, 'check_admin_permission'],
            ],
        ]);

        // Context tags
        register_rest_route(self::NAMESPACE, '/context-tags', [
            'methods' => 'GET',
            'callback' => [$this, 'get_context_tags'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Preview system prompt
        register_rest_route(self::NAMESPACE, '/preview-prompt', [
            'methods' => 'POST',
            'callback' => [$this, 'preview_prompt'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'prompt' => [
                    'required' => true,
                    'type' => 'string',
                ],
            ],
        ]);

        // Sessions management
        register_rest_route(self::NAMESPACE, '/sessions', [
            'methods' => 'GET',
            'callback' => [$this, 'get_sessions'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'instance_id' => [
                    'required' => false,
                    'type' => 'string',
                ],
                'status' => [
                    'required' => false,
                    'type' => 'string',
                ],
                'limit' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 50,
                ],
                'offset' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 0,
                ],
            ],
        ]);

        // Fallback messages
        register_rest_route(self::NAMESPACE, '/fallback-messages', [
            'methods' => 'GET',
            'callback' => [$this, 'get_fallback_messages'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // System info
        register_rest_route(self::NAMESPACE, '/system-info', [
            'methods' => 'GET',
            'callback' => [$this, 'get_system_info'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Export/Import
        register_rest_route(self::NAMESPACE, '/export', [
            'methods' => 'POST',
            'callback' => [$this, 'export_data'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        register_rest_route(self::NAMESPACE, '/import', [
            'methods' => 'POST',
            'callback' => [$this, 'import_data'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Reorder instances (per 07-api-endpoints.md spec section 2.7)
        register_rest_route(self::NAMESPACE, '/instances/reorder', [
            'methods' => 'POST',
            'callback' => [$this, 'reorder_instances'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'order' => [
                    'required' => true,
                    'type' => 'array',
                ],
            ],
        ]);

        // Analytics overview (per 07-api-endpoints.md spec section 8)
        register_rest_route(self::NAMESPACE, '/analytics/overview', [
            'methods' => 'GET',
            'callback' => [$this, 'get_analytics_overview'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'period' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => '7d',
                ],
                'instance' => [
                    'required' => false,
                    'type' => 'string',
                ],
            ],
        ]);

        // Analytics sessions (per 07-api-endpoints.md spec section 8)
        register_rest_route(self::NAMESPACE, '/analytics/sessions', [
            'methods' => 'GET',
            'callback' => [$this, 'get_analytics_sessions'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'instance' => [
                    'required' => false,
                    'type' => 'string',
                ],
                'page' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 1,
                ],
                'per_page' => [
                    'required' => false,
                    'type' => 'integer',
                    'default' => 20,
                ],
            ],
        ]);
    }

    /**
     * Check admin permission
     *
     * @return bool
     */
    public function check_admin_permission(): bool {
        return current_user_can('manage_options');
    }

    /**
     * Get all instances
     *
     * @return \WP_REST_Response
     */
    public function get_instances(): \WP_REST_Response {
        $instances = $this->instance_manager->get_all_instances();

        // Add session counts
        foreach ($instances as &$instance) {
            $instance['sessionCount'] = $this->session_manager->get_session_count($instance['id']);
            $instance['activeSessionCount'] = $this->session_manager->get_session_count($instance['id'], 'active');
        }

        return new \WP_REST_Response(array_values($instances));
    }

    /**
     * Get single instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_instance(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $instance = $this->instance_manager->get_instance($id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        // Add session count
        $instance['sessionCount'] = $this->session_manager->get_session_count($id);

        return new \WP_REST_Response($instance);
    }

    /**
     * Create instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function create_instance(\WP_REST_Request $request): \WP_REST_Response {
        $data = $request->get_json_params();

        // Validate required fields
        if (empty($data['name'])) {
            return new \WP_REST_Response([
                'error' => 'missing_name',
                'message' => __('Instance name is required.', 'flowchat'),
            ], 400);
        }

        $id = $this->instance_manager->create_instance($data);
        $instance = $this->instance_manager->get_instance($id);

        return new \WP_REST_Response($instance, 201);
    }

    /**
     * Update instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function update_instance(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $data = $request->get_json_params();

        $existing = $this->instance_manager->get_instance($id);
        if (!$existing) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        $result = $this->instance_manager->update_instance($id, $data);

        if (!$result) {
            return new \WP_REST_Response([
                'error' => 'update_failed',
                'message' => __('Failed to update instance.', 'flowchat'),
            ], 500);
        }

        $instance = $this->instance_manager->get_instance($id);

        return new \WP_REST_Response($instance);
    }

    /**
     * Delete instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function delete_instance(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');

        $existing = $this->instance_manager->get_instance($id);
        if (!$existing) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        // Delete associated sessions
        $this->session_manager->delete_instance_sessions($id);

        // Delete instance
        $result = $this->instance_manager->delete_instance($id);

        if (!$result) {
            return new \WP_REST_Response([
                'error' => 'delete_failed',
                'message' => __('Failed to delete instance.', 'flowchat'),
            ], 500);
        }

        return new \WP_REST_Response(['success' => true]);
    }

    /**
     * Duplicate instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function duplicate_instance(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');

        $new_id = $this->instance_manager->duplicate_instance($id);

        if (!$new_id) {
            return new \WP_REST_Response([
                'error' => 'duplicate_failed',
                'message' => __('Failed to duplicate instance.', 'flowchat'),
            ], 500);
        }

        $instance = $this->instance_manager->get_instance($new_id);

        return new \WP_REST_Response($instance, 201);
    }

    /**
     * Test webhook for existing instance
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function test_webhook(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');

        $instance = $this->instance_manager->get_instance($id);
        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        $result = $this->instance_manager->test_webhook($instance['webhookUrl']);

        $status = $result['success'] ? 200 : 400;

        return new \WP_REST_Response($result, $status);
    }

    /**
     * Test webhook URL directly
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function test_webhook_url(\WP_REST_Request $request): \WP_REST_Response {
        $url = $request->get_param('url');

        $result = $this->instance_manager->test_webhook($url);

        $status = $result['success'] ? 200 : 400;

        return new \WP_REST_Response($result, $status);
    }

    /**
     * Get global settings
     *
     * @return \WP_REST_Response
     */
    public function get_settings(): \WP_REST_Response {
        $settings = get_option('flowchat_global_settings', []);
        $error_messages = get_option('flowchat_error_messages', []);

        return new \WP_REST_Response([
            'settings' => $settings,
            'errorMessages' => $error_messages,
        ]);
    }

    /**
     * Update global settings
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function update_settings(\WP_REST_Request $request): \WP_REST_Response {
        $data = $request->get_json_params();

        if (isset($data['settings'])) {
            update_option('flowchat_global_settings', $data['settings']);
        }

        if (isset($data['errorMessages'])) {
            update_option('flowchat_error_messages', $data['errorMessages']);
        }

        return new \WP_REST_Response(['success' => true]);
    }

    /**
     * Get available context tags
     *
     * @return \WP_REST_Response
     */
    public function get_context_tags(): \WP_REST_Response {
        $context_builder = new Context_Builder();
        $tags = $context_builder->get_available_tags();

        return new \WP_REST_Response($tags);
    }

    /**
     * Preview system prompt with tags resolved
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function preview_prompt(\WP_REST_Request $request): \WP_REST_Response {
        $prompt = $request->get_param('prompt');

        $context_builder = new Context_Builder();

        // Build mock context
        $context = [
            'site' => [
                'name' => get_bloginfo('name'),
                'url' => home_url(),
                'description' => get_bloginfo('description'),
            ],
            'user' => [
                'isLoggedIn' => is_user_logged_in(),
                'name' => is_user_logged_in() ? wp_get_current_user()->display_name : 'Guest',
                'email' => is_user_logged_in() ? wp_get_current_user()->user_email : '',
                'role' => is_user_logged_in() ? (wp_get_current_user()->roles[0] ?? 'subscriber') : 'guest',
            ],
            'page' => [
                'url' => admin_url(),
                'title' => __('Admin Page (Preview)', 'flowchat'),
                'type' => 'admin',
                'excerpt' => __('This is a preview of your system prompt.', 'flowchat'),
                'content' => __('This is a preview of your system prompt with all tags resolved.', 'flowchat'),
            ],
            'datetime' => [
                'date' => date_i18n('F j, Y'),
                'time' => date_i18n('g:i a'),
                'day' => date_i18n('l'),
            ],
        ];

        $resolved = $context_builder->process_tags($prompt, $context);

        return new \WP_REST_Response([
            'original' => $prompt,
            'resolved' => $resolved,
        ]);
    }

    /**
     * Get sessions
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_sessions(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $instance_id = $request->get_param('instance_id');
        $status = $request->get_param('status');
        $limit = min((int) $request->get_param('limit'), 100);
        $offset = (int) $request->get_param('offset');

        $where = ['1=1'];
        $params = [];

        if ($instance_id) {
            $where[] = 'instance_id = %s';
            $params[] = $instance_id;
        }

        if ($status) {
            $where[] = 'status = %s';
            $params[] = $status;
        }

        $where_clause = implode(' AND ', $where);
        $params[] = $limit;
        $params[] = $offset;

        $sessions = $wpdb->get_results(
            $wpdb->prepare(
                "SELECT * FROM {$wpdb->prefix}flowchat_sessions
                WHERE {$where_clause}
                ORDER BY last_activity_at DESC
                LIMIT %d OFFSET %d",
                ...$params
            )
        );

        // Get total count
        $total = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}flowchat_sessions WHERE {$where_clause}",
                ...array_slice($params, 0, -2)
            )
        );

        return new \WP_REST_Response([
            'sessions' => $sessions,
            'total' => (int) $total,
            'limit' => $limit,
            'offset' => $offset,
        ]);
    }

    /**
     * Get fallback messages
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_fallback_messages(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $messages = $wpdb->get_results(
            "SELECT * FROM {$wpdb->prefix}flowchat_fallback_messages
            ORDER BY created_at DESC
            LIMIT 100"
        );

        return new \WP_REST_Response($messages ?: []);
    }

    /**
     * Get system info
     *
     * @return \WP_REST_Response
     */
    public function get_system_info(): \WP_REST_Response {
        global $wpdb;

        $file_handler = new File_Handler();

        return new \WP_REST_Response([
            'plugin' => [
                'version' => FLOWCHAT_VERSION,
                'db_version' => get_option('flowchat_db_version', 'unknown'),
            ],
            'wordpress' => [
                'version' => get_bloginfo('version'),
                'multisite' => is_multisite(),
            ],
            'php' => [
                'version' => PHP_VERSION,
                'memory_limit' => ini_get('memory_limit'),
                'max_execution_time' => ini_get('max_execution_time'),
                'upload_max_filesize' => ini_get('upload_max_filesize'),
            ],
            'database' => [
                'sessions_count' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}flowchat_sessions"),
                'messages_count' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}flowchat_messages"),
                'fallback_count' => (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->prefix}flowchat_fallback_messages"),
            ],
            'storage' => [
                'upload_size' => $file_handler->get_total_upload_size(),
                'upload_size_formatted' => size_format($file_handler->get_total_upload_size()),
                'file_count' => $file_handler->get_file_count(),
            ],
        ]);
    }

    /**
     * Export data
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function export_data(\WP_REST_Request $request): \WP_REST_Response {
        $data = $request->get_json_params();
        $include_instances = $data['instances'] ?? true;
        $include_settings = $data['settings'] ?? true;

        $export = [
            'version' => FLOWCHAT_VERSION,
            'exported_at' => current_time('c'),
            'site_url' => home_url(),
        ];

        if ($include_instances) {
            $export['instances'] = $this->instance_manager->get_all_instances();
        }

        if ($include_settings) {
            $export['settings'] = get_option('flowchat_global_settings', []);
            $export['error_messages'] = get_option('flowchat_error_messages', []);
        }

        return new \WP_REST_Response($export);
    }

    /**
     * Import data
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function import_data(\WP_REST_Request $request): \WP_REST_Response {
        $data = $request->get_json_params();

        $imported = [
            'instances' => 0,
            'settings' => false,
        ];

        // Import instances
        if (!empty($data['instances']) && is_array($data['instances'])) {
            foreach ($data['instances'] as $instance) {
                // Remove ID to create new instance
                unset($instance['id']);
                unset($instance['createdAt']);
                unset($instance['updatedAt']);

                // Clear webhook URL for security
                $instance['webhookUrl'] = '';
                $instance['isEnabled'] = false;

                $this->instance_manager->create_instance($instance);
                $imported['instances']++;
            }
        }

        // Import settings
        if (!empty($data['settings'])) {
            update_option('flowchat_global_settings', $data['settings']);
            $imported['settings'] = true;
        }

        if (!empty($data['error_messages'])) {
            update_option('flowchat_error_messages', $data['error_messages']);
        }

        return new \WP_REST_Response([
            'success' => true,
            'imported' => $imported,
        ]);
    }

    /**
     * Reorder instances
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function reorder_instances(\WP_REST_Request $request): \WP_REST_Response {
        $order = $request->get_param('order');

        if (!is_array($order)) {
            return new \WP_REST_Response([
                'error' => 'invalid_order',
                'message' => __('Order must be an array of instance IDs.', 'flowchat'),
            ], 400);
        }

        // Update order for each instance
        foreach ($order as $index => $instance_id) {
            $this->instance_manager->update_instance($instance_id, ['order' => $index + 1]);
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'reordered' => true,
            ],
        ]);
    }

    /**
     * Get analytics overview
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_analytics_overview(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $period = $request->get_param('period');
        $instance_id = $request->get_param('instance');

        // Calculate date range
        $days = match($period) {
            '24h' => 1,
            '7d' => 7,
            '30d' => 30,
            '90d' => 90,
            default => 7,
        };

        $start_date = date('Y-m-d H:i:s', strtotime("-{$days} days"));
        $sessions_table = $wpdb->prefix . 'flowchat_sessions';
        $messages_table = $wpdb->prefix . 'flowchat_messages';

        // Build where clause
        $where = "started_at >= %s";
        $params = [$start_date];

        if ($instance_id) {
            $where .= " AND instance_id = %s";
            $params[] = $instance_id;
        }

        // Get total conversations
        $total_conversations = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$sessions_table} WHERE {$where}",
            ...$params
        ));

        // Get total messages
        $total_messages = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(m.id) FROM {$messages_table} m
             INNER JOIN {$sessions_table} s ON m.session_uuid = s.uuid
             WHERE s.started_at >= %s" . ($instance_id ? " AND s.instance_id = %s" : ""),
            ...($instance_id ? [$start_date, $instance_id] : [$start_date])
        ));

        // Get unique users
        $unique_users = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(DISTINCT COALESCE(user_id, visitor_id)) FROM {$sessions_table} WHERE {$where}",
            ...$params
        ));

        // Calculate average messages per conversation
        $avg_messages = $total_conversations > 0 ? round($total_messages / $total_conversations, 1) : 0;

        // Get stats by instance
        $by_instance = [];
        $instances = $this->instance_manager->get_all_instances();
        foreach ($instances as $inst) {
            $inst_conversations = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(*) FROM {$sessions_table} WHERE started_at >= %s AND instance_id = %s",
                $start_date,
                $inst['id']
            ));

            $inst_messages = (int) $wpdb->get_var($wpdb->prepare(
                "SELECT COUNT(m.id) FROM {$messages_table} m
                 INNER JOIN {$sessions_table} s ON m.session_uuid = s.uuid
                 WHERE s.started_at >= %s AND s.instance_id = %s",
                $start_date,
                $inst['id']
            ));

            $by_instance[$inst['id']] = [
                'conversations' => $inst_conversations,
                'messages' => $inst_messages,
            ];
        }

        // Get trend data (daily counts)
        $trend = $wpdb->get_results($wpdb->prepare(
            "SELECT DATE(started_at) as date, COUNT(*) as count
             FROM {$sessions_table}
             WHERE {$where}
             GROUP BY DATE(started_at)
             ORDER BY date ASC",
            ...$params
        ), ARRAY_A);

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'period' => $period,
                'metrics' => [
                    'total_conversations' => $total_conversations,
                    'total_messages' => $total_messages,
                    'unique_users' => $unique_users,
                    'avg_messages_per_conversation' => $avg_messages,
                ],
                'by_instance' => $by_instance,
                'trend' => [
                    'conversations' => $trend,
                ],
            ],
        ]);
    }

    /**
     * Get analytics sessions list
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_analytics_sessions(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $instance_id = $request->get_param('instance');
        $page = max(1, (int) $request->get_param('page'));
        $per_page = min(100, max(1, (int) $request->get_param('per_page')));
        $offset = ($page - 1) * $per_page;

        $sessions_table = $wpdb->prefix . 'flowchat_sessions';
        $messages_table = $wpdb->prefix . 'flowchat_messages';

        // Build where clause
        $where = '1=1';
        $params = [];

        if ($instance_id) {
            $where .= ' AND s.instance_id = %s';
            $params[] = $instance_id;
        }

        $params[] = $per_page;
        $params[] = $offset;

        // Get sessions with message count
        $sessions = $wpdb->get_results($wpdb->prepare(
            "SELECT s.*,
                    (SELECT COUNT(*) FROM {$messages_table} WHERE session_uuid = s.uuid) as message_count
             FROM {$sessions_table} s
             WHERE {$where}
             ORDER BY s.started_at DESC
             LIMIT %d OFFSET %d",
            ...$params
        ), ARRAY_A);

        // Get total count
        $total = (int) $wpdb->get_var($wpdb->prepare(
            "SELECT COUNT(*) FROM {$sessions_table} s WHERE {$where}",
            ...array_slice($params, 0, -2)
        ));

        $total_pages = ceil($total / $per_page);

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'sessions' => $sessions,
            ],
            'meta' => [
                'total' => $total,
                'page' => $page,
                'per_page' => $per_page,
                'total_pages' => $total_pages,
            ],
        ]);
    }
}
