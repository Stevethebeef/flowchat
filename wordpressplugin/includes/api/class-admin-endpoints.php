<?php
/**
 * Admin REST API Endpoints
 *
 * Handles admin-facing API endpoints for managing instances and settings.
 *
 * @package N8nChat
 */

namespace N8nChat\API;

use N8nChat\Core\Instance_Manager;
use N8nChat\Core\Session_Manager;
use N8nChat\Core\Context_Builder;
use N8nChat\Core\File_Handler;

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
    private const NAMESPACE = 'n8n-chat/v1/admin';

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
        $this->instance_manager = Instance_Manager::get_instance();
        $this->session_manager = Session_Manager::get_instance();

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
            'methods' => 'GET',
            'callback' => [$this, 'export_data'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'type' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'all',
                    'enum' => ['all', 'instances', 'settings'],
                ],
            ],
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

        // Style presets
        register_rest_route(self::NAMESPACE, '/style-presets', [
            'methods' => 'GET',
            'callback' => [$this, 'get_style_presets'],
            'permission_callback' => [$this, 'check_admin_permission'],
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
        $instance = $this->instance_manager->get($id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'n8n-chat'),
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
                'message' => __('Instance name is required.', 'n8n-chat'),
            ], 400);
        }

        $id = $this->instance_manager->create_instance($data);
        $instance = $this->instance_manager->get($id);

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

        $existing = $this->instance_manager->get($id);
        if (!$existing) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'n8n-chat'),
            ], 404);
        }

        $result = $this->instance_manager->update_instance($id, $data);

        if (!$result) {
            return new \WP_REST_Response([
                'error' => 'update_failed',
                'message' => __('Failed to update instance.', 'n8n-chat'),
            ], 500);
        }

        $instance = $this->instance_manager->get($id);

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

        $existing = $this->instance_manager->get($id);
        if (!$existing) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'n8n-chat'),
            ], 404);
        }

        // Delete associated sessions
        $this->session_manager->delete_instance_sessions($id);

        // Delete instance
        $result = $this->instance_manager->delete_instance($id);

        if (!$result) {
            return new \WP_REST_Response([
                'error' => 'delete_failed',
                'message' => __('Failed to delete instance.', 'n8n-chat'),
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
                'message' => __('Failed to duplicate instance.', 'n8n-chat'),
            ], 500);
        }

        $instance = $this->instance_manager->get($new_id);

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

        $instance = $this->instance_manager->get($id);
        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'not_found',
                'message' => __('Instance not found.', 'n8n-chat'),
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
        $settings = get_option('n8n_chat_global_settings', []);
        $error_messages = get_option('n8n_chat_error_messages', []);

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
            update_option('n8n_chat_global_settings', $data['settings']);
        }

        if (isset($data['errorMessages'])) {
            update_option('n8n_chat_error_messages', $data['errorMessages']);
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
                'title' => __('Admin Page (Preview)', 'n8n-chat'),
                'type' => 'admin',
                'excerpt' => __('This is a preview of your system prompt.', 'n8n-chat'),
                'content' => __('This is a preview of your system prompt with all tags resolved.', 'n8n-chat'),
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
                "SELECT * FROM {$wpdb->prefix}n8n_chat_sessions
                WHERE {$where_clause}
                ORDER BY last_activity_at DESC
                LIMIT %d OFFSET %d",
                ...$params
            )
        );

        // Get total count
        $total = $wpdb->get_var(
            $wpdb->prepare(
                "SELECT COUNT(*) FROM {$wpdb->prefix}n8n_chat_sessions WHERE {$where_clause}",
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
            "SELECT * FROM {$wpdb->prefix}n8n_chat_fallback_messages
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

        // Get active theme
        $theme = wp_get_theme();

        // Get active plugins
        $active_plugins = get_option('active_plugins', []);
        $plugin_names = [];
        foreach ($active_plugins as $plugin) {
            $plugin_data = get_plugin_data(WP_PLUGIN_DIR . '/' . $plugin, false, false);
            $plugin_names[] = $plugin_data['Name'] ?? $plugin;
        }

        // Check required PHP extensions
        $required_extensions = ['curl', 'json', 'mbstring', 'openssl'];
        $php_extensions = [];
        foreach ($required_extensions as $ext) {
            $php_extensions[$ext] = extension_loaded($ext);
        }

        // Check database tables
        $tables = [
            'n8n_chat_sessions' => $wpdb->prefix . 'n8n_chat_sessions',
            'n8n_chat_messages' => $wpdb->prefix . 'n8n_chat_messages',
            'n8n_chat_fallback_messages' => $wpdb->prefix . 'n8n_chat_fallback_messages',
        ];

        $database_tables = [];
        foreach ($tables as $name => $table) {
            $exists = $wpdb->get_var($wpdb->prepare(
                "SHOW TABLES LIKE %s",
                $table
            )) === $table;

            $rows = 0;
            if ($exists) {
                $rows = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$table}");
            }

            $database_tables[$name] = [
                'exists' => $exists,
                'rows' => $rows,
            ];
        }

        // Get cURL version
        $curl_version = function_exists('curl_version') ? curl_version()['version'] : 'N/A';

        // Format response to match frontend expectations
        return new \WP_REST_Response([
            'php_version' => PHP_VERSION,
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => N8N_CHAT_VERSION,
            'active_theme' => $theme->get('Name') . ' ' . $theme->get('Version'),
            'active_plugins' => $plugin_names,
            'database_tables' => $database_tables,
            'php_extensions' => $php_extensions,
            'server_info' => $_SERVER['SERVER_SOFTWARE'] ?? 'Unknown',
            'memory_limit' => ini_get('memory_limit'),
            'max_execution_time' => ini_get('max_execution_time'),
            'curl_version' => $curl_version,
            'ssl_enabled' => is_ssl(),
        ]);
    }

    /**
     * Export data
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function export_data(\WP_REST_Request $request): \WP_REST_Response {
        $type = $request->get_param('type') ?? 'all';

        $export = [
            'version' => N8N_CHAT_VERSION,
            'exported_at' => current_time('c'),
            'site_url' => home_url(),
            'export_type' => $type,
        ];

        if ($type === 'all' || $type === 'instances') {
            $export['instances'] = array_values($this->instance_manager->get_all_instances());
        }

        if ($type === 'all' || $type === 'settings') {
            $export['settings'] = get_option('n8n_chat_global_settings', []);
            $export['error_messages'] = get_option('n8n_chat_error_messages', []);
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

        $instances_imported = 0;
        $settings_imported = false;

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
                $instances_imported++;
            }
        }

        // Import settings
        if (!empty($data['settings'])) {
            update_option('n8n_chat_global_settings', $data['settings']);
            $settings_imported = true;
        }

        if (!empty($data['error_messages'])) {
            update_option('n8n_chat_error_messages', $data['error_messages']);
        }

        return new \WP_REST_Response([
            'success' => true,
            'instances_imported' => $instances_imported,
            'settings_imported' => $settings_imported,
            'message' => sprintf(
                __('Successfully imported %d instance(s).', 'n8n-chat'),
                $instances_imported
            ),
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
                'message' => __('Order must be an array of instance IDs.', 'n8n-chat'),
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
        $sessions_table = $wpdb->prefix . 'n8n_chat_sessions';
        $messages_table = $wpdb->prefix . 'n8n_chat_messages';

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

        $sessions_table = $wpdb->prefix . 'n8n_chat_sessions';
        $messages_table = $wpdb->prefix . 'n8n_chat_messages';

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

    /**
     * Get style presets
     *
     * @return \WP_REST_Response
     */
    public function get_style_presets(): \WP_REST_Response {
        $presets_file = N8N_CHAT_PLUGIN_DIR . 'assets/style-presets.json';

        if (!file_exists($presets_file)) {
            return new \WP_REST_Response([
                'error' => 'file_not_found',
                'message' => __('Style presets file not found.', 'n8n-chat'),
            ], 404);
        }

        $presets_json = file_get_contents($presets_file);
        $presets = json_decode($presets_json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            return new \WP_REST_Response([
                'error' => 'invalid_json',
                'message' => __('Style presets file contains invalid JSON.', 'n8n-chat'),
            ], 500);
        }

        // Transform presets to match frontend expected format
        $transformed = [];
        foreach ($presets as $id => $preset) {
            $styles = $preset['styles'] ?? [];
            $borderRadius = isset($styles['borderRadius']) ? (int) preg_replace('/[^0-9]/', '', $styles['borderRadius']) : 12;

            $transformed[] = [
                'id' => $preset['id'] ?? $id,
                'name' => $preset['name'] ?? $id,
                'description' => $preset['description'] ?? '',
                'colors' => [
                    'primary' => $styles['primaryColor'] ?? '#3b82f6',
                    'userBubble' => $styles['userMessageBg'] ?? '#3b82f6',
                    'botBubble' => $styles['assistantMessageBg'] ?? '#f3f4f6',
                    'background' => $styles['backgroundColor'] ?? '#ffffff',
                    'text' => $styles['textColor'] ?? '#1f2937',
                    'header' => $styles['headerBg'] ?? '#ffffff',
                ],
                'borderRadius' => $borderRadius,
                'fontFamily' => $styles['fontFamily'] ?? 'system-ui, sans-serif',
            ];
        }

        return new \WP_REST_Response($transformed);
    }
}
