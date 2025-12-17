<?php
/**
 * Shortcode Handler
 *
 * Handles the [n8n_chat] shortcode for embedding chat widgets.
 *
 * @package N8nChat
 */

namespace N8nChat\Frontend;

use N8nChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Shortcode
 */
class Shortcode {

    /**
     * Instance manager
     *
     * @var Instance_Manager
     */
    private Instance_Manager $instance_manager;

    /**
     * Frontend handler
     *
     * @var Frontend
     */
    private Frontend $frontend;

    /**
     * Track rendered instances to prevent duplicates
     *
     * @var array
     */
    private array $rendered_instances = [];

    /**
     * Constructor
     */
    public function __construct() {
        $this->instance_manager = Instance_Manager::get_instance();
        $this->frontend = new Frontend();

        add_shortcode('n8n_chat', [$this, 'render']);
    }

    /**
     * Render the shortcode
     *
     * @param array|string $atts Shortcode attributes
     * @return string HTML output
     */
    public function render($atts): string {
        $atts = shortcode_atts([
            'id' => '',
            'mode' => 'inline',         // inline, bubble, both
            'width' => '100%',
            'height' => '500px',
            'theme' => '',              // Override instance theme
            'welcome' => '',            // Override welcome message
            'placeholder' => '',        // Override placeholder text
            'require-login' => '',      // Override login requirement
            'class' => '',              // Additional CSS classes
        ], $atts, 'n8n-chat');

        // Get instance
        $instance = $this->get_instance($atts['id']);

        if (!$instance) {
            return $this->render_error(__('n8n Chat: No chat instance configured.', 'n8n-chat'));
        }

        // Check access
        if (!$this->frontend->check_access($instance)) {
            // Check if we should show login requirement message
            $access = $instance['access'] ?? [];
            if (!empty($access['requireLogin']) && !is_user_logged_in()) {
                return $this->render_login_required($instance);
            }
            return ''; // Silently fail for role restrictions
        }

        // Apply attribute overrides
        $instance = $this->apply_overrides($instance, $atts);

        // Render based on mode
        switch ($atts['mode']) {
            case 'bubble':
                return $this->render_bubble($instance, $atts);

            case 'both':
                return $this->render_inline($instance, $atts) . $this->render_bubble($instance, $atts);

            case 'inline':
            default:
                return $this->render_inline($instance, $atts);
        }
    }

    /**
     * Get instance by ID or default
     *
     * @param string $id Instance ID
     * @return array|null
     */
    private function get_instance(string $id): ?array {
        if (!empty($id)) {
            return $this->instance_manager->get($id);
        }

        return $this->instance_manager->get_default_instance();
    }

    /**
     * Apply shortcode attribute overrides to instance
     *
     * @param array $instance Instance configuration
     * @param array $atts Shortcode attributes
     * @return array Modified instance
     */
    private function apply_overrides(array $instance, array $atts): array {
        if (!empty($atts['theme'])) {
            $instance['theme'] = sanitize_text_field($atts['theme']);
        }

        if (!empty($atts['welcome'])) {
            $instance['welcomeMessage'] = sanitize_textarea_field($atts['welcome']);
        }

        if (!empty($atts['placeholder'])) {
            $instance['placeholderText'] = sanitize_text_field($atts['placeholder']);
        }

        if ($atts['require-login'] !== '') {
            $instance['access']['requireLogin'] = filter_var($atts['require-login'], FILTER_VALIDATE_BOOLEAN);
        }

        return $instance;
    }

    /**
     * Render inline chat widget
     *
     * @param array $instance Instance configuration
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    private function render_inline(array $instance, array $atts): string {
        $container_id = 'n8n-chat-' . esc_attr($instance['id']) . '-' . wp_generate_uuid4();

        // Prevent duplicate renders
        $render_key = $instance['id'] . '-inline';
        if (isset($this->rendered_instances[$render_key])) {
            return '';
        }
        $this->rendered_instances[$render_key] = true;

        // Enqueue assets
        wp_enqueue_script('n8n-chat-frontend');
        wp_enqueue_style('n8n-chat-frontend');

        // Build inline styles
        $style = sprintf(
            'width:%s;height:%s;',
            esc_attr($atts['width']),
            esc_attr($atts['height'])
        );

        // CSS classes
        $classes = [
            'n8n-chat-container',
            'n8n-chat-mode-inline',
            'n8n-chat-theme-' . esc_attr($instance['theme']),
        ];

        if (!empty($atts['class'])) {
            $classes[] = sanitize_html_class($atts['class']);
        }

        // Pass config to JS
        $js_var_name = 'n8nChatInit_' . str_replace('-', '_', $container_id);
        wp_localize_script('n8n-chat-frontend', $js_var_name, [
            'containerId' => $container_id,
            'instanceId' => $instance['id'],
            'mode' => 'inline',
            'apiUrl' => rest_url('n8n-chat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        return sprintf(
            '<div id="%s" class="%s" style="%s"></div>',
            esc_attr($container_id),
            esc_attr(implode(' ', $classes)),
            $style
        );
    }

    /**
     * Render bubble chat widget
     *
     * @param array $instance Instance configuration
     * @param array $atts Shortcode attributes
     * @return string HTML output
     */
    private function render_bubble(array $instance, array $atts): string {
        $container_id = 'n8n-chat-bubble-' . esc_attr($instance['id']);

        // Prevent duplicate bubble renders
        $render_key = $instance['id'] . '-bubble';
        if (isset($this->rendered_instances[$render_key])) {
            return '';
        }
        $this->rendered_instances[$render_key] = true;

        // Enqueue assets
        wp_enqueue_script('n8n-chat-frontend');
        wp_enqueue_style('n8n-chat-frontend');

        // CSS classes
        $classes = [
            'n8n-chat-bubble-container',
            'n8n-chat-theme-' . esc_attr($instance['theme']),
        ];

        // Pass config to JS
        $js_var_name = 'n8nChatBubble_' . str_replace('-', '_', $instance['id']);
        wp_localize_script('n8n-chat-frontend', $js_var_name, [
            'containerId' => $container_id,
            'instanceId' => $instance['id'],
            'mode' => 'bubble',
            'apiUrl' => rest_url('n8n-chat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        return sprintf(
            '<div id="%s" class="%s"></div>',
            esc_attr($container_id),
            esc_attr(implode(' ', $classes))
        );
    }

    /**
     * Render error message
     *
     * @param string $message Error message
     * @return string HTML output
     */
    private function render_error(string $message): string {
        if (current_user_can('manage_options')) {
            return sprintf(
                '<div class="n8n-chat-error" style="padding:20px;border:1px solid #c00;background:#fff0f0;color:#c00;border-radius:4px;">%s</div>',
                esc_html($message)
            );
        }

        return '<!-- n8n Chat: Configuration error -->';
    }

    /**
     * Render login required message
     *
     * @param array $instance Instance configuration
     * @return string HTML output
     */
    private function render_login_required(array $instance): string {
        $message = $this->frontend->get_access_denied_message($instance);

        $login_url = wp_login_url(get_permalink());

        return sprintf(
            '<div class="n8n-chat-login-required" style="padding:20px;border:1px solid #ddd;background:#f9f9f9;border-radius:4px;text-align:center;">
                <p>%s</p>
                <a href="%s" class="n8n-chat-login-link" style="display:inline-block;padding:10px 20px;background:#3b82f6;color:#fff;text-decoration:none;border-radius:4px;">%s</a>
            </div>',
            esc_html($message),
            esc_url($login_url),
            esc_html__('Log In', 'n8n-chat')
        );
    }
}
