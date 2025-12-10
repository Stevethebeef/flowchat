<?php
/**
 * Main Plugin Class
 *
 * @package FlowChat
 */

namespace FlowChat;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Main plugin class using singleton pattern.
 * Initializes all plugin components.
 */
class Plugin {

    /**
     * Singleton instance
     *
     * @var Plugin|null
     */
    private static ?Plugin $instance = null;

    /**
     * Get singleton instance
     *
     * @return Plugin
     */
    public static function get_instance(): Plugin {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Private constructor to prevent direct instantiation
     */
    private function __construct() {
        $this->load_dependencies();
        $this->init_hooks();
    }

    /**
     * Prevent cloning
     */
    private function __clone() {}

    /**
     * Prevent unserialization
     *
     * @throws \Exception
     */
    public function __wakeup() {
        throw new \Exception('Cannot unserialize singleton');
    }

    /**
     * Load plugin dependencies and initialize components
     */
    private function load_dependencies(): void {
        // Core components (always loaded)
        Core\Instance_Manager::get_instance();
        Core\Session_Manager::get_instance();
        Core\Error_Handler::get_instance();
        Core\Template_Manager::get_instance();
        Core\JWT_Manager::get_instance();
        Core\Theme_Integration::get_instance();
        Core\Fallback_Handler::get_instance();
        Core\Debug_Mode::get_instance();

        // Instance Router (handles URL-based targeting)
        $router = Core\Instance_Router::get_instance();
        $router->init();

        // Frontend components
        new Frontend\Frontend();
        new Frontend\Shortcode();
        new Frontend\Assets();

        // Public API endpoints
        new API\Public_Endpoints();

        // Admin components (only in admin context)
        if (is_admin()) {
            new Admin\Admin();
            new Admin\Menu();
            new API\Admin_Endpoints();

            // Register template endpoints
            add_action('rest_api_init', function() {
                $template_endpoints = new API\Template_Endpoints();
                $template_endpoints->register_routes();
            });
        }
    }

    /**
     * Initialize WordPress hooks
     */
    private function init_hooks(): void {
        // Load translations
        add_action('init', [$this, 'load_textdomain']);

        // Register Gutenberg block
        add_action('init', [$this, 'register_block']);

        // Plugin action links
        add_filter(
            'plugin_action_links_' . FLOWCHAT_PLUGIN_BASENAME,
            [$this, 'add_action_links']
        );
    }

    /**
     * Register Gutenberg block
     */
    public function register_block(): void {
        // Only register if Gutenberg is available
        if (!function_exists('register_block_type')) {
            return;
        }

        $block_path = FLOWCHAT_PLUGIN_DIR . 'blocks/flowchat';

        // Check if block.json exists
        if (!file_exists($block_path . '/block.json')) {
            return;
        }

        register_block_type($block_path);
    }

    /**
     * Load plugin translations
     */
    public function load_textdomain(): void {
        load_plugin_textdomain(
            'flowchat',
            false,
            dirname(FLOWCHAT_PLUGIN_BASENAME) . '/languages'
        );
    }

    /**
     * Add plugin action links
     *
     * @param array $links Existing action links
     * @return array Modified action links
     */
    public function add_action_links(array $links): array {
        $plugin_links = [
            '<a href="' . admin_url('admin.php?page=flowchat') . '">' .
                esc_html__('Settings', 'flowchat') . '</a>',
        ];
        return array_merge($plugin_links, $links);
    }

    /**
     * Get plugin version
     *
     * @return string
     */
    public function get_version(): string {
        return FLOWCHAT_VERSION;
    }
}
