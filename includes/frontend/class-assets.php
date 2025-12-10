<?php
/**
 * Assets Handler
 *
 * Registers and enqueues frontend assets.
 *
 * @package FlowChat
 */

namespace FlowChat\Frontend;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Assets
 */
class Assets {

    /**
     * Constructor
     */
    public function __construct() {
        add_action('wp_enqueue_scripts', [$this, 'register_assets']);
        add_action('admin_enqueue_scripts', [$this, 'register_admin_assets']);
    }

    /**
     * Register frontend assets
     */
    public function register_assets(): void {
        // Register React (use WordPress bundled version if available, or our own)
        if (wp_script_is('react', 'registered')) {
            // WordPress 5.0+ has React
            $react_dep = 'react';
            $react_dom_dep = 'react-dom';
        } else {
            // Register our own React
            wp_register_script(
                'flowchat-react',
                FLOWCHAT_PLUGIN_URL . 'build/vendor/react.production.min.js',
                [],
                '18.2.0',
                true
            );

            wp_register_script(
                'flowchat-react-dom',
                FLOWCHAT_PLUGIN_URL . 'build/vendor/react-dom.production.min.js',
                ['flowchat-react'],
                '18.2.0',
                true
            );

            $react_dep = 'flowchat-react';
            $react_dom_dep = 'flowchat-react-dom';
        }

        // Main frontend bundle
        wp_register_script(
            'flowchat-frontend',
            FLOWCHAT_PLUGIN_URL . 'build/frontend/chat.js',
            [$react_dep, $react_dom_dep],
            FLOWCHAT_VERSION,
            true
        );

        // Frontend styles
        wp_register_style(
            'flowchat-frontend',
            FLOWCHAT_PLUGIN_URL . 'build/frontend/chat.css',
            [],
            FLOWCHAT_VERSION
        );

        // Add inline script for global config
        wp_add_inline_script(
            'flowchat-frontend',
            $this->get_global_config_script(),
            'before'
        );
    }

    /**
     * Register admin assets
     */
    public function register_admin_assets(): void {
        // Admin React app
        wp_register_script(
            'flowchat-admin',
            FLOWCHAT_PLUGIN_URL . 'build/admin/admin.js',
            ['wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n'],
            FLOWCHAT_VERSION,
            true
        );

        // Admin styles
        wp_register_style(
            'flowchat-admin',
            FLOWCHAT_PLUGIN_URL . 'build/admin/admin.css',
            ['wp-components'],
            FLOWCHAT_VERSION
        );

        // Localize admin script
        wp_localize_script('flowchat-admin', 'flowchatAdmin', [
            'apiUrl' => rest_url('flowchat/v1/admin'),
            'publicApiUrl' => rest_url('flowchat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'pluginUrl' => FLOWCHAT_PLUGIN_URL,
            'adminUrl' => admin_url(),
            'version' => FLOWCHAT_VERSION,
            'capabilities' => [
                'canManageOptions' => current_user_can('manage_options'),
            ],
            'i18n' => $this->get_admin_i18n(),
        ]);
    }

    /**
     * Get global config script
     *
     * @return string
     */
    private function get_global_config_script(): string {
        $config = [
            'version' => FLOWCHAT_VERSION,
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
        ];

        return 'window.flowchatConfig = ' . wp_json_encode($config) . ';';
    }

    /**
     * Get admin i18n strings
     *
     * @return array
     */
    private function get_admin_i18n(): array {
        return [
            // General
            'save' => __('Save', 'flowchat'),
            'cancel' => __('Cancel', 'flowchat'),
            'delete' => __('Delete', 'flowchat'),
            'edit' => __('Edit', 'flowchat'),
            'duplicate' => __('Duplicate', 'flowchat'),
            'create' => __('Create', 'flowchat'),
            'close' => __('Close', 'flowchat'),
            'loading' => __('Loading...', 'flowchat'),
            'error' => __('Error', 'flowchat'),
            'success' => __('Success', 'flowchat'),

            // Instances
            'newInstance' => __('New Instance', 'flowchat'),
            'editInstance' => __('Edit Instance', 'flowchat'),
            'deleteInstance' => __('Delete Instance', 'flowchat'),
            'duplicateInstance' => __('Duplicate Instance', 'flowchat'),
            'instanceName' => __('Instance Name', 'flowchat'),
            'webhookUrl' => __('Webhook URL', 'flowchat'),
            'testConnection' => __('Test Connection', 'flowchat'),
            'connectionSuccess' => __('Connection successful!', 'flowchat'),
            'connectionFailed' => __('Connection failed', 'flowchat'),

            // Settings
            'appearance' => __('Appearance', 'flowchat'),
            'content' => __('Content', 'flowchat'),
            'behavior' => __('Behavior', 'flowchat'),
            'access' => __('Access Control', 'flowchat'),
            'features' => __('Features', 'flowchat'),
            'advanced' => __('Advanced', 'flowchat'),

            // Themes
            'themeLight' => __('Light', 'flowchat'),
            'themeDark' => __('Dark', 'flowchat'),
            'themeAuto' => __('Auto (System)', 'flowchat'),

            // Bubble
            'bubbleSettings' => __('Bubble Settings', 'flowchat'),
            'bubbleEnabled' => __('Enable Floating Bubble', 'flowchat'),
            'bubblePosition' => __('Position', 'flowchat'),
            'bottomRight' => __('Bottom Right', 'flowchat'),
            'bottomLeft' => __('Bottom Left', 'flowchat'),

            // Confirmations
            'confirmDelete' => __('Are you sure you want to delete this instance?', 'flowchat'),
            'confirmDeleteMessage' => __('This action cannot be undone. All chat history for this instance will be permanently deleted.', 'flowchat'),

            // Errors
            'errorSaving' => __('Error saving changes', 'flowchat'),
            'errorLoading' => __('Error loading data', 'flowchat'),
            'errorRequired' => __('This field is required', 'flowchat'),
            'errorInvalidUrl' => __('Please enter a valid URL', 'flowchat'),
        ];
    }

    /**
     * Enqueue assets for a specific page
     *
     * @param string $page Page slug
     */
    public function enqueue_for_page(string $page): void {
        if (strpos($page, 'flowchat') !== false) {
            wp_enqueue_script('flowchat-admin');
            wp_enqueue_style('flowchat-admin');
        }
    }
}
