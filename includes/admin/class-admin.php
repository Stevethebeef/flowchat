<?php
/**
 * Admin Handler
 *
 * Main admin controller for FlowChat.
 *
 * @package FlowChat
 */

namespace FlowChat\Admin;

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
        // Only load on FlowChat admin pages
        if (strpos($hook, 'flowchat') === false) {
            return;
        }

        // Enqueue WordPress components
        wp_enqueue_style('wp-components');

        // Enqueue admin scripts
        wp_enqueue_script('flowchat-admin');
        wp_enqueue_style('flowchat-admin');

        // Enqueue media uploader for avatar selection
        if (strpos($hook, 'flowchat-instances') !== false) {
            wp_enqueue_media();
        }
    }

    /**
     * Check plugin version and run updates if needed
     */
    public function check_version(): void {
        $installed_version = get_option('flowchat_version', '0.0.0');

        if (version_compare($installed_version, FLOWCHAT_VERSION, '<')) {
            $this->run_updates($installed_version);
            update_option('flowchat_version', FLOWCHAT_VERSION);
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
        // Check if we're on a FlowChat page
        $screen = get_current_screen();
        if (!$screen || strpos($screen->id, 'flowchat') === false) {
            return;
        }

        // Check for missing webhook configuration
        $instances = get_option('flowchat_instances', []);
        $has_enabled_without_webhook = false;

        foreach ($instances as $instance) {
            if (!empty($instance['isEnabled']) && empty($instance['webhookUrl'])) {
                $has_enabled_without_webhook = true;
                break;
            }
        }

        if ($has_enabled_without_webhook) {
            $this->render_notice(
                __('One or more enabled chat instances do not have a webhook URL configured. They will not function until a webhook URL is set.', 'flowchat'),
                'warning'
            );
        }

        // Display stored notices
        $notices = get_transient('flowchat_admin_notices');
        if ($notices) {
            foreach ($notices as $notice) {
                $this->render_notice($notice['message'], $notice['type']);
            }
            delete_transient('flowchat_admin_notices');
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
        $notices = get_transient('flowchat_admin_notices') ?: [];
        $notices[] = [
            'message' => $message,
            'type' => $type,
        ];
        set_transient('flowchat_admin_notices', $notices, 60);
    }

    /**
     * Get admin page URL
     *
     * @param string $page Page slug
     * @param array $args Additional query args
     * @return string
     */
    public static function get_page_url(string $page = '', array $args = []): string {
        $base = admin_url('admin.php?page=flowchat');

        if ($page) {
            $base = admin_url('admin.php?page=flowchat-' . $page);
        }

        if (!empty($args)) {
            $base = add_query_arg($args, $base);
        }

        return $base;
    }
}
