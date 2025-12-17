<?php
/**
 * Admin Menu Handler
 *
 * Registers admin menu pages.
 *
 * @package N8nChat
 */

namespace N8nChat\Admin;

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
            __('n8n Chat', 'n8n-chat'),
            __('n8n Chat', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat',
            [$this, 'render_dashboard'],
            self::ICON,
            30
        );

        // Dashboard (same as main)
        add_submenu_page(
            'n8n-chat',
            __('Dashboard', 'n8n-chat'),
            __('Dashboard', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat',
            [$this, 'render_dashboard']
        );

        // Chat Bots (Instances)
        add_submenu_page(
            'n8n-chat',
            __('Chat Bots', 'n8n-chat'),
            __('Chat Bots', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-instances',
            [$this, 'render_instances']
        );

        // Templates
        add_submenu_page(
            'n8n-chat',
            __('Templates', 'n8n-chat'),
            __('Templates', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-templates',
            [$this, 'render_templates']
        );

        // Settings
        add_submenu_page(
            'n8n-chat',
            __('Settings', 'n8n-chat'),
            __('Settings', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-settings',
            [$this, 'render_settings']
        );

        // Tools
        add_submenu_page(
            'n8n-chat',
            __('Tools', 'n8n-chat'),
            __('Tools', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-tools',
            [$this, 'render_tools']
        );

        // Help (external link styled as submenu)
        add_submenu_page(
            'n8n-chat',
            __('Help & Support', 'n8n-chat'),
            __('Help', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-help',
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
            <h1><?php esc_html_e('n8n Chat Help & Support', 'n8n-chat'); ?></h1>

            <div class="n8n-chat-help-cards">
                <div class="n8n-chat-help-card">
                    <h2>
                        <span class="dashicons dashicons-book"></span>
                        <?php esc_html_e('Documentation', 'n8n-chat'); ?>
                    </h2>
                    <p><?php esc_html_e('Learn how to set up and configure n8n Chat with detailed guides and tutorials.', 'n8n-chat'); ?></p>
                    <a href="https://docs.n8n-chat.dev" target="_blank" rel="noopener noreferrer" class="button button-primary">
                        <?php esc_html_e('View Documentation', 'n8n-chat'); ?>
                    </a>
                </div>

                <div class="n8n-chat-help-card">
                    <h2>
                        <span class="dashicons dashicons-sos"></span>
                        <?php esc_html_e('Support', 'n8n-chat'); ?>
                    </h2>
                    <p><?php esc_html_e('Need help? Visit our support forum or create a support ticket.', 'n8n-chat'); ?></p>
                    <a href="https://wordpress.org/support/plugin/n8n-chat/" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('Get Support', 'n8n-chat'); ?>
                    </a>
                </div>

                <div class="n8n-chat-help-card">
                    <h2>
                        <span class="dashicons dashicons-video-alt3"></span>
                        <?php esc_html_e('Video Tutorials', 'n8n-chat'); ?>
                    </h2>
                    <p><?php esc_html_e('Watch step-by-step video tutorials to get started quickly.', 'n8n-chat'); ?></p>
                    <a href="https://www.youtube.com/@n8n-chat" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('Watch Videos', 'n8n-chat'); ?>
                    </a>
                </div>

                <div class="n8n-chat-help-card">
                    <h2>
                        <span class="dashicons dashicons-admin-site-alt3"></span>
                        <?php esc_html_e('n8n Integration', 'n8n-chat'); ?>
                    </h2>
                    <p><?php esc_html_e('Learn how to create n8n workflows that power your chat bots.', 'n8n-chat'); ?></p>
                    <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-langchain.chatn8n/" target="_blank" rel="noopener noreferrer" class="button">
                        <?php esc_html_e('n8n Chat Docs', 'n8n-chat'); ?>
                    </a>
                </div>
            </div>

            <hr />

            <h2><?php esc_html_e('Quick Start Guide', 'n8n-chat'); ?></h2>
            <ol class="n8n-chat-help-steps">
                <li>
                    <strong><?php esc_html_e('Create an n8n Workflow', 'n8n-chat'); ?></strong>
                    <p><?php esc_html_e('In n8n, create a new workflow with a Chat Trigger node. This will give you a webhook URL.', 'n8n-chat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Add Your Chat Bot', 'n8n-chat'); ?></strong>
                    <p><?php esc_html_e('Go to n8n Chat → Chat Bots → Add New. Enter your n8n webhook URL and configure the appearance.', 'n8n-chat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Test the Connection', 'n8n-chat'); ?></strong>
                    <p><?php esc_html_e('Use the "Test Connection" button to verify your webhook is responding correctly.', 'n8n-chat'); ?></p>
                </li>
                <li>
                    <strong><?php esc_html_e('Add to Your Site', 'n8n-chat'); ?></strong>
                    <p><?php esc_html_e('Copy the shortcode and add it to any page, or enable bubble mode for site-wide display.', 'n8n-chat'); ?></p>
                </li>
            </ol>

            <hr />

            <h2><?php esc_html_e('System Status', 'n8n-chat'); ?></h2>
            <p><?php esc_html_e('Check the Tools page for detailed system information and diagnostics.', 'n8n-chat'); ?></p>
            <a href="<?php echo esc_url(admin_url('admin.php?page=n8n-chat-tools')); ?>" class="button">
                <?php esc_html_e('View System Info', 'n8n-chat'); ?>
            </a>
        </div>

        <style>
            .n8n-chat-help-cards {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 20px;
                margin: 20px 0;
            }
            .n8n-chat-help-card {
                background: #fff;
                border: 1px solid #c3c4c7;
                border-radius: 4px;
                padding: 20px;
            }
            .n8n-chat-help-card h2 {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-top: 0;
                font-size: 16px;
            }
            .n8n-chat-help-card h2 .dashicons {
                color: #3b82f6;
            }
            .n8n-chat-help-card p {
                color: #646970;
                margin-bottom: 15px;
            }
            .n8n-chat-help-steps {
                max-width: 800px;
            }
            .n8n-chat-help-steps li {
                margin-bottom: 20px;
            }
            .n8n-chat-help-steps li strong {
                display: block;
                margin-bottom: 5px;
            }
            .n8n-chat-help-steps li p {
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
        <div class="wrap n8n-chat-admin-wrap">
            <div id="n8n-chat-admin-root" data-page="<?php echo esc_attr($page); ?>">
                <div class="n8n-chat-loading">
                    <div class="n8n-chat-loading-spinner"></div>
                    <p><?php esc_html_e('Loading n8n Chat...', 'n8n-chat'); ?></p>
                </div>
            </div>
        </div>
        <style>
            .n8n-chat-admin-wrap {
                margin: 0;
                padding: 0;
            }
            .n8n-chat-loading {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                min-height: 400px;
                color: #646970;
            }
            .n8n-chat-loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid #f0f0f1;
                border-top-color: #3b82f6;
                border-radius: 50%;
                animation: n8n-chat-spin 1s linear infinite;
            }
            @keyframes n8n-chat-spin {
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

        if (strpos($page, 'n8n-chat') !== 0) {
            return null;
        }

        return str_replace('n8n-chat-', '', $page) ?: 'dashboard';
    }
}
