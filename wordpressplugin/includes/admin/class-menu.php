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
    private const ICON = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBmaWxsPSJub25lIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxyZWN0IHg9IjMyIiB5PSIzMiIgd2lkdGg9IjQ0OCIgaGVpZ2h0PSI0NDgiIHJ4PSI4MCIgZmlsbD0iI0ZGNkIyQyIvPjx0ZXh0IHg9IjI1NiIgeT0iMzEwIiBmb250LWZhbWlseT0ic3lzdGVtLXVpLC1hcHBsZS1zeXN0ZW0sc2Fucy1zZXJpZiIgZm9udC1zaXplPSIyMDAiIGZvbnQtd2VpZ2h0PSI3MDAiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5OODwvdGV4dD48L3N2Zz4=';

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

        // License
        add_submenu_page(
            'n8n-chat',
            __('License', 'n8n-chat'),
            __('License', 'n8n-chat'),
            self::CAPABILITY,
            'n8n-chat-license',
            [$this, 'render_license']
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
     * Render license page
     */
    public function render_license(): void {
        $this->render_license_page();
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
     * Render license page with Apple-like styling
     */
    private function render_license_page(): void {
        $license_manager = \N8nChat\Core\License_Manager::get_instance();
        $license = $license_manager->get_license();
        $status = $license_manager->get_premium_status();

        $status_class = match($status['status']) {
            'active' => 'status-active',
            'grace' => 'status-grace',
            'expired' => 'status-expired',
            default => 'status-inactive',
        };

        $status_label = match($status['status']) {
            'active' => __('Active', 'n8n-chat'),
            'grace' => __('Grace Period', 'n8n-chat'),
            'expired' => __('Expired', 'n8n-chat'),
            default => __('Inactive', 'n8n-chat'),
        };

        $purchase_url = $license_manager->get_purchase_url('license-page');
        $resend_url = $license_manager->get_resend_url($license['email'] ?? '');
        ?>
        <div class="wrap n8n-license-wrap">
            <div class="n8n-license-container">
                <div class="n8n-license-header">
                    <h1><?php esc_html_e('License', 'n8n-chat'); ?></h1>
                    <p class="n8n-license-subtitle"><?php esc_html_e('Manage your n8n Chat license to unlock premium features.', 'n8n-chat'); ?></p>
                </div>

                <?php if ($status['status'] === 'grace'): ?>
                <div class="n8n-license-banner n8n-license-banner-warning">
                    <div class="n8n-license-banner-icon">
                        <span class="dashicons dashicons-warning"></span>
                    </div>
                    <div class="n8n-license-banner-content">
                        <strong><?php esc_html_e('Payment attention required', 'n8n-chat'); ?></strong>
                        <p>
                            <?php
                            printf(
                                /* translators: %d: number of days remaining in grace period */
                                esc_html(_n(
                                    '%d day left to update your payment method.',
                                    '%d days left to update your payment method.',
                                    $status['grace_days_left'] ?? 0,
                                    'n8n-chat'
                                )),
                                (int) ($status['grace_days_left'] ?? 0)
                            );
                            ?>
                        </p>
                    </div>
                    <a href="<?php echo esc_url($purchase_url); ?>" target="_blank" class="n8n-license-btn n8n-license-btn-warning">
                        <?php esc_html_e('Update Payment', 'n8n-chat'); ?>
                    </a>
                </div>
                <?php endif; ?>

                <?php if ($status['status'] === 'expired'): ?>
                <div class="n8n-license-banner n8n-license-banner-error">
                    <div class="n8n-license-banner-icon">
                        <span class="dashicons dashicons-dismiss"></span>
                    </div>
                    <div class="n8n-license-banner-content">
                        <strong><?php esc_html_e('License Expired', 'n8n-chat'); ?></strong>
                        <p><?php esc_html_e('Premium features are disabled. Renew your license to continue using them.', 'n8n-chat'); ?></p>
                    </div>
                    <a href="<?php echo esc_url($purchase_url); ?>" target="_blank" class="n8n-license-btn n8n-license-btn-primary">
                        <?php esc_html_e('Renew License', 'n8n-chat'); ?>
                    </a>
                </div>
                <?php endif; ?>

                <div class="n8n-license-card">
                    <div class="n8n-license-status-row">
                        <span class="n8n-license-status-label"><?php esc_html_e('Status', 'n8n-chat'); ?></span>
                        <span class="n8n-license-status-badge <?php echo esc_attr($status_class); ?>">
                            <?php echo esc_html($status_label); ?>
                        </span>
                    </div>

                    <?php if ($status['status'] === 'active' || $status['status'] === 'grace'): ?>
                    <div class="n8n-license-info-row">
                        <span class="n8n-license-info-label"><?php esc_html_e('Valid Until', 'n8n-chat'); ?></span>
                        <span class="n8n-license-info-value">
                            <?php
                            if (!empty($status['valid_until'])) {
                                echo esc_html(date_i18n(get_option('date_format'), strtotime($status['valid_until'])));
                                if ($status['days_left'] !== null) {
                                    /* translators: %d: number of days remaining */
                                    echo ' (' . esc_html(sprintf(_n('%d day left', '%d days left', $status['days_left'], 'n8n-chat'), $status['days_left'])) . ')';
                                }
                            }
                            ?>
                        </span>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($status['email'])): ?>
                    <div class="n8n-license-info-row">
                        <span class="n8n-license-info-label"><?php esc_html_e('Email', 'n8n-chat'); ?></span>
                        <span class="n8n-license-info-value"><?php echo esc_html($status['email']); ?></span>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($status['license_key_masked'])): ?>
                    <div class="n8n-license-info-row">
                        <span class="n8n-license-info-label"><?php esc_html_e('License Key', 'n8n-chat'); ?></span>
                        <span class="n8n-license-info-value n8n-license-key-masked"><?php echo esc_html($status['license_key_masked']); ?></span>
                    </div>
                    <?php endif; ?>

                    <?php if (!empty($status['last_checked'])): ?>
                    <div class="n8n-license-info-row">
                        <span class="n8n-license-info-label"><?php esc_html_e('Last Checked', 'n8n-chat'); ?></span>
                        <span class="n8n-license-info-value n8n-license-info-muted">
                            <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), strtotime($status['last_checked']))); ?>
                        </span>
                    </div>
                    <?php endif; ?>

                    <?php if ($status['offline_mode']): ?>
                    <div class="n8n-license-info-row">
                        <span class="n8n-license-info-label"></span>
                        <span class="n8n-license-info-value n8n-license-info-warning">
                            <?php esc_html_e('Using cached license (network check failed)', 'n8n-chat'); ?>
                        </span>
                    </div>
                    <?php endif; ?>
                </div>

                <div class="n8n-license-card">
                    <h2 class="n8n-license-card-title">
                        <?php echo $status['status'] === 'inactive' ? esc_html__('Activate License', 'n8n-chat') : esc_html__('Update License', 'n8n-chat'); ?>
                    </h2>

                    <form id="n8n-license-form" class="n8n-license-form">
                        <?php wp_nonce_field('wp_rest', '_wpnonce'); ?>

                        <div class="n8n-license-field">
                            <label for="n8n-license-email"><?php esc_html_e('Email', 'n8n-chat'); ?></label>
                            <input
                                type="email"
                                id="n8n-license-email"
                                name="email"
                                value="<?php echo esc_attr($license['email'] ?? ''); ?>"
                                placeholder="you@example.com"
                                required
                            />
                        </div>

                        <div class="n8n-license-field">
                            <label for="n8n-license-key"><?php esc_html_e('License Key', 'n8n-chat'); ?></label>
                            <input
                                type="text"
                                id="n8n-license-key"
                                name="license_key"
                                value=""
                                placeholder="N8C-XXXX-XXXX-XXXX-XXXX"
                                required
                            />
                        </div>

                        <div class="n8n-license-actions">
                            <button type="submit" id="n8n-license-activate" class="n8n-license-btn n8n-license-btn-primary">
                                <?php esc_html_e('Activate License', 'n8n-chat'); ?>
                            </button>

                            <?php if ($status['status'] !== 'inactive'): ?>
                            <button type="button" id="n8n-license-deactivate" class="n8n-license-btn n8n-license-btn-secondary">
                                <?php esc_html_e('Deactivate', 'n8n-chat'); ?>
                            </button>

                            <button type="button" id="n8n-license-revalidate" class="n8n-license-btn n8n-license-btn-secondary">
                                <?php esc_html_e('Refresh', 'n8n-chat'); ?>
                            </button>
                            <?php endif; ?>
                        </div>

                        <div id="n8n-license-message" class="n8n-license-message" style="display: none;"></div>
                    </form>

                    <div class="n8n-license-links">
                        <a href="<?php echo esc_url($resend_url); ?>" target="_blank">
                            <?php esc_html_e('Resend license key', 'n8n-chat'); ?>
                        </a>
                        <span class="n8n-license-separator">|</span>
                        <a href="<?php echo esc_url($purchase_url); ?>" target="_blank">
                            <?php esc_html_e('Purchase license', 'n8n-chat'); ?>
                        </a>
                    </div>
                </div>

                <?php if ($status['status'] === 'inactive'): ?>
                <div class="n8n-license-card n8n-license-promo">
                    <h2 class="n8n-license-card-title"><?php esc_html_e('Premium Features', 'n8n-chat'); ?></h2>
                    <ul class="n8n-license-features">
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Unlimited chat instances', 'n8n-chat'); ?></li>
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Advanced analytics & reporting', 'n8n-chat'); ?></li>
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Custom branding & styling', 'n8n-chat'); ?></li>
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Priority support', 'n8n-chat'); ?></li>
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('File upload support', 'n8n-chat'); ?></li>
                        <li><span class="dashicons dashicons-yes"></span> <?php esc_html_e('Advanced targeting rules', 'n8n-chat'); ?></li>
                    </ul>
                    <a href="<?php echo esc_url($purchase_url); ?>" target="_blank" class="n8n-license-btn n8n-license-btn-primary n8n-license-btn-full">
                        <?php esc_html_e('Get Premium', 'n8n-chat'); ?>
                    </a>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <style>
            .n8n-license-wrap {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
                max-width: 640px;
                margin: 20px auto;
                padding: 0 20px;
            }
            .n8n-license-header {
                margin-bottom: 24px;
            }
            .n8n-license-header h1 {
                font-size: 28px;
                font-weight: 600;
                margin: 0 0 8px;
                color: #1d1d1f;
            }
            .n8n-license-subtitle {
                font-size: 14px;
                color: #86868b;
                margin: 0;
            }
            .n8n-license-card {
                background: #fff;
                border-radius: 12px;
                padding: 24px;
                margin-bottom: 16px;
                box-shadow: 0 1px 3px rgba(0,0,0,0.08);
            }
            .n8n-license-card-title {
                font-size: 17px;
                font-weight: 600;
                margin: 0 0 20px;
                color: #1d1d1f;
            }
            .n8n-license-status-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 0;
                border-bottom: 1px solid #f5f5f7;
            }
            .n8n-license-status-label {
                font-size: 14px;
                color: #1d1d1f;
                font-weight: 500;
            }
            .n8n-license-status-badge {
                font-size: 12px;
                font-weight: 500;
                padding: 4px 12px;
                border-radius: 100px;
            }
            .n8n-license-status-badge.status-active {
                background: #d1fae5;
                color: #065f46;
            }
            .n8n-license-status-badge.status-grace {
                background: #fef3c7;
                color: #92400e;
            }
            .n8n-license-status-badge.status-expired {
                background: #fee2e2;
                color: #991b1b;
            }
            .n8n-license-status-badge.status-inactive {
                background: #f3f4f6;
                color: #6b7280;
            }
            .n8n-license-info-row {
                display: flex;
                justify-content: space-between;
                padding: 12px 0;
                border-bottom: 1px solid #f5f5f7;
            }
            .n8n-license-info-row:last-child {
                border-bottom: none;
            }
            .n8n-license-info-label {
                font-size: 14px;
                color: #86868b;
            }
            .n8n-license-info-value {
                font-size: 14px;
                color: #1d1d1f;
            }
            .n8n-license-info-muted {
                color: #86868b;
            }
            .n8n-license-info-warning {
                color: #f59e0b;
                font-size: 12px;
            }
            .n8n-license-key-masked {
                font-family: 'SF Mono', Monaco, 'Cascadia Code', Consolas, monospace;
                font-size: 13px;
                letter-spacing: 0.5px;
                color: #6b7280;
            }
            .n8n-license-form {
                display: flex;
                flex-direction: column;
                gap: 16px;
            }
            .n8n-license-field {
                display: flex;
                flex-direction: column;
                gap: 6px;
            }
            .n8n-license-field label {
                font-size: 13px;
                font-weight: 500;
                color: #1d1d1f;
            }
            .n8n-license-field input {
                padding: 10px 14px;
                font-size: 15px;
                border: 1px solid #d2d2d7;
                border-radius: 8px;
                background: #fff;
                transition: border-color 0.2s, box-shadow 0.2s;
            }
            .n8n-license-field input:focus {
                outline: none;
                border-color: #0071e3;
                box-shadow: 0 0 0 3px rgba(0, 113, 227, 0.1);
            }
            .n8n-license-actions {
                display: flex;
                gap: 12px;
                margin-top: 8px;
            }
            .n8n-license-btn {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                padding: 10px 20px;
                font-size: 14px;
                font-weight: 500;
                border-radius: 8px;
                border: none;
                cursor: pointer;
                text-decoration: none;
                transition: all 0.2s;
            }
            .n8n-license-btn-primary {
                background: #0071e3;
                color: #fff;
            }
            .n8n-license-btn-primary:hover {
                background: #0077ed;
                color: #fff;
            }
            .n8n-license-btn-secondary {
                background: #f5f5f7;
                color: #1d1d1f;
            }
            .n8n-license-btn-secondary:hover {
                background: #e8e8ed;
            }
            .n8n-license-btn-warning {
                background: #f59e0b;
                color: #fff;
            }
            .n8n-license-btn-warning:hover {
                background: #d97706;
            }
            .n8n-license-btn-full {
                width: 100%;
            }
            .n8n-license-btn:disabled {
                opacity: 0.6;
                cursor: not-allowed;
            }
            .n8n-license-message {
                padding: 12px 16px;
                border-radius: 8px;
                font-size: 14px;
                margin-top: 8px;
            }
            .n8n-license-message.success {
                background: #d1fae5;
                color: #065f46;
            }
            .n8n-license-message.error {
                background: #fee2e2;
                color: #991b1b;
            }
            .n8n-license-links {
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #f5f5f7;
                text-align: center;
                font-size: 13px;
            }
            .n8n-license-links a {
                color: #0071e3;
                text-decoration: none;
            }
            .n8n-license-links a:hover {
                text-decoration: underline;
            }
            .n8n-license-separator {
                color: #d2d2d7;
                margin: 0 12px;
            }
            .n8n-license-banner {
                display: flex;
                align-items: center;
                gap: 16px;
                padding: 16px 20px;
                border-radius: 12px;
                margin-bottom: 16px;
            }
            .n8n-license-banner-warning {
                background: #fffbeb;
                border: 1px solid #fcd34d;
            }
            .n8n-license-banner-error {
                background: #fef2f2;
                border: 1px solid #fca5a5;
            }
            .n8n-license-banner-icon .dashicons {
                font-size: 24px;
                width: 24px;
                height: 24px;
            }
            .n8n-license-banner-warning .dashicons {
                color: #f59e0b;
            }
            .n8n-license-banner-error .dashicons {
                color: #ef4444;
            }
            .n8n-license-banner-content {
                flex: 1;
            }
            .n8n-license-banner-content strong {
                display: block;
                font-size: 14px;
                color: #1d1d1f;
            }
            .n8n-license-banner-content p {
                margin: 4px 0 0;
                font-size: 13px;
                color: #6b7280;
            }
            .n8n-license-promo {
                background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ed 100%);
            }
            .n8n-license-features {
                list-style: none;
                margin: 0 0 20px;
                padding: 0;
            }
            .n8n-license-features li {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 0;
                font-size: 14px;
                color: #1d1d1f;
            }
            .n8n-license-features .dashicons {
                color: #10b981;
                font-size: 18px;
                width: 18px;
                height: 18px;
            }
        </style>

        <script>
        jQuery(document).ready(function($) {
            var apiUrl = '<?php echo esc_url(rest_url('n8n-chat/v1/admin/license')); ?>';
            var nonce = '<?php echo esc_attr(wp_create_nonce('wp_rest')); ?>';

            function showMessage(message, type) {
                $('#n8n-license-message')
                    .removeClass('success error')
                    .addClass(type)
                    .text(message)
                    .show();
            }

            function setLoading(button, loading) {
                if (loading) {
                    button.prop('disabled', true).data('original-text', button.text()).text('<?php esc_html_e('Please wait...', 'n8n-chat'); ?>');
                } else {
                    button.prop('disabled', false).text(button.data('original-text'));
                }
            }

            $('#n8n-license-form').on('submit', function(e) {
                e.preventDefault();

                var $btn = $('#n8n-license-activate');
                var email = $('#n8n-license-email').val();
                var licenseKey = $('#n8n-license-key').val();

                if (!email || !licenseKey) {
                    showMessage('<?php esc_html_e('Please enter both email and license key.', 'n8n-chat'); ?>', 'error');
                    return;
                }

                setLoading($btn, true);
                $('#n8n-license-message').hide();

                $.ajax({
                    url: apiUrl + '/activate',
                    method: 'POST',
                    headers: { 'X-WP-Nonce': nonce },
                    contentType: 'application/json',
                    data: JSON.stringify({
                        email: email,
                        license_key: licenseKey
                    }),
                    success: function(response) {
                        if (response.success) {
                            showMessage(response.data.message || '<?php esc_html_e('License activated successfully!', 'n8n-chat'); ?>', 'success');
                            setTimeout(function() { location.reload(); }, 1500);
                        } else {
                            showMessage(response.data.message || '<?php esc_html_e('Activation failed.', 'n8n-chat'); ?>', 'error');
                        }
                    },
                    error: function(xhr) {
                        var msg = xhr.responseJSON?.data?.message || '<?php esc_html_e('An error occurred. Please try again.', 'n8n-chat'); ?>';
                        showMessage(msg, 'error');
                    },
                    complete: function() {
                        setLoading($btn, false);
                    }
                });
            });

            $('#n8n-license-deactivate').on('click', function() {
                if (!confirm('<?php esc_html_e('Are you sure you want to deactivate your license?', 'n8n-chat'); ?>')) {
                    return;
                }

                var $btn = $(this);
                setLoading($btn, true);

                $.ajax({
                    url: apiUrl + '/deactivate',
                    method: 'POST',
                    headers: { 'X-WP-Nonce': nonce },
                    success: function(response) {
                        if (response.success) {
                            showMessage('<?php esc_html_e('License deactivated.', 'n8n-chat'); ?>', 'success');
                            setTimeout(function() { location.reload(); }, 1500);
                        }
                    },
                    error: function() {
                        showMessage('<?php esc_html_e('Failed to deactivate license.', 'n8n-chat'); ?>', 'error');
                    },
                    complete: function() {
                        setLoading($btn, false);
                    }
                });
            });

            $('#n8n-license-revalidate').on('click', function() {
                var $btn = $(this);
                setLoading($btn, true);

                $.ajax({
                    url: apiUrl + '/revalidate',
                    method: 'POST',
                    headers: { 'X-WP-Nonce': nonce },
                    success: function(response) {
                        showMessage(response.data?.message || '<?php esc_html_e('License refreshed.', 'n8n-chat'); ?>', response.success ? 'success' : 'error');
                        if (response.success) {
                            setTimeout(function() { location.reload(); }, 1500);
                        }
                    },
                    error: function() {
                        showMessage('<?php esc_html_e('Failed to refresh license.', 'n8n-chat'); ?>', 'error');
                    },
                    complete: function() {
                        setLoading($btn, false);
                    }
                });
            });
        });
        </script>
        <?php
    }

    /**
     * Get current admin page
     *
     * @return string|null
     */
    public static function get_current_page(): ?string {
        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only check for current page navigation
        if (!isset($_GET['page'])) {
            return null;
        }

        // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page navigation
        $page = sanitize_text_field(wp_unslash($_GET['page']));

        if (strpos($page, 'n8n-chat') !== 0) {
            return null;
        }

        return str_replace('n8n-chat-', '', $page) ?: 'dashboard';
    }
}
