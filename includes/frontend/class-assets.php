<?php
/**
 * Assets Handler
 *
 * Registers and enqueues frontend assets.
 *
 * @package N8nChat
 */

namespace N8nChat\Frontend;

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
                'n8n-chat-react',
                N8N_CHAT_PLUGIN_URL . 'build/vendor/react.production.min.js',
                [],
                '18.2.0',
                true
            );

            wp_register_script(
                'n8n-chat-react-dom',
                N8N_CHAT_PLUGIN_URL . 'build/vendor/react-dom.production.min.js',
                ['n8n-chat-react'],
                '18.2.0',
                true
            );

            $react_dep = 'n8n-chat-react';
            $react_dom_dep = 'n8n-chat-react-dom';
        }

        // Main frontend bundle
        wp_register_script(
            'n8n-chat-frontend',
            N8N_CHAT_PLUGIN_URL . 'build/frontend/chat.js',
            [$react_dep, $react_dom_dep],
            N8N_CHAT_VERSION,
            true
        );

        // Frontend styles
        wp_register_style(
            'n8n-chat-frontend',
            N8N_CHAT_PLUGIN_URL . 'build/frontend/chat.css',
            [],
            N8N_CHAT_VERSION
        );

        // Add inline script for global config
        wp_add_inline_script(
            'n8n-chat-frontend',
            $this->get_global_config_script(),
            'before'
        );
    }

    /**
     * Register admin assets
     */
    public function register_admin_assets(): void {
        // Load asset dependencies from WordPress Scripts generated file
        $asset_file = N8N_CHAT_PLUGIN_DIR . 'build/admin/admin-index.tsx.asset.php';
        $asset = file_exists($asset_file) ? require($asset_file) : ['dependencies' => ['wp-element', 'wp-components', 'wp-api-fetch', 'wp-i18n'], 'version' => N8N_CHAT_VERSION];

        // Admin React app
        wp_register_script(
            'n8n-chat-admin',
            N8N_CHAT_PLUGIN_URL . 'build/admin/admin-index.tsx.js',
            $asset['dependencies'],
            $asset['version'],
            true
        );

        // Admin styles
        wp_register_style(
            'n8n-chat-admin',
            N8N_CHAT_PLUGIN_URL . 'build/admin/admin-index.tsx.css',
            ['wp-components'],
            $asset['version']
        );

        // Localize admin script
        wp_localize_script('n8n-chat-admin', 'n8nChatAdmin', [
            'apiUrl' => rest_url('n8n-chat/v1/admin'),
            'publicApiUrl' => rest_url('n8n-chat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
            'pluginUrl' => N8N_CHAT_PLUGIN_URL,
            'adminUrl' => admin_url(),
            'version' => N8N_CHAT_VERSION,
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
            'version' => N8N_CHAT_VERSION,
            'debug' => defined('WP_DEBUG') && WP_DEBUG,
        ];

        return 'window.n8nChatConfig = ' . wp_json_encode($config) . ';';
    }

    /**
     * Get admin i18n strings
     *
     * @return array
     */
    private function get_admin_i18n(): array {
        return [
            // General
            'save' => __('Save', 'n8n-chat'),
            'cancel' => __('Cancel', 'n8n-chat'),
            'delete' => __('Delete', 'n8n-chat'),
            'edit' => __('Edit', 'n8n-chat'),
            'duplicate' => __('Duplicate', 'n8n-chat'),
            'create' => __('Create', 'n8n-chat'),
            'close' => __('Close', 'n8n-chat'),
            'loading' => __('Loading...', 'n8n-chat'),
            'error' => __('Error', 'n8n-chat'),
            'success' => __('Success', 'n8n-chat'),
            'yes' => __('Yes', 'n8n-chat'),
            'no' => __('No', 'n8n-chat'),
            'enabled' => __('Enabled', 'n8n-chat'),
            'disabled' => __('Disabled', 'n8n-chat'),
            'back' => __('Back', 'n8n-chat'),
            'preview' => __('Preview', 'n8n-chat'),
            'copy' => __('Copy', 'n8n-chat'),
            'copied' => __('Copied!', 'n8n-chat'),

            // Dashboard
            'welcomeToN8nChat' => __('Welcome to n8n Chat', 'n8n-chat'),
            'totalChatBots' => __('Total Chat Bots', 'n8n-chat'),
            'activeBots' => __('Active Bots', 'n8n-chat'),
            'totalConversations' => __('Total Conversations', 'n8n-chat'),
            'todaysChats' => __("Today's Chats", 'n8n-chat'),
            'loadingDashboard' => __('Loading dashboard...', 'n8n-chat'),
            'quickActions' => __('Quick Actions', 'n8n-chat'),
            'chatBots' => __('Chat Bots', 'n8n-chat'),
            'gettingStarted' => __('Getting Started', 'n8n-chat'),
            'viewAll' => __('View All', 'n8n-chat'),
            'noChatBotsYet' => __('No chat bots yet.', 'n8n-chat'),
            'createYourFirstBot' => __('Create your first chat bot to get started.', 'n8n-chat'),

            // Instance List
            'chatInstances' => __('Chat Instances', 'n8n-chat'),
            'addNewInstance' => __('Add New Instance', 'n8n-chat'),
            'noInstancesYet' => __('No chat instances yet.', 'n8n-chat'),
            'createFirstInstance' => __('Create Your First Instance', 'n8n-chat'),
            'loadingInstances' => __('Loading instances...', 'n8n-chat'),

            // Table Headers
            'name' => __('Name', 'n8n-chat'),
            'status' => __('Status', 'n8n-chat'),
            'sessions' => __('Sessions', 'n8n-chat'),
            'shortcode' => __('Shortcode', 'n8n-chat'),
            'actions' => __('Actions', 'n8n-chat'),
            'mode' => __('Mode', 'n8n-chat'),

            // Status Labels
            'active' => __('Active', 'n8n-chat'),
            'inactive' => __('Inactive', 'n8n-chat'),

            // Display Modes
            'bubble' => __('Bubble', 'n8n-chat'),
            'inline' => __('Inline', 'n8n-chat'),
            'floatingBubble' => __('Floating Bubble', 'n8n-chat'),
            'inlineEmbed' => __('Inline Embed', 'n8n-chat'),

            // Tab Labels
            'general' => __('General', 'n8n-chat'),
            'connection' => __('Connection', 'n8n-chat'),
            'display' => __('Display', 'n8n-chat'),
            'messages' => __('Messages', 'n8n-chat'),
            'rules' => __('Rules', 'n8n-chat'),

            // Instances
            'newInstance' => __('New Instance', 'n8n-chat'),
            'editInstance' => __('Edit Instance', 'n8n-chat'),
            'deleteInstance' => __('Delete Instance', 'n8n-chat'),
            'duplicateInstance' => __('Duplicate Instance', 'n8n-chat'),
            'instanceName' => __('Instance Name', 'n8n-chat'),
            'webhookUrl' => __('Webhook URL', 'n8n-chat'),
            'testConnection' => __('Test Connection', 'n8n-chat'),
            'connectionSuccess' => __('Connection successful!', 'n8n-chat'),
            'connectionFailed' => __('Connection failed', 'n8n-chat'),

            // General Tab
            'generalSettings' => __('General Settings', 'n8n-chat'),
            'internalNameDesc' => __('Internal name for organization. This won\'t be visible to visitors.', 'n8n-chat'),
            'statusDesc' => __('When inactive, the chat will not appear on your site.', 'n8n-chat'),
            'slug' => __('Slug', 'n8n-chat'),
            'slugDesc' => __('URL-friendly identifier (auto-generated from name).', 'n8n-chat'),
            'systemPrompt' => __('System Prompt', 'n8n-chat'),

            // Connection Tab
            'webhookUrlDesc' => __('The production webhook URL from your n8n Chat Trigger node.', 'n8n-chat'),
            'authentication' => __('Authentication', 'n8n-chat'),
            'nonePublic' => __('None / Public', 'n8n-chat'),
            'basicAuth' => __('Basic Auth', 'n8n-chat'),
            'bearerToken' => __('Bearer Token', 'n8n-chat'),
            'streaming' => __('Streaming', 'n8n-chat'),
            'enableStreaming' => __('Enable streaming responses', 'n8n-chat'),
            'timeout' => __('Timeout', 'n8n-chat'),
            'chatInputKey' => __('Chat Input Key', 'n8n-chat'),
            'sessionKey' => __('Session Key', 'n8n-chat'),
            'advancedSettings' => __('Advanced Settings', 'n8n-chat'),

            // Display Tab
            'displayMode' => __('Display Mode', 'n8n-chat'),
            'bubbleDesc' => __('Shows as a floating button that expands into a chat window.', 'n8n-chat'),
            'inlineDesc' => __('Embeds directly in page content using shortcode placement.', 'n8n-chat'),
            'showOnAllPages' => __('Show on All Pages', 'n8n-chat'),
            'showOnAllPagesDesc' => __('Enable this to display the chat bubble on every page of your site automatically.', 'n8n-chat'),
            'bubbleIcon' => __('Bubble Icon', 'n8n-chat'),
            'bubbleText' => __('Bubble Text', 'n8n-chat'),
            'bubbleSize' => __('Bubble Size', 'n8n-chat'),
            'small' => __('Small', 'n8n-chat'),
            'medium' => __('Medium', 'n8n-chat'),
            'large' => __('Large', 'n8n-chat'),
            'position' => __('Position', 'n8n-chat'),
            'offset' => __('Offset', 'n8n-chat'),
            'windowSize' => __('Window Size', 'n8n-chat'),
            'width' => __('Width', 'n8n-chat'),
            'height' => __('Height', 'n8n-chat'),
            'autoOpen' => __('Auto Open', 'n8n-chat'),
            'autoOpenEnabled' => __('Enable auto-open', 'n8n-chat'),
            'trigger' => __('Trigger', 'n8n-chat'),
            'delay' => __('Delay', 'n8n-chat'),
            'scrollPosition' => __('Scroll Position', 'n8n-chat'),
            'userIdle' => __('User Idle', 'n8n-chat'),

            // Messages Tab
            'welcomeScreen' => __('Welcome Screen', 'n8n-chat'),
            'showWelcomeScreen' => __('Show welcome screen on first open', 'n8n-chat'),
            'chatTitle' => __('Chat Title', 'n8n-chat'),
            'welcomeMessage' => __('Welcome Message', 'n8n-chat'),
            'quickSuggestions' => __('Quick Suggestions', 'n8n-chat'),
            'addSuggestion' => __('Add Suggestion', 'n8n-chat'),
            'chatInput' => __('Chat Input', 'n8n-chat'),
            'inputPlaceholder' => __('Input Placeholder', 'n8n-chat'),
            'uiOptions' => __('UI Options', 'n8n-chat'),
            'showHeader' => __('Show chat header', 'n8n-chat'),
            'showTimestamps' => __('Show message timestamps', 'n8n-chat'),
            'showAvatar' => __('Show bot avatar', 'n8n-chat'),
            'showTypingIndicator' => __('Show typing indicator', 'n8n-chat'),
            'inputFeatures' => __('Input Features', 'n8n-chat'),
            'enableVoiceInput' => __('Enable voice input', 'n8n-chat'),
            'voiceInputDesc' => __('Allow users to dictate messages using their microphone.', 'n8n-chat'),
            'enableFileUploads' => __('Enable file uploads', 'n8n-chat'),
            'fileUploadsDesc' => __('Allow users to attach files and images to their messages.', 'n8n-chat'),
            'allowedFileTypes' => __('Allowed File Types', 'n8n-chat'),
            'maxFileSize' => __('Maximum File Size', 'n8n-chat'),
            'errorMessages' => __('Error Messages', 'n8n-chat'),
            'showErrorMessages' => __('Show Error Messages', 'n8n-chat'),
            'hideErrorMessages' => __('Hide Error Messages', 'n8n-chat'),
            'connectionError' => __('Connection Error', 'n8n-chat'),
            'timeoutError' => __('Timeout Error', 'n8n-chat'),
            'rateLimitError' => __('Rate Limit Error', 'n8n-chat'),
            'offlineFallback' => __('Offline Fallback', 'n8n-chat'),
            'enableFallbackForm' => __('Enable fallback contact form', 'n8n-chat'),
            'fallbackEmail' => __('Notification Email', 'n8n-chat'),
            'fallbackMessage' => __('Fallback Message', 'n8n-chat'),

            // Appearance Tab
            'colorScheme' => __('Color Scheme', 'n8n-chat'),
            'customColors' => __('Custom Colors', 'n8n-chat'),
            'themeColors' => __('Theme Colors', 'n8n-chat'),
            'stylePreset' => __('Style Preset', 'n8n-chat'),
            'primaryColor' => __('Primary Color', 'n8n-chat'),
            'selectPreset' => __('Select a Preset', 'n8n-chat'),
            'typography' => __('Typography', 'n8n-chat'),
            'fontFamily' => __('Font Family', 'n8n-chat'),
            'fontSize' => __('Font Size', 'n8n-chat'),
            'borderRadius' => __('Border Radius', 'n8n-chat'),
            'botAvatar' => __('Bot Avatar', 'n8n-chat'),
            'customCss' => __('Custom CSS', 'n8n-chat'),
            'showCustomCss' => __('Show Custom CSS', 'n8n-chat'),
            'hideCustomCss' => __('Hide Custom CSS', 'n8n-chat'),

            // Rules Tab
            'pageTargeting' => __('Page Targeting', 'n8n-chat'),
            'enableTargeting' => __('Enable page targeting', 'n8n-chat'),
            'targetingRules' => __('Targeting Rules', 'n8n-chat'),
            'addRule' => __('Add Rule', 'n8n-chat'),
            'urlPattern' => __('URL Pattern', 'n8n-chat'),
            'equals' => __('equals', 'n8n-chat'),
            'contains' => __('contains', 'n8n-chat'),
            'startsWith' => __('starts with', 'n8n-chat'),
            'endsWith' => __('ends with', 'n8n-chat'),
            'wildcard' => __('wildcard', 'n8n-chat'),
            'priority' => __('Priority', 'n8n-chat'),
            'priorityDesc' => __('When multiple chat bots match a page, the one with higher priority wins.', 'n8n-chat'),
            'userAccess' => __('User Access', 'n8n-chat'),
            'requireLogin' => __('Require login', 'n8n-chat'),
            'allowedRoles' => __('Allowed Roles', 'n8n-chat'),
            'deniedMessage' => __('Denied Message', 'n8n-chat'),
            'deviceTargeting' => __('Device Targeting', 'n8n-chat'),
            'desktop' => __('Desktop', 'n8n-chat'),
            'tablet' => __('Tablet', 'n8n-chat'),
            'mobile' => __('Mobile', 'n8n-chat'),
            'schedule' => __('Schedule', 'n8n-chat'),
            'enableSchedule' => __('Enable schedule', 'n8n-chat'),

            // Settings
            'appearance' => __('Appearance', 'n8n-chat'),
            'content' => __('Content', 'n8n-chat'),
            'behavior' => __('Behavior', 'n8n-chat'),
            'access' => __('Access Control', 'n8n-chat'),
            'features' => __('Features', 'n8n-chat'),
            'advanced' => __('Advanced', 'n8n-chat'),

            // Themes
            'themeLight' => __('Light', 'n8n-chat'),
            'themeDark' => __('Dark', 'n8n-chat'),
            'themeAuto' => __('Auto (System)', 'n8n-chat'),

            // Bubble
            'bubbleSettings' => __('Bubble Settings', 'n8n-chat'),
            'bubbleEnabled' => __('Enable Floating Bubble', 'n8n-chat'),
            'bubblePosition' => __('Position', 'n8n-chat'),
            'bottomRight' => __('Bottom Right', 'n8n-chat'),
            'bottomLeft' => __('Bottom Left', 'n8n-chat'),

            // Confirmations
            'confirmDelete' => __('Are you sure you want to delete this instance?', 'n8n-chat'),
            'confirmDeleteMessage' => __('This action cannot be undone. All chat history for this instance will be permanently deleted.', 'n8n-chat'),

            // Errors
            'errorSaving' => __('Error saving changes', 'n8n-chat'),
            'errorLoading' => __('Error loading data', 'n8n-chat'),
            'errorRequired' => __('This field is required', 'n8n-chat'),
            'errorInvalidUrl' => __('Please enter a valid URL', 'n8n-chat'),
            'failedToFetch' => __('Failed to fetch instances', 'n8n-chat'),
            'failedToDuplicate' => __('Failed to duplicate instance', 'n8n-chat'),
            'failedToDelete' => __('Failed to delete instance', 'n8n-chat'),
            'failedToUpdate' => __('Failed to update instance', 'n8n-chat'),
            'anErrorOccurred' => __('An error occurred', 'n8n-chat'),
            'failedToSave' => __('Failed to save settings', 'n8n-chat'),

            // Tooltips
            'tooltipWebhookUrl' => __('Copy this from your n8n Chat Trigger node. Open n8n > Chat Trigger node > Production URL', 'n8n-chat'),
            'tooltipChatInputKey' => __('The JSON key n8n expects for the user\'s message. Only change if your n8n workflow uses a different key name.', 'n8n-chat'),
            'tooltipSessionKey' => __('The JSON key for session tracking. Enables conversation history in n8n.', 'n8n-chat'),
            'tooltipStreaming' => __('Enable Server-Sent Events for real-time responses. Your n8n Chat Trigger must also have streaming enabled.', 'n8n-chat'),
            'tooltipShowOnAllPages' => __('When enabled, the bubble appears site-wide without needing shortcodes. Disable to show only on pages with the shortcode.', 'n8n-chat'),
            'tooltipVoiceInput' => __('Uses Web Speech API. Supported in Chrome, Edge, and Safari. Firefox has limited support.', 'n8n-chat'),
            'tooltipFileUpload' => __('Files are uploaded to wp-content/uploads/n8n-chat/temp/ and auto-deleted after 24 hours.', 'n8n-chat'),
            'tooltipThemeColors' => __('Extracts colors from theme.json (block themes), Customizer settings, or CSS variables like --wp--preset--color--primary.', 'n8n-chat'),
            'tooltipUrlPattern' => __('Examples: /products/* (wildcard), /blog (exact), product (contains). Uses simple pattern matching, not regex.', 'n8n-chat'),
            'tooltipPriority' => __('Higher number = higher priority. If a page matches multiple chat instances, the highest priority wins.', 'n8n-chat'),

            // File types
            'jpegImages' => __('JPEG Images', 'n8n-chat'),
            'pngImages' => __('PNG Images', 'n8n-chat'),
            'gifImages' => __('GIF Images', 'n8n-chat'),
            'webpImages' => __('WebP Images', 'n8n-chat'),
            'pdfDocuments' => __('PDF Documents', 'n8n-chat'),
            'textFiles' => __('Text Files', 'n8n-chat'),
        ];
    }

    /**
     * Get frontend i18n strings
     *
     * @return array
     */
    public function get_frontend_i18n(): array {
        return [
            // Loading states
            'loading' => __('Loading...', 'n8n-chat'),
            'loadingMessages' => __('Loading messages...', 'n8n-chat'),
            'sending' => __('Sending...', 'n8n-chat'),

            // Error messages
            'connectionError' => __('Connection error. Please try again.', 'n8n-chat'),
            'sendError' => __('Failed to send message. Please try again.', 'n8n-chat'),
            'uploadError' => __('Failed to upload file.', 'n8n-chat'),
            'fileTooLarge' => __('File is too large. Maximum size is %s.', 'n8n-chat'),
            'invalidFileType' => __('This file type is not allowed.', 'n8n-chat'),

            // Voice input
            'voiceListening' => __('Listening...', 'n8n-chat'),
            'voiceNotSupported' => __('Voice input is not supported in this browser.', 'n8n-chat'),
            'voicePermissionDenied' => __('Microphone access denied.', 'n8n-chat'),

            // UI elements
            'typeMessage' => __('Type your message...', 'n8n-chat'),
            'send' => __('Send', 'n8n-chat'),
            'close' => __('Close', 'n8n-chat'),
            'minimize' => __('Minimize', 'n8n-chat'),
            'attachFile' => __('Attach file', 'n8n-chat'),
            'removeFile' => __('Remove file', 'n8n-chat'),
            'copyMessage' => __('Copy message', 'n8n-chat'),
            'copied' => __('Copied!', 'n8n-chat'),
            'startVoiceInput' => __('Start voice input', 'n8n-chat'),
            'stopVoiceInput' => __('Stop voice input', 'n8n-chat'),
            'openChat' => __('Open chat', 'n8n-chat'),
        ];
    }

    /**
     * Enqueue assets for a specific page
     *
     * @param string $page Page slug
     */
    public function enqueue_for_page(string $page): void {
        if (strpos($page, 'n8n-chat') !== false) {
            wp_enqueue_script('n8n-chat-admin');
            wp_enqueue_style('n8n-chat-admin');
        }
    }
}
