<?php
/**
 * Public REST API Endpoints
 *
 * Handles public-facing API endpoints for chat initialization and interactions.
 *
 * @package FlowChat
 */

namespace FlowChat\API;

use FlowChat\Core\Instance_Manager;
use FlowChat\Core\Session_Manager;
use FlowChat\Core\Context_Builder;
use FlowChat\Core\File_Handler;
use FlowChat\Frontend\Frontend;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Public_Endpoints
 */
class Public_Endpoints {

    /**
     * API namespace
     */
    private const NAMESPACE = 'flowchat/v1';

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
     * Context builder
     *
     * @var Context_Builder
     */
    private Context_Builder $context_builder;

    /**
     * Constructor
     */
    public function __construct() {
        $this->instance_manager = new Instance_Manager();
        $this->session_manager = new Session_Manager();
        $this->context_builder = new Context_Builder();

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void {
        // Initialize chat session
        register_rest_route(self::NAMESPACE, '/init', [
            'methods' => 'GET',
            'callback' => [$this, 'init_chat'],
            'permission_callback' => '__return_true',
            'args' => [
                'instance_id' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'session_id' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        // Upload file
        register_rest_route(self::NAMESPACE, '/upload', [
            'methods' => 'POST',
            'callback' => [$this, 'upload_file'],
            'permission_callback' => '__return_true',
            'args' => [
                'instance_id' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        // Save chat history
        register_rest_route(self::NAMESPACE, '/history', [
            'methods' => 'POST',
            'callback' => [$this, 'save_history'],
            'permission_callback' => '__return_true',
            'args' => [
                'session_id' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'messages' => [
                    'required' => true,
                    'type' => 'array',
                ],
            ],
        ]);

        // Get chat history
        register_rest_route(self::NAMESPACE, '/history/(?P<session_id>[a-zA-Z0-9-]+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_history'],
            'permission_callback' => '__return_true',
            'args' => [
                'session_id' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);

        // Submit fallback message
        register_rest_route(self::NAMESPACE, '/fallback', [
            'methods' => 'POST',
            'callback' => [$this, 'submit_fallback'],
            'permission_callback' => '__return_true',
            'args' => [
                'instance_id' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'name' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'email' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                ],
                'message' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_textarea_field',
                ],
            ],
        ]);

        // Get page configuration (per 07-api-endpoints.md spec)
        register_rest_route(self::NAMESPACE, '/config', [
            'methods' => 'GET',
            'callback' => [$this, 'get_page_config'],
            'permission_callback' => '__return_true',
            'args' => [
                'page_id' => [
                    'required' => false,
                    'type' => 'integer',
                    'sanitize_callback' => 'absint',
                ],
                'url' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'esc_url_raw',
                ],
                'instance' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * Initialize chat session
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function init_chat(\WP_REST_Request $request): \WP_REST_Response {
        $instance_id = $request->get_param('instance_id');
        $existing_session_id = $request->get_param('session_id');

        // Get instance
        $instance = $this->instance_manager->get_instance($instance_id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'instance_not_found',
                'message' => __('Chat instance not found.', 'flowchat'),
            ], 404);
        }

        // Check if enabled
        if (empty($instance['isEnabled'])) {
            return new \WP_REST_Response([
                'error' => 'instance_disabled',
                'message' => __('This chat is currently unavailable.', 'flowchat'),
            ], 403);
        }

        // Check access
        $frontend = new Frontend();
        if (!$frontend->check_access($instance)) {
            return new \WP_REST_Response([
                'error' => 'access_denied',
                'message' => $frontend->get_access_denied_message($instance),
            ], 403);
        }

        // Get or create session
        $session_id = $this->session_manager->get_or_create_session($instance_id, $existing_session_id);

        // Build context
        $context = $this->context_builder->build_context($instance);

        // Get existing messages if history is enabled
        $messages = [];
        if (!empty($instance['features']['enableHistory']) && $existing_session_id) {
            $messages = $this->session_manager->get_messages($session_id);
        }

        // Return config (webhook URL is the key secret!)
        return new \WP_REST_Response([
            'webhookUrl' => $instance['webhookUrl'],
            'sessionId' => $session_id,
            'config' => $this->get_frontend_config($instance),
            'context' => $context,
            'messages' => $messages,
        ]);
    }

    /**
     * Get frontend-safe configuration
     *
     * @param array $instance Full instance configuration
     * @return array Frontend configuration (without sensitive data)
     */
    private function get_frontend_config(array $instance): array {
        return [
            'instanceId' => $instance['id'],
            'name' => $instance['name'],
            'theme' => $instance['theme'],
            'primaryColor' => $instance['primaryColor'],
            'welcomeMessage' => $instance['welcomeMessage'],
            'placeholderText' => $instance['placeholderText'],
            'chatTitle' => $instance['chatTitle'],
            'suggestedPrompts' => $instance['suggestedPrompts'] ?? [],
            'showHeader' => $instance['showHeader'],
            'showTimestamp' => $instance['showTimestamp'],
            'showAvatar' => $instance['showAvatar'],
            'avatarUrl' => $instance['avatarUrl'] ?? '',
            'bubble' => $instance['bubble'],
            'autoOpen' => $instance['autoOpen'],
            'features' => [
                'fileUpload' => $instance['features']['fileUpload'] ?? false,
                'fileTypes' => $instance['features']['fileTypes'] ?? [],
                'maxFileSize' => $instance['features']['maxFileSize'] ?? 10485760,
                'showTypingIndicator' => $instance['features']['showTypingIndicator'] ?? true,
                'enableFeedback' => $instance['features']['enableFeedback'] ?? false,
            ],
            'fallback' => [
                'enabled' => $instance['fallback']['enabled'] ?? false,
                'message' => $instance['fallback']['message'] ?? '',
            ],
        ];
    }

    /**
     * Handle file upload
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function upload_file(\WP_REST_Request $request): \WP_REST_Response {
        $instance_id = $request->get_param('instance_id');
        $files = $request->get_file_params();

        if (empty($files['file'])) {
            return new \WP_REST_Response([
                'error' => 'no_file',
                'message' => __('No file was uploaded.', 'flowchat'),
            ], 400);
        }

        // Check instance access
        $instance = $this->instance_manager->get_instance($instance_id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'instance_not_found',
                'message' => __('Chat instance not found.', 'flowchat'),
            ], 404);
        }

        $frontend = new Frontend();
        if (!$frontend->check_access($instance)) {
            return new \WP_REST_Response([
                'error' => 'access_denied',
                'message' => __('Access denied.', 'flowchat'),
            ], 403);
        }

        // Handle upload
        $file_handler = new File_Handler();
        $result = $file_handler->handle_upload($files['file'], $instance_id);

        if (is_wp_error($result)) {
            return new \WP_REST_Response([
                'error' => $result->get_error_code(),
                'message' => $result->get_error_message(),
            ], 400);
        }

        return new \WP_REST_Response($result);
    }

    /**
     * Save chat history
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function save_history(\WP_REST_Request $request): \WP_REST_Response {
        $session_id = $request->get_param('session_id');
        $messages = $request->get_param('messages');

        // Validate session exists
        $session = $this->session_manager->get_session_by_uuid($session_id);

        if (!$session) {
            return new \WP_REST_Response([
                'error' => 'session_not_found',
                'message' => __('Session not found.', 'flowchat'),
            ], 404);
        }

        // Check if instance has history enabled
        $instance = $this->instance_manager->get_instance($session->instance_id);

        if (!$instance || empty($instance['features']['enableHistory'])) {
            return new \WP_REST_Response([
                'error' => 'history_disabled',
                'message' => __('History is not enabled for this chat.', 'flowchat'),
            ], 400);
        }

        // Save messages
        $saved_count = 0;
        foreach ($messages as $message) {
            if (empty($message['role']) || empty($message['content'])) {
                continue;
            }

            $content = is_array($message['content']) ? $message['content'] : [
                'parts' => [['type' => 'text', 'text' => $message['content']]],
            ];

            $result = $this->session_manager->save_message(
                $session_id,
                sanitize_text_field($message['role']),
                $content,
                $message['metadata'] ?? []
            );

            if ($result) {
                $saved_count++;
            }
        }

        return new \WP_REST_Response([
            'success' => true,
            'saved' => $saved_count,
        ]);
    }

    /**
     * Get chat history
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_history(\WP_REST_Request $request): \WP_REST_Response {
        $session_id = $request->get_param('session_id');

        // Validate session
        $session = $this->session_manager->get_session_by_uuid($session_id);

        if (!$session) {
            return new \WP_REST_Response([
                'error' => 'session_not_found',
                'message' => __('Session not found.', 'flowchat'),
            ], 404);
        }

        // Check instance access
        $instance = $this->instance_manager->get_instance($session->instance_id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'instance_not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        $frontend = new Frontend();
        if (!$frontend->check_access($instance)) {
            return new \WP_REST_Response([
                'error' => 'access_denied',
                'message' => __('Access denied.', 'flowchat'),
            ], 403);
        }

        // Get messages
        $messages = $this->session_manager->get_messages($session_id);

        return new \WP_REST_Response([
            'messages' => $messages,
            'session' => [
                'uuid' => $session->uuid,
                'status' => $session->status,
                'started_at' => $session->started_at,
                'last_activity_at' => $session->last_activity_at,
            ],
        ]);
    }

    /**
     * Submit fallback message (when n8n is down)
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function submit_fallback(\WP_REST_Request $request): \WP_REST_Response {
        global $wpdb;

        $instance_id = $request->get_param('instance_id');
        $name = $request->get_param('name');
        $email = $request->get_param('email');
        $message = $request->get_param('message');

        // Validate instance
        $instance = $this->instance_manager->get_instance($instance_id);

        if (!$instance) {
            return new \WP_REST_Response([
                'error' => 'instance_not_found',
                'message' => __('Instance not found.', 'flowchat'),
            ], 404);
        }

        // Check if fallback is enabled
        if (empty($instance['fallback']['enabled'])) {
            return new \WP_REST_Response([
                'error' => 'fallback_disabled',
                'message' => __('Fallback messages are not enabled.', 'flowchat'),
            ], 400);
        }

        // Validate email
        if (!is_email($email)) {
            return new \WP_REST_Response([
                'error' => 'invalid_email',
                'message' => __('Please provide a valid email address.', 'flowchat'),
            ], 400);
        }

        // Rate limiting (simple implementation)
        $transient_key = 'flowchat_fallback_' . md5($email . $_SERVER['REMOTE_ADDR']);
        if (get_transient($transient_key)) {
            return new \WP_REST_Response([
                'error' => 'rate_limited',
                'message' => __('Please wait before submitting another message.', 'flowchat'),
            ], 429);
        }

        // Save fallback message
        $result = $wpdb->insert(
            $wpdb->prefix . 'flowchat_fallback_messages',
            [
                'instance_id' => $instance_id,
                'name' => $name,
                'email' => $email,
                'message' => $message,
                'status' => 'pending',
                'created_at' => current_time('mysql'),
            ],
            ['%s', '%s', '%s', '%s', '%s', '%s']
        );

        if (!$result) {
            return new \WP_REST_Response([
                'error' => 'save_failed',
                'message' => __('Failed to save your message. Please try again.', 'flowchat'),
            ], 500);
        }

        // Set rate limit (1 message per minute)
        set_transient($transient_key, true, 60);

        // Send email notification
        $this->send_fallback_notification($instance, $name, $email, $message);

        return new \WP_REST_Response([
            'success' => true,
            'message' => __('Your message has been received. We will get back to you soon.', 'flowchat'),
        ]);
    }

    /**
     * Send fallback notification email
     *
     * @param array $instance Instance configuration
     * @param string $name Sender name
     * @param string $email Sender email
     * @param string $message Message content
     */
    private function send_fallback_notification(array $instance, string $name, string $email, string $message): void {
        $to = $instance['fallback']['email'] ?: get_option('admin_email');

        $subject = sprintf(
            /* translators: 1: Site name, 2: Instance name */
            __('[%1$s] New FlowChat Message - %2$s', 'flowchat'),
            get_bloginfo('name'),
            $instance['name']
        );

        $body = sprintf(
            /* translators: 1: Sender name, 2: Sender email, 3: Message content */
            __("New message received:\n\nFrom: %1\$s <%2\$s>\n\nMessage:\n%3\$s", 'flowchat'),
            $name,
            $email,
            $message
        );

        $headers = [
            'Content-Type: text/plain; charset=UTF-8',
            sprintf('Reply-To: %s <%s>', $name, $email),
        ];

        wp_mail($to, $subject, $body, $headers);
    }

    /**
     * Get page configuration
     *
     * Returns all applicable instances for the current page context.
     * Per 07-api-endpoints.md spec section 6.
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_page_config(\WP_REST_Request $request): \WP_REST_Response {
        $page_id = $request->get_param('page_id');
        $url = $request->get_param('url');
        $specific_instance = $request->get_param('instance');

        // Get all active instances
        $all_instances = $this->instance_manager->get_all_instances();
        $applicable = [];
        $frontend = new Frontend();

        foreach ($all_instances as $instance) {
            // Skip inactive instances
            if (empty($instance['isEnabled'])) {
                continue;
            }

            // Check page visibility rules
            if (!$this->is_instance_visible($instance, $page_id, $url)) {
                continue;
            }

            // Check access rules
            if (!$frontend->check_access($instance)) {
                continue;
            }

            // If specific instance requested, filter
            if ($specific_instance && $instance['id'] !== $specific_instance) {
                continue;
            }

            // Prepare config for frontend (remove sensitive data)
            $applicable[$instance['id']] = $this->get_frontend_config($instance);
        }

        // Build WordPress context
        $wp_context = [
            'user' => $this->get_user_context(),
            'page' => $this->get_page_context($page_id, $url),
            'site' => $this->get_site_context(),
        ];

        // Get license/premium features
        $premium = $this->get_premium_features();

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'instances' => $applicable,
                'wpContext' => $wp_context,
                'apiEndpoints' => [
                    'base' => rest_url('flowchat/v1'),
                    'nonce' => wp_create_nonce('wp_rest'),
                ],
                'premium' => $premium,
            ],
        ]);
    }

    /**
     * Check if instance should be visible on page
     *
     * @param array $instance Instance configuration
     * @param int|null $page_id Page ID
     * @param string|null $url Page URL
     * @return bool
     */
    private function is_instance_visible(array $instance, ?int $page_id, ?string $url): bool {
        $rules = $instance['targeting'] ?? [];

        // No targeting rules = show everywhere
        if (empty($rules) || empty($rules['enabled'])) {
            return true;
        }

        $targeting_rules = $rules['rules'] ?? [];
        if (empty($targeting_rules)) {
            return true;
        }

        // Check each rule
        foreach ($targeting_rules as $rule) {
            $rule_type = $rule['type'] ?? '';
            $rule_value = $rule['value'] ?? '';
            $condition = $rule['condition'] ?? 'equals';

            switch ($rule_type) {
                case 'page_id':
                    if ($page_id && $this->matches_condition((string)$page_id, $rule_value, $condition)) {
                        return true;
                    }
                    break;

                case 'url_pattern':
                    if ($url && $this->matches_condition($url, $rule_value, $condition)) {
                        return true;
                    }
                    break;

                case 'post_type':
                    if ($page_id) {
                        $post_type = get_post_type($page_id);
                        if ($post_type && $this->matches_condition($post_type, $rule_value, $condition)) {
                            return true;
                        }
                    }
                    break;

                case 'category':
                    if ($page_id) {
                        $categories = wp_get_post_categories($page_id, ['fields' => 'slugs']);
                        $rule_values = is_array($rule_value) ? $rule_value : [$rule_value];
                        if (array_intersect($categories, $rule_values)) {
                            return true;
                        }
                    }
                    break;

                case 'user_role':
                    if (is_user_logged_in()) {
                        $user = wp_get_current_user();
                        $rule_values = is_array($rule_value) ? $rule_value : [$rule_value];
                        if (array_intersect($user->roles, $rule_values)) {
                            return true;
                        }
                    } elseif ($rule_value === 'guest' || (is_array($rule_value) && in_array('guest', $rule_value))) {
                        return true;
                    }
                    break;
            }
        }

        // No rules matched
        return false;
    }

    /**
     * Check if value matches condition
     *
     * @param string $value Value to check
     * @param string|array $pattern Pattern to match
     * @param string $condition Condition type
     * @return bool
     */
    private function matches_condition(string $value, $pattern, string $condition): bool {
        $patterns = is_array($pattern) ? $pattern : [$pattern];

        foreach ($patterns as $p) {
            switch ($condition) {
                case 'equals':
                    if ($value === $p) return true;
                    break;

                case 'starts_with':
                    if (str_starts_with($value, $p)) return true;
                    break;

                case 'ends_with':
                    if (str_ends_with($value, $p)) return true;
                    break;

                case 'contains':
                    if (str_contains($value, $p)) return true;
                    break;

                case 'wildcard':
                    $regex = '/^' . str_replace(['*', '?'], ['.*', '.'], preg_quote($p, '/')) . '$/';
                    if (preg_match($regex, $value)) return true;
                    break;

                case 'regex':
                    if (@preg_match($p, $value)) return true;
                    break;
            }
        }

        return false;
    }

    /**
     * Get user context for frontend
     *
     * @return array
     */
    private function get_user_context(): array {
        if (!is_user_logged_in()) {
            return [
                'isLoggedIn' => false,
                'id' => null,
                'email' => '',
                'displayName' => 'Guest',
                'roles' => ['guest'],
            ];
        }

        $user = wp_get_current_user();
        return [
            'isLoggedIn' => true,
            'id' => $user->ID,
            'email' => $user->user_email,
            'displayName' => $user->display_name,
            'roles' => $user->roles,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
        ];
    }

    /**
     * Get page context for frontend
     *
     * @param int|null $page_id Page ID
     * @param string|null $url Page URL
     * @return array
     */
    private function get_page_context(?int $page_id, ?string $url): array {
        $context = [
            'id' => $page_id,
            'url' => $url ?: '',
            'title' => '',
            'postType' => '',
            'excerpt' => '',
        ];

        if ($page_id) {
            $post = get_post($page_id);
            if ($post) {
                $context['title'] = get_the_title($post);
                $context['postType'] = $post->post_type;
                $context['excerpt'] = wp_trim_words($post->post_excerpt ?: $post->post_content, 50, '...');
                $context['slug'] = $post->post_name;
            }
        }

        return $context;
    }

    /**
     * Get site context for frontend
     *
     * @return array
     */
    private function get_site_context(): array {
        return [
            'name' => get_bloginfo('name'),
            'url' => home_url(),
            'description' => get_bloginfo('description'),
            'language' => get_locale(),
            'timezone' => wp_timezone_string(),
        ];
    }

    /**
     * Get premium features status
     *
     * @return array
     */
    private function get_premium_features(): array {
        // Check for premium license
        $is_premium = apply_filters('flowchat_is_premium', false);

        $features = [];
        if ($is_premium) {
            $features = ['history', 'analytics', 'multi_instance', 'custom_templates'];
        }

        return [
            'enabled' => $is_premium,
            'features' => $features,
        ];
    }
}
