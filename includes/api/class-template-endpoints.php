<?php
/**
 * Template API Endpoints for n8n Chat
 *
 * REST API endpoints for templates and style presets.
 *
 * @package N8nChat
 */

namespace N8nChat\API;

use N8nChat\Core\Template_Manager;

defined('ABSPATH') || exit;

/**
 * Template Endpoints class
 */
class Template_Endpoints {

    /**
     * REST namespace
     */
    const NAMESPACE = 'n8n-chat/v1';

    /**
     * Template Manager instance
     */
    private Template_Manager $template_manager;

    /**
     * Constructor
     */
    public function __construct() {
        $this->template_manager = Template_Manager::get_instance();
    }

    /**
     * Register REST routes
     */
    public function register_routes(): void {
        // Get all templates
        register_rest_route(self::NAMESPACE, '/templates', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_templates'],
                'permission_callback' => [$this, 'admin_permission_check'],
            ],
        ]);

        // Get single template
        register_rest_route(self::NAMESPACE, '/templates/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ],
        ]);

        // Get templates by category
        register_rest_route(self::NAMESPACE, '/templates/category/(?P<category>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_templates_by_category'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'category' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ],
        ]);

        // Create custom template
        register_rest_route(self::NAMESPACE, '/templates', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'create_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => $this->get_template_args(),
            ],
        ]);

        // Update custom template
        register_rest_route(self::NAMESPACE, '/templates/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::EDITABLE,
                'callback' => [$this, 'update_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => array_merge(
                    ['id' => ['required' => true, 'type' => 'string']],
                    $this->get_template_args()
                ),
            ],
        ]);

        // Delete custom template
        register_rest_route(self::NAMESPACE, '/templates/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::DELETABLE,
                'callback' => [$this, 'delete_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ],
        ]);

        // Export template
        register_rest_route(self::NAMESPACE, '/templates/(?P<id>[a-zA-Z0-9_-]+)/export', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'export_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ],
        ]);

        // Import template
        register_rest_route(self::NAMESPACE, '/templates/import', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'import_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'json' => [
                        'required' => true,
                        'type' => 'string',
                    ],
                ],
            ],
        ]);

        // Get categories
        register_rest_route(self::NAMESPACE, '/templates/categories', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_categories'],
                'permission_callback' => [$this, 'admin_permission_check'],
            ],
        ]);

        // Style presets
        register_rest_route(self::NAMESPACE, '/style-presets', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_style_presets'],
                'permission_callback' => [$this, 'admin_permission_check'],
            ],
        ]);

        // Get single style preset
        register_rest_route(self::NAMESPACE, '/style-presets/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => \WP_REST_Server::READABLE,
                'callback' => [$this, 'get_style_preset'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                ],
            ],
        ]);

        // Apply template to new instance
        register_rest_route(self::NAMESPACE, '/templates/(?P<id>[a-zA-Z0-9_-]+)/apply', [
            [
                'methods' => \WP_REST_Server::CREATABLE,
                'callback' => [$this, 'apply_template'],
                'permission_callback' => [$this, 'admin_permission_check'],
                'args' => [
                    'id' => [
                        'required' => true,
                        'type' => 'string',
                        'sanitize_callback' => 'sanitize_key',
                    ],
                    'overrides' => [
                        'required' => false,
                        'type' => 'object',
                        'default' => [],
                    ],
                ],
            ],
        ]);
    }

    /**
     * Permission check for admin endpoints
     *
     * @return bool|\WP_Error
     */
    public function admin_permission_check() {
        if (!current_user_can('manage_options')) {
            return new \WP_Error(
                'rest_forbidden',
                __('You do not have permission to access this resource.', 'n8n-chat'),
                ['status' => 403]
            );
        }
        return true;
    }

    /**
     * Get template arguments schema
     *
     * @return array
     */
    private function get_template_args(): array {
        return [
            'name' => [
                'required' => true,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_text_field',
            ],
            'description' => [
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_textarea_field',
                'default' => '',
            ],
            'category' => [
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_key',
                'default' => 'custom',
            ],
            'icon' => [
                'required' => false,
                'type' => 'string',
                'sanitize_callback' => 'sanitize_key',
                'default' => 'file',
            ],
            'config' => [
                'required' => true,
                'type' => 'object',
            ],
        ];
    }

    /**
     * Get all templates
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_templates(\WP_REST_Request $request): \WP_REST_Response {
        $templates = $this->template_manager->get_all_templates();

        return new \WP_REST_Response([
            'success' => true,
            'templates' => array_values($templates),
        ]);
    }

    /**
     * Get single template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_template(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $template = $this->template_manager->get_template($id);

        if (!$template) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => [
                    'code' => 'template_not_found',
                    'message' => __('Template not found.', 'n8n-chat'),
                ],
            ], 404);
        }

        return new \WP_REST_Response([
            'success' => true,
            'template' => $template,
        ]);
    }

    /**
     * Get templates by category
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_templates_by_category(\WP_REST_Request $request): \WP_REST_Response {
        $category = $request->get_param('category');
        $templates = $this->template_manager->get_templates_by_category($category);

        return new \WP_REST_Response([
            'success' => true,
            'category' => $category,
            'templates' => array_values($templates),
        ]);
    }

    /**
     * Create custom template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function create_template(\WP_REST_Request $request): \WP_REST_Response {
        $template = [
            'name' => $request->get_param('name'),
            'description' => $request->get_param('description'),
            'category' => $request->get_param('category') ?: 'custom',
            'icon' => $request->get_param('icon') ?: 'file',
            'config' => $request->get_param('config'),
            'custom' => true,
            'created_at' => current_time('mysql'),
        ];

        if ($this->template_manager->save_custom_template($template)) {
            return new \WP_REST_Response([
                'success' => true,
                'template' => $template,
            ], 201);
        }

        return new \WP_REST_Response([
            'success' => false,
            'error' => [
                'code' => 'create_failed',
                'message' => __('Failed to create template.', 'n8n-chat'),
            ],
        ], 500);
    }

    /**
     * Update custom template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function update_template(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');

        // Check if it's a custom template
        $custom_templates = get_option('n8n_chat_custom_templates', []);
        if (!isset($custom_templates[$id])) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => [
                    'code' => 'not_editable',
                    'message' => __('Built-in templates cannot be edited.', 'n8n-chat'),
                ],
            ], 400);
        }

        $template = $custom_templates[$id];
        $template['name'] = $request->get_param('name') ?: $template['name'];
        $template['description'] = $request->get_param('description') ?? $template['description'];
        $template['category'] = $request->get_param('category') ?: $template['category'];
        $template['icon'] = $request->get_param('icon') ?: $template['icon'];
        $template['config'] = $request->get_param('config') ?: $template['config'];
        $template['updated_at'] = current_time('mysql');

        if ($this->template_manager->save_custom_template($template)) {
            return new \WP_REST_Response([
                'success' => true,
                'template' => $template,
            ]);
        }

        return new \WP_REST_Response([
            'success' => false,
            'error' => [
                'code' => 'update_failed',
                'message' => __('Failed to update template.', 'n8n-chat'),
            ],
        ], 500);
    }

    /**
     * Delete custom template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function delete_template(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');

        if ($this->template_manager->delete_custom_template($id)) {
            return new \WP_REST_Response([
                'success' => true,
            ]);
        }

        return new \WP_REST_Response([
            'success' => false,
            'error' => [
                'code' => 'delete_failed',
                'message' => __('Failed to delete template or template not found.', 'n8n-chat'),
            ],
        ], 400);
    }

    /**
     * Export template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function export_template(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $json = $this->template_manager->export_template($id);

        if ($json === null) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => [
                    'code' => 'template_not_found',
                    'message' => __('Template not found.', 'n8n-chat'),
                ],
            ], 404);
        }

        return new \WP_REST_Response([
            'success' => true,
            'json' => $json,
            'filename' => 'n8n-chat-template-' . sanitize_file_name($id) . '.json',
        ]);
    }

    /**
     * Import template
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function import_template(\WP_REST_Request $request): \WP_REST_Response {
        $json = $request->get_param('json');
        $template = $this->template_manager->import_template($json);

        if ($template === null) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => [
                    'code' => 'import_failed',
                    'message' => __('Failed to import template. Invalid format.', 'n8n-chat'),
                ],
            ], 400);
        }

        return new \WP_REST_Response([
            'success' => true,
            'template' => $template,
        ], 201);
    }

    /**
     * Get categories
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_categories(\WP_REST_Request $request): \WP_REST_Response {
        $categories = $this->template_manager->get_categories();

        return new \WP_REST_Response([
            'success' => true,
            'categories' => $categories,
        ]);
    }

    /**
     * Get style presets
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_style_presets(\WP_REST_Request $request): \WP_REST_Response {
        $presets = $this->template_manager->get_style_presets();

        return new \WP_REST_Response([
            'success' => true,
            'presets' => array_values($presets),
        ]);
    }

    /**
     * Get single style preset
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_style_preset(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $preset = $this->template_manager->get_style_preset($id);

        if (!$preset) {
            return new \WP_REST_Response([
                'success' => false,
                'error' => [
                    'code' => 'preset_not_found',
                    'message' => __('Style preset not found.', 'n8n-chat'),
                ],
            ], 404);
        }

        return new \WP_REST_Response([
            'success' => true,
            'preset' => $preset,
        ]);
    }

    /**
     * Apply template (get config for new instance)
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function apply_template(\WP_REST_Request $request): \WP_REST_Response {
        $id = $request->get_param('id');
        $overrides = $request->get_param('overrides') ?: [];

        $config = $this->template_manager->apply_template($id, $overrides);

        return new \WP_REST_Response([
            'success' => true,
            'config' => $config,
        ]);
    }
}
