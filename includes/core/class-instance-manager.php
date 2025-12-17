<?php
/**
 * Instance Manager
 *
 * Handles CRUD operations for chat instances.
 *
 * @package N8nChat
 */

namespace N8nChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Instance_Manager
 */
class Instance_Manager {

    /**
     * Option name for storing instances
     */
    private const OPTION_NAME = 'n8n_chat_instances';

    /**
     * Cache group
     */
    private const CACHE_GROUP = 'n8n_chat';

    /**
     * Cache key for instances
     */
    private const CACHE_KEY = 'instances';

    /**
     * Singleton instance
     */
    private static ?Instance_Manager $instance = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Instance_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Register hooks if needed
    }

    /**
     * Get all instances
     *
     * @return array
     */
    public function get_all_instances(): array {
        $cached = wp_cache_get(self::CACHE_KEY, self::CACHE_GROUP);

        if (false !== $cached) {
            return $cached;
        }

        $instances = get_option(self::OPTION_NAME, []);

        if (!is_array($instances)) {
            $instances = [];
        }

        wp_cache_set(self::CACHE_KEY, $instances, self::CACHE_GROUP, 3600);

        return $instances;
    }

    /**
     * Get a single instance by ID
     *
     * @param string $id Instance ID
     * @return array|null Instance data or null if not found
     */
    public function get(string $id): ?array {
        $instances = $this->get_all_instances();
        return $instances[$id] ?? null;
    }

    /**
     * Get the default instance
     *
     * @return array|null
     */
    public function get_default_instance(): ?array {
        $instances = $this->get_all_instances();

        foreach ($instances as $instance) {
            if (!empty($instance['isDefault']) && !empty($instance['isEnabled'])) {
                return $instance;
            }
        }

        // If no default, return first enabled instance
        foreach ($instances as $instance) {
            if (!empty($instance['isEnabled'])) {
                return $instance;
            }
        }

        return null;
    }

    /**
     * Create a new instance
     *
     * @param array $data Instance data
     * @return string New instance ID
     */
    public function create_instance(array $data): string {
        $id = 'inst_' . wp_generate_uuid4();

        $instance = array_merge(
            $this->get_defaults(),
            $data,
            [
                'id' => $id,
                'createdAt' => current_time('c'),
                'updatedAt' => current_time('c'),
            ]
        );

        // Sanitize the instance data
        $instance = $this->sanitize_instance($instance);

        $instances = $this->get_all_instances();
        $instances[$id] = $instance;

        $this->save_instances($instances);

        return $id;
    }

    /**
     * Update an existing instance
     *
     * @param string $id Instance ID
     * @param array $data Data to update
     * @return bool Success
     */
    public function update_instance(string $id, array $data): bool {
        $instances = $this->get_all_instances();

        if (!isset($instances[$id])) {
            return false;
        }

        // Don't allow changing the ID
        unset($data['id']);
        unset($data['createdAt']);

        $instances[$id] = array_merge(
            $instances[$id],
            $data,
            ['updatedAt' => current_time('c')]
        );

        // Sanitize
        $instances[$id] = $this->sanitize_instance($instances[$id]);

        // If this is being set as default, unset other defaults
        if (!empty($instances[$id]['isDefault'])) {
            foreach ($instances as $inst_id => &$inst) {
                if ($inst_id !== $id) {
                    $inst['isDefault'] = false;
                }
            }
        }

        return $this->save_instances($instances);
    }

    /**
     * Delete an instance
     *
     * @param string $id Instance ID
     * @return bool Success
     */
    public function delete_instance(string $id): bool {
        $instances = $this->get_all_instances();

        if (!isset($instances[$id])) {
            return false;
        }

        unset($instances[$id]);

        return $this->save_instances($instances);
    }

    /**
     * Duplicate an instance
     *
     * @param string $id Instance ID to duplicate
     * @return string|null New instance ID or null on failure
     */
    public function duplicate_instance(string $id): ?string {
        $instance = $this->get($id);

        if (!$instance) {
            return null;
        }

        // Prepare duplicate data
        $duplicate_data = $instance;
        unset($duplicate_data['id']);
        unset($duplicate_data['createdAt']);
        unset($duplicate_data['updatedAt']);

        $duplicate_data['name'] = $instance['name'] . ' (Copy)';
        $duplicate_data['isDefault'] = false;

        return $this->create_instance($duplicate_data);
    }

    /**
     * Get default instance configuration
     *
     * @return array
     */
    public function get_defaults(): array {
        return [
            'id' => '',
            'name' => __('New Chat', 'n8n-chat'),
            'webhookUrl' => '',
            'isEnabled' => false,
            'isDefault' => false,

            // Appearance
            'theme' => 'light',
            'colorSource' => 'custom',
            'primaryColor' => '#3b82f6',
            'stylePreset' => '',
            'customCss' => '',

            // Content
            'welcomeMessage' => __('Hi! 👋 How can I help you today?', 'n8n-chat'),
            'placeholderText' => __('Type your message...', 'n8n-chat'),
            'chatTitle' => __('Chat', 'n8n-chat'),
            'systemPrompt' => '',
            'suggestedPrompts' => [],

            // UI Options
            'showHeader' => true,
            'showTimestamp' => false,
            'showAvatar' => true,
            'avatarUrl' => '',

            // Bubble Mode
            'bubble' => [
                'enabled' => false,
                'showOnAllPages' => false, // Site-wide floating bubble
                'icon' => 'chat',
                'customIconUrl' => '',
                'text' => '',
                'position' => 'bottom-right',
                'offsetX' => 24,
                'offsetY' => 24,
                'size' => 'medium',
                'showUnreadBadge' => true,
                'pulseAnimation' => true,
            ],

            // Auto-Open
            'autoOpen' => [
                'enabled' => false,
                'trigger' => 'delay',
                'delay' => 5000,
                'scrollPercentage' => 50,
                'idleTime' => 30000,
                'conditions' => [
                    'oncePerSession' => true,
                    'oncePerDay' => false,
                    'skipIfInteracted' => true,
                    'loggedInOnly' => false,
                    'guestOnly' => false,
                    'excludeMobile' => false,
                ],
            ],

            // URL-Based Targeting
            'targeting' => [
                'enabled' => false,
                'priority' => 0,
                'rules' => [],
            ],

            // Access Control
            'access' => [
                'requireLogin' => false,
                'allowedRoles' => [],
                'deniedMessage' => __('Please log in to use this chat.', 'n8n-chat'),
            ],

            // Features
            'features' => [
                'fileUpload' => false,
                'fileTypes' => ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
                'maxFileSize' => 10485760, // 10MB
                'voiceInput' => true,
                'showTypingIndicator' => true,
                'enableHistory' => true,
                'enableFeedback' => false,
            ],

            // Fallback
            'fallback' => [
                'enabled' => true,
                'email' => '',
                'message' => __('Our chat is temporarily unavailable. Please leave a message.', 'n8n-chat'),
            ],

            // Metadata
            'createdAt' => '',
            'updatedAt' => '',
        ];
    }

    /**
     * Sanitize instance data
     *
     * @param array $instance Instance data
     * @return array Sanitized data
     */
    private function sanitize_instance(array $instance): array {
        // Text fields
        $instance['name'] = sanitize_text_field($instance['name'] ?? '');
        $instance['webhookUrl'] = esc_url_raw($instance['webhookUrl'] ?? '');
        $instance['chatTitle'] = sanitize_text_field($instance['chatTitle'] ?? '');
        $instance['welcomeMessage'] = sanitize_textarea_field($instance['welcomeMessage'] ?? '');
        $instance['placeholderText'] = sanitize_text_field($instance['placeholderText'] ?? '');
        $instance['systemPrompt'] = sanitize_textarea_field($instance['systemPrompt'] ?? '');
        $instance['customCss'] = wp_strip_all_tags($instance['customCss'] ?? '');

        // Booleans
        $instance['isEnabled'] = (bool) ($instance['isEnabled'] ?? false);
        $instance['isDefault'] = (bool) ($instance['isDefault'] ?? false);
        $instance['showHeader'] = (bool) ($instance['showHeader'] ?? true);
        $instance['showTimestamp'] = (bool) ($instance['showTimestamp'] ?? false);
        $instance['showAvatar'] = (bool) ($instance['showAvatar'] ?? true);

        // Colors
        if (!empty($instance['primaryColor'])) {
            $instance['primaryColor'] = sanitize_hex_color($instance['primaryColor']) ?: '#3b82f6';
        }

        // Theme
        $valid_themes = ['light', 'dark', 'auto'];
        if (!in_array($instance['theme'] ?? '', $valid_themes, true)) {
            $instance['theme'] = 'light';
        }

        // Bubble settings
        if (isset($instance['bubble']) && is_array($instance['bubble'])) {
            $instance['bubble']['enabled'] = (bool) ($instance['bubble']['enabled'] ?? false);
            $instance['bubble']['offsetX'] = absint($instance['bubble']['offsetX'] ?? 24);
            $instance['bubble']['offsetY'] = absint($instance['bubble']['offsetY'] ?? 24);

            $valid_positions = ['bottom-right', 'bottom-left'];
            if (!in_array($instance['bubble']['position'] ?? '', $valid_positions, true)) {
                $instance['bubble']['position'] = 'bottom-right';
            }

            $valid_sizes = ['small', 'medium', 'large'];
            if (!in_array($instance['bubble']['size'] ?? '', $valid_sizes, true)) {
                $instance['bubble']['size'] = 'medium';
            }
        }

        // Access settings
        if (isset($instance['access']) && is_array($instance['access'])) {
            $instance['access']['requireLogin'] = (bool) ($instance['access']['requireLogin'] ?? false);

            if (isset($instance['access']['allowedRoles']) && is_array($instance['access']['allowedRoles'])) {
                $instance['access']['allowedRoles'] = array_map('sanitize_text_field', $instance['access']['allowedRoles']);
            }
        }

        // Features
        if (isset($instance['features']) && is_array($instance['features'])) {
            $instance['features']['fileUpload'] = (bool) ($instance['features']['fileUpload'] ?? false);
            $instance['features']['maxFileSize'] = absint($instance['features']['maxFileSize'] ?? 10485760);
            $instance['features']['showTypingIndicator'] = (bool) ($instance['features']['showTypingIndicator'] ?? true);
            $instance['features']['enableHistory'] = (bool) ($instance['features']['enableHistory'] ?? true);
            $instance['features']['enableFeedback'] = (bool) ($instance['features']['enableFeedback'] ?? false);
        }

        return $instance;
    }

    /**
     * Save instances to database
     *
     * @param array $instances All instances
     * @return bool Success
     */
    private function save_instances(array $instances): bool {
        wp_cache_delete(self::CACHE_KEY, self::CACHE_GROUP);
        return update_option(self::OPTION_NAME, $instances);
    }

    /**
     * Get instances that match URL-based targeting rules for a given URL
     *
     * @param string $url URL to match
     * @return array Matching instances sorted by priority
     */
    public function get_instances_for_url(string $url): array {
        $instances = $this->get_all_instances();
        $matches = [];

        foreach ($instances as $instance) {
            if (empty($instance['isEnabled'])) {
                continue;
            }

            if (empty($instance['targeting']['enabled'])) {
                continue;
            }

            if ($this->instance_matches_url($instance, $url)) {
                $matches[] = $instance;
            }
        }

        // Sort by priority (higher first)
        usort($matches, function($a, $b) {
            return ($b['targeting']['priority'] ?? 0) - ($a['targeting']['priority'] ?? 0);
        });

        return $matches;
    }

    /**
     * Check if an instance's targeting rules match a URL
     *
     * @param array $instance Instance data
     * @param string $url URL to check
     * @return bool
     */
    private function instance_matches_url(array $instance, string $url): bool {
        $rules = $instance['targeting']['rules'] ?? [];

        if (empty($rules)) {
            return false;
        }

        foreach ($rules as $rule) {
            if ($this->rule_matches($rule, $url)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a single rule matches
     *
     * @param array $rule Rule configuration
     * @param string $url URL to check
     * @return bool
     */
    private function rule_matches(array $rule, string $url): bool {
        $type = $rule['type'] ?? '';
        $condition = $rule['condition'] ?? 'contains';
        $value = $rule['value'] ?? '';

        if ($type !== 'url_pattern' || empty($value)) {
            return false;
        }

        $url_path = wp_parse_url($url, PHP_URL_PATH) ?: '/';

        switch ($condition) {
            case 'equals':
                return $url_path === $value;

            case 'starts_with':
                return str_starts_with($url_path, $value);

            case 'ends_with':
                return str_ends_with($url_path, $value);

            case 'contains':
                return str_contains($url_path, $value);

            case 'wildcard':
                $pattern = str_replace(['*', '?'], ['.*', '.'], preg_quote($value, '/'));
                return (bool) preg_match('/^' . $pattern . '$/i', $url_path);

            default:
                return false;
        }
    }

    /**
     * Test webhook connection
     *
     * @param string $webhook_url Webhook URL to test
     * @return array Result with 'success' and 'message' keys
     */
    public function test_webhook(string $webhook_url): array {
        if (empty($webhook_url)) {
            return [
                'success' => false,
                'message' => __('Webhook URL is required.', 'n8n-chat'),
            ];
        }

        $response = wp_remote_post($webhook_url, [
            'timeout' => 10,
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode([
                'action' => 'test',
                'source' => 'n8n-chat',
                'timestamp' => current_time('c'),
            ]),
        ]);

        if (is_wp_error($response)) {
            return [
                'success' => false,
                'message' => $response->get_error_message(),
            ];
        }

        $code = wp_remote_retrieve_response_code($response);

        if ($code >= 200 && $code < 300) {
            return [
                'success' => true,
                'message' => __('Connection successful!', 'n8n-chat'),
                'status_code' => $code,
            ];
        }

        return [
            'success' => false,
            'message' => sprintf(
                /* translators: %d: HTTP status code */
                __('Connection failed with status code: %d', 'n8n-chat'),
                $code
            ),
            'status_code' => $code,
        ];
    }
}
