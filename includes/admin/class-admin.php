<?php
/**
 * Admin Handler
 *
 * Main admin controller for n8n Chat.
 *
 * @package N8nChat
 */

namespace N8nChat\Admin;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Admin
 */
class Admin {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_enqueue_scripts', [$this, 'enqueue_assets']);
        add_action('admin_init', [$this, 'check_version']);
        add_action('admin_notices', [$this, 'display_notices']);
    }

    /**
     * Enqueue admin assets
     *
     * @param string $hook Current admin page hook
     */
    public function enqueue_assets(string $hook): void {
        // Only load on n8n Chat admin pages
        if (strpos($hook, 'n8n-chat') === false) {
            return;
        }

        // Enqueue WordPress components
        wp_enqueue_style('wp-components');

        // Enqueue admin scripts
        wp_enqueue_script('n8n-chat-admin');
        wp_enqueue_style('n8n-chat-admin');

        // Enqueue media uploader for avatar selection
        if (strpos($hook, 'n8n-chat-instances') !== false) {
            wp_enqueue_media();
        }
    }

    /**
     * Check plugin version and run updates if needed
     */
    public function check_version(): void {
        $installed_version = get_option('n8n_chat_version', '0.0.0');

        if (version_compare($installed_version, N8N_CHAT_VERSION, '<')) {
            $this->run_updates($installed_version);
            update_option('n8n_chat_version', N8N_CHAT_VERSION);
        }
    }

    /**
     * Run version updates
     *
     * @param string $from_version Previous version
     */
    private function run_updates(string $from_version): void {
        // Example: if upgrading from version before 1.1.0
        // if (version_compare($from_version, '1.1.0', '<')) {
        //     $this->update_to_1_1_0();
        // }
    }

    /**
     * Display admin notices
     */
    public function display_notices(): void {
        // Check if we're on an n8n Chat page
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'n8n-chat') === false) {
            return;
        }

        // Check for missing webhook configuration
        $instances = get_option('n8n_chat_instances', []);
        $has_enabled_without_webhook = false;

        foreach ($instances as $instance) {
            if (!empty($instance['isEnabled']) && empty($instance['webhookUrl'])) {
                $has_enabled_without_webhook = true;
                break;
            }
        }

        if ($has_enabled_without_webhook) {
            $this->render_notice(
                __('One or more enabled chat instances do not have a webhook URL configured. They will not function until a webhook URL is set.', 'n8n-chat'),
                'warning'
            );
        }

        // Display stored notices
        $notices = get_transient('n8n_chat_admin_notices');
        if ($notices) {
            foreach ($notices as $notice) {
                $this->render_notice($notice['message'], $notice['type']);
            }
            delete_transient('n8n_chat_admin_notices');
        }
    }

    /**
     * Render an admin notice
     *
     * @param string $message Notice message
     * @param string $type Notice type (success, error, warning, info)
     */
    private function render_notice(string $message, string $type = 'info'): void {
        $class = 'notice notice-' . $type . ' is-dismissible';
        printf(
            '<div class="%1$s"><p>%2$s</p></div>',
            esc_attr($class),
            esc_html($message)
        );
    }

    /**
     * Add an admin notice to be displayed
     *
     * @param string $message Notice message
     * @param string $type Notice type
     */
    public static function add_notice(string $message, string $type = 'info'): void {
        $notices = get_transient('n8n_chat_admin_notices') ?: [];
        $notices[] = [
            'message' => $message,
            'type' => $type,
        ];
        set_transient('n8n_chat_admin_notices', $notices, 60);
    }

    /**
     * Get admin page URL
     *
     * @param string $page Page slug
     * @param array $args Additional query args
     * @return string
     */
    public static function get_page_url(string $page = '', array $args = []): string {
        $base = admin_url('admin.php?page=n8n-chat');

        if ($page) {
            $base = admin_url('admin.php?page=n8n-chat-' . $page);
        }

        if (!empty($args)) {
            $base = add_query_arg($args, $base);
        }

        return $base;
    }
}
