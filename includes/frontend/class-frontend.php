<?php
/**
 * Frontend Handler
 *
 * Main frontend controller for n8n Chat.
 *
 * @package N8nChat
 */

namespace N8nChat\Frontend;

use N8nChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Frontend
 */
class Frontend {

    /**
     * Instance manager
     *
     * @var Instance_Manager
     */
    private Instance_Manager $instance_manager;

    /**
     * Constructor
     */
    public function __construct() {
        $this->instance_manager = Instance_Manager::get_instance();

        add_action('wp_footer', [$this, 'render_bubble_instances']);
        add_action('wp_head', [$this, 'output_custom_css']);
    }

    /**
     * Render bubble instances - either site-wide or with URL targeting
     */
    public function render_bubble_instances(): void {
        $rendered = false;

        // First, check for instances with "showOnAllPages" enabled (site-wide bubble)
        $all_instances = $this->instance_manager->get_all_instances();

        foreach ($all_instances as $instance) {
            // Skip disabled instances
            if (empty($instance['isEnabled'])) {
                continue;
            }

            // Check for site-wide bubble mode
            if (!empty($instance['bubble']['enabled']) && !empty($instance['bubble']['showOnAllPages'])) {
                // Check access permissions
                if (!$this->check_access($instance)) {
                    continue;
                }

                // Render the bubble container
                $this->render_bubble_container($instance);
                $rendered = true;

                // Only render one bubble per page
                break;
            }
        }

        // If no site-wide bubble, check URL-targeted bubbles
        if (!$rendered) {
            $current_url = home_url(add_query_arg(null, null));
            $matching_instances = $this->instance_manager->get_instances_for_url($current_url);

            foreach ($matching_instances as $instance) {
                // Only render if bubble mode is enabled
                if (empty($instance['bubble']['enabled'])) {
                    continue;
                }

                // Check access permissions
                if (!$this->check_access($instance)) {
                    continue;
                }

                // Render the bubble container
                $this->render_bubble_container($instance);

                // Only render one bubble per page (highest priority wins)
                break;
            }
        }
    }

    /**
     * Render bubble container for an instance
     *
     * @param array $instance Instance configuration
     */
    private function render_bubble_container(array $instance): void {
        $container_id = 'n8n-chat-bubble-' . esc_attr($instance['id']);

        // Enqueue assets
        wp_enqueue_script('n8n-chat-frontend');
        wp_enqueue_style('n8n-chat-frontend');

        // Pass config to JS
        $js_var_name = 'n8nChatBubble_' . str_replace('-', '_', $instance['id']);
        wp_localize_script('n8n-chat-frontend', $js_var_name, [
            'containerId' => $container_id,
            'instanceId' => $instance['id'],
            'mode' => 'bubble',
            'apiUrl' => rest_url('n8n-chat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // Output container
        printf(
            '<div id="%s" class="n8n-chat-bubble-container"></div>',
            esc_attr($container_id)
        );
    }

    /**
     * Check if current user has access to an instance
     *
     * @param array $instance Instance configuration
     * @return bool
     */
    public function check_access(array $instance): bool {
        // Check if instance is enabled
        if (empty($instance['isEnabled'])) {
            return false;
        }

        $access = $instance['access'] ?? [];

        // Check login requirement
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return false;
        }

        // Check role restriction
        if (!empty($access['allowedRoles']) && is_user_logged_in()) {
            $user = wp_get_current_user();
            if (!array_intersect($access['allowedRoles'], $user->roles)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Output custom CSS from global settings
     */
    public function output_custom_css(): void {
        $settings = get_option('n8n_chat_global_settings', []);

        if (!empty($settings['custom_css'])) {
            printf(
                '<style id="n8n-chat-custom-css">%s</style>',
                wp_strip_all_tags($settings['custom_css'])
            );
        }
    }

    /**
     * Get access denied message for an instance
     *
     * @param array $instance Instance configuration
     * @return string
     */
    public function get_access_denied_message(array $instance): string {
        $access = $instance['access'] ?? [];

        if (!empty($access['deniedMessage'])) {
            return $access['deniedMessage'];
        }

        $error_messages = get_option('n8n_chat_error_messages', []);

        if (!is_user_logged_in() && !empty($access['requireLogin'])) {
            return $error_messages['access_denied'] ?? __('Please log in to use this chat.', 'n8n-chat');
        }

        return $error_messages['access_denied'] ?? __('You do not have permission to access this chat.', 'n8n-chat');
    }
}
