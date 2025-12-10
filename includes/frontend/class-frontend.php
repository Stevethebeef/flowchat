<?php
/**
 * Frontend Handler
 *
 * Main frontend controller for FlowChat.
 *
 * @package FlowChat
 */

namespace FlowChat\Frontend;

use FlowChat\Core\Instance_Manager;

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
        $this->instance_manager = new Instance_Manager();

        add_action('wp_footer', [$this, 'render_bubble_instances']);
        add_action('wp_head', [$this, 'output_custom_css']);
    }

    /**
     * Render bubble instances that match URL targeting
     */
    public function render_bubble_instances(): void {
        // Get current URL
        $current_url = home_url(add_query_arg(null, null));

        // Find instances with URL-based targeting that match current page
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

    /**
     * Render bubble container for an instance
     *
     * @param array $instance Instance configuration
     */
    private function render_bubble_container(array $instance): void {
        $container_id = 'flowchat-bubble-' . esc_attr($instance['id']);

        // Enqueue assets
        wp_enqueue_script('flowchat-frontend');
        wp_enqueue_style('flowchat-frontend');

        // Pass config to JS
        $js_var_name = 'flowchatBubble_' . str_replace('-', '_', $instance['id']);
        wp_localize_script('flowchat-frontend', $js_var_name, [
            'containerId' => $container_id,
            'instanceId' => $instance['id'],
            'mode' => 'bubble',
            'apiUrl' => rest_url('flowchat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // Output container
        printf(
            '<div id="%s" class="flowchat-bubble-container"></div>',
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
        $settings = get_option('flowchat_global_settings', []);

        if (!empty($settings['custom_css'])) {
            printf(
                '<style id="flowchat-custom-css">%s</style>',
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

        $error_messages = get_option('flowchat_error_messages', []);

        if (!is_user_logged_in() && !empty($access['requireLogin'])) {
            return $error_messages['access_denied'] ?? __('Please log in to use this chat.', 'flowchat');
        }

        return $error_messages['access_denied'] ?? __('You do not have permission to access this chat.', 'flowchat');
    }
}
