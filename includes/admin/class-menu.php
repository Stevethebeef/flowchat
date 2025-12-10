<?php
/**
 * Admin Menu Handler
 *
 * Registers admin menu pages.
 *
 * @package FlowChat
 */

namespace FlowChat\Admin;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Menu
 */
class Menu {

    /**
     * Menu capability
     */
    private const CAPABILITY = 'manage_options';

    /**
     * Menu icon (dashicons)
     */
    private const ICON = 'dashicons-format-chat';

    /**
     * Constructor
     */
    public function __construct() {
        add_action('admin_menu', [$this, 'register_menus']);
    }

    /**
     * Register admin menus
     */
    public function register_menus(): void {
        // Main menu
        add_menu_page(
            __('FlowChat', 'flowchat'),
            __('FlowChat', 'flowchat'),
            self::CAPABILITY,
            'flowchat',
            [$this, 'render_dashboard'],
            self::ICON,
            30
        );

        // Dashboard (same as main)
        add_submenu_page(
            'flowchat',
            __('Dashboard', 'flowchat'),
            __('Dashboard', 'flowchat'),
            self::CAPABILITY,
            'flowchat',
            [$this, 'render_dashboard']
        );

        // Chat Bots (Instances)
        add_submenu_page(
            'flowchat',
            __('Chat Bots', 'flowchat'),
            __('Chat Bots', 'flowchat'),
            self::CAPABILITY,
            'flowchat-instances',
            [$this, 'render_instances']
        );

        // Templates
        add_submenu_page(
            'flowchat',
            __('Templates', 'flowchat'),
            __('Templates', 'flowchat'),
            self::CAPABILITY,
            'flowchat-templates',
            [$this, 'render_templates']
        );

        // Settings
        add_submenu_page(
            'flowchat',
            __('Settings', 'flowchat'),
            __('Settings', 'flowchat'),
            self::CAPABILITY,
            'flowchat-settings',
            [$this, 'render_settings']
        );

        // Tools
        add_submenu_page(
            'flowchat',
            __('Tools', 'flowchat'),
            __('Tools', 'flowchat'),
            self::CAPABILITY,
            'flowchat-tools',
            [$this, 'render_tools']
        );

        // Help (external link styled as submenu)
        add_submenu_page(
            'flowchat',
            __('Help & Support', 'flowchat'),
            __('Help', 'flowchat'),
            self::CAPABILITY,
            'flowchat-help',
            [$this, 'render_help']
        );
    }

    /**
     * Render dashboard page
     */
    public function render_dashboard(): void {
        $this->render_react_app('dashboard');
    }

    /**
     * Render instances page
     */
    public function render_instances(): void {
        $this->render_react_app('instances');
    }

    /**
     * Render templates page
     */
    public function render_templates(): void {
        $this->render_react_app('templates');
    }

    /**
     * Render settings page
     */
    public function render_settings(): void {
        $this->render_react_app('settings');
    }

    /**
     * Render tools page
     */
    public function render_tools(): void {
        $this->render_react_app('tools');
    }

    /**
     * Render help page
     */
    public function render_help(): void {
        ?>
        <div class="wrap">
            <h1><?php esc_html_e('FlowChat Help & Support', 'flowchat'); ?></h1>

            <div class="flowchat-help-cards">
                <div class="flowchat-help-card">
                    <h2>
                        <span class="dashicons dashicons-book"></span>
                        <?php esc_html_e('Documentation', 'flowchat'); ?>
                    </h2>
                    <p><?php esc_html_e('Learn how to set up and configure FlowChat with detailed guides and tutorials.', 'flowchat'); ?></p>
                    <a href="https://docs.flowchat.dev" target="_blank" rel="noopener noreferrer" class="button button-primary">
                        <?php esc_html_e('View Documentation', 'flowchat'); ?>
                    </a>
                </div>

                <div class="flowchat-help-card">
                    <h2>
                        <span class="dashicons dashicons-sos"></span>
                        <?php esc_html_e('Support', 'flowchat'); ?>
                    </h2>
                    <p><?php esc_html_e('Need help? Visit our support forum or create a support ticket.', 'flowchat'); ?></p>
                    <a href="https://wordpress.org/support/plugin/flowchat/" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('Get Support', 'flowchat'); ?>
                    </a>
                </div>

                <div class="flowchat-help-card">
                    <h2>
                        <span class="dashicons dashicons-video-alt3"></span>
                        <?php esc_html_e('Video Tutorials', 'flowchat'); ?>
                    </h2>
                    <p><?php esc_html_e('Watch step-by-step video tutorials to get started quickly.', 'flowchat'); ?></p>
                    <a href="https://www.youtube.com/@flowchat" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('Watch Videos', 'flowchat'); ?>
                    </a>
                </div>

                <div class="flowchat-help-card">
                    <h2>
                        <span class="dashicons dashicons-admin-site-alt3"></span>
                        <?php esc_html_e('n8n Integration', 'flowchat'); ?>
                    </h2>
                    <p><?php esc_html_e('Learn how to create n8n workflows that power your chat bots.', 'flowchat'); ?></p>
                    <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chatn8n/" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('n8n Chat Docs', 'flowchat'); ?>
                    </a>
                </div>
            </div>

            <hr />

            <h2><?php esc_html_e('Quick Start Guide', 'flowchat'); ?></h2>
            <ol class="flowchat-help-steps">
                <li>
                    <strong><?php esc_html_e('Create an n8n Workflow', 'flowchat'); ?></strong>
                    <p><?php esc_html_e('In n8n, create a new workflow with a Chat Trigger node. This will give you a webhook URL.', 'flowchat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Add Your Chat Bot', 'flowchat'); ?></strong>
                    <p><?php esc_html_e('Go to FlowChat → Chat Bots → Add New. Enter your n8n webhook URL and configure the appearance.', 'flowchat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Test the Connection', 'flowchat'); ?></strong>
                    <p><?php esc_html_e('Use the "Test Connection" button to verify your webhook is responding correctly.', 'flowchat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Add to Your Site', 'flowchat'); ?></strong>
                    <p><?php esc_html_e('Copy the shortcode and add it to any page, or enable bubble mode for site-wide display.', 'flowchat'); ?></p>
                </li>
            </ol>

            <hr />

            <h2><?php esc_html_e('System Status', 'flowchat'); ?></h2>
            <p><?php esc_html_e('Check the Tools page for detailed system information and diagnostics.', 'flowchat'); ?></p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=flowchat-tools')); ?>" class="button">
                <?php esc_html_e('View System Info', 'flowchat'); ?>
            </a>
        </div>

        <style>
            .flowchat-help-cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .flowchat-help-card {
                background: #fff;
                border: 1px solid #c3c4c7;
                border-radius: 4px;
                padding: 20px;
            }
            .flowchat-help-card h2 {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 0;
                font-size: 16px;
            }
            .flowchat-help-card h2 .dashicons {
                color: #3b82f6;
            }
            .flowchat-help-card p {
                color: #646970;
                margin-bottom: 15px;
            }
            .flowchat-help-steps {
                max-width: 800px;
            }
            .flowchat-help-steps li {
                margin-bottom: 20px;
            }
            .flowchat-help-steps li strong {
                display: block;
                margin-bottom: 5px;
            }
            .flowchat-help-steps li p {
                margin: 0;
                color: #646970;
            }
        </style>
        <?php
    }

    /**
     * Render React app container
     *
     * @param string $page Page identifier
     */
    private function render_react_app(string $page): void {
        ?>
        <div class="wrap flowchat-admin-wrap">
            <div id="flowchat-admin-root" data-page="<?php echo esc_attr($page); ?>">
                <div class="flowchat-loading">
                    <div class="flowchat-loading-spinner"></div>
                    <p><?php esc_html_e('Loading FlowChat...', 'flowchat'); ?></p>
                </div>
            </div>
        </div>
        <style>
            .flowchat-admin-wrap {
                margin: 0;
                padding: 0;
            }
            .flowchat-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 400px;
                color: #646970;
            }
            .flowchat-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f0f0f1;
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: flowchat-spin 1s linear infinite;
            }
            @keyframes flowchat-spin {
                to { transform: rotate(360deg); }
            }
        </style>
        <?php
    }

    /**
     * Get current admin page
     *
     * @return string|null
     */
    public static function get_current_page(): ?string {
        if (!isset($_GET['page'])) {
            return null;
        }

        $page = sanitize_text_field($_GET['page']);

        if (strpos($page, 'flowchat') !== 0) {
            return null;
        }

        return str_replace('flowchat-', '', $page) ?: 'dashboard';
    }
}
