<?php
/**
 * Template Manager for FlowChat
 *
 * Manages starter templates and style presets for chat instances.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Template Manager class
 */
class Template_Manager {

    /**
     * Singleton instance
     */
    private static ?Template_Manager $instance = null;

    /**
     * Built-in templates
     */
    private array $templates = [];

    /**
     * Style presets
     */
    private array $style_presets = [];

    /**
     * Get singleton instance
     */
    public static function get_instance(): Template_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->load_templates();
        $this->load_style_presets();
    }

    /**
     * Load built-in templates
     */
    private function load_templates(): void {
        $this->templates = [
            'customer_support' => [
                'id' => 'customer_support',
                'name' => 'Customer Support',
                'description' => 'Professional customer service chat with helpful tone',
                'category' => 'business',
                'icon' => 'headset',
                'config' => [
                    'title' => 'Customer Support',
                    'welcome_message' => 'Hello! How can I help you today?',
                    'placeholder' => 'Type your question...',
                    'system_prompt' => 'You are a helpful customer support agent for {site_name}. Be professional, friendly, and solution-oriented. If you cannot resolve an issue, offer to escalate to a human agent.',
                    'primary_color' => '#2563eb',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                    'enable_file_upload' => false,
                    'fallback_enabled' => true,
                ],
            ],

            'sales_assistant' => [
                'id' => 'sales_assistant',
                'name' => 'Sales Assistant',
                'description' => 'Product recommendations and sales inquiries',
                'category' => 'business',
                'icon' => 'shopping-cart',
                'config' => [
                    'title' => 'Sales Assistant',
                    'welcome_message' => 'Hi there! Looking for something specific? I can help you find the perfect product.',
                    'placeholder' => 'What are you looking for?',
                    'system_prompt' => 'You are a knowledgeable sales assistant for {site_name}. Help customers find products, answer questions about features and pricing, and guide them through the purchase process. Be helpful without being pushy.',
                    'primary_color' => '#16a34a',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                    'enable_file_upload' => false,
                ],
            ],

            'technical_support' => [
                'id' => 'technical_support',
                'name' => 'Technical Support',
                'description' => 'Technical troubleshooting and documentation',
                'category' => 'business',
                'icon' => 'wrench',
                'config' => [
                    'title' => 'Tech Support',
                    'welcome_message' => 'Hello! I\'m here to help with technical issues. What seems to be the problem?',
                    'placeholder' => 'Describe your issue...',
                    'system_prompt' => 'You are a technical support specialist for {site_name}. Help users troubleshoot technical problems step by step. Ask clarifying questions when needed. Provide clear, numbered instructions. If an issue requires escalation, explain what information to gather.',
                    'primary_color' => '#7c3aed',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                    'enable_file_upload' => true,
                    'allowed_file_types' => ['image/png', 'image/jpeg', 'image/gif', 'application/pdf', 'text/plain'],
                ],
            ],

            'appointment_booking' => [
                'id' => 'appointment_booking',
                'name' => 'Appointment Booking',
                'description' => 'Schedule appointments and manage bookings',
                'category' => 'business',
                'icon' => 'calendar',
                'config' => [
                    'title' => 'Book an Appointment',
                    'welcome_message' => 'Hello! I can help you schedule an appointment. What service are you interested in?',
                    'placeholder' => 'Tell me what you need...',
                    'system_prompt' => 'You are an appointment scheduling assistant for {site_name}. Help customers book appointments by gathering necessary information: service type, preferred date/time, contact details. Confirm all details before finalizing.',
                    'primary_color' => '#0891b2',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => false,
                ],
            ],

            'lead_generation' => [
                'id' => 'lead_generation',
                'name' => 'Lead Generation',
                'description' => 'Capture leads and qualify prospects',
                'category' => 'marketing',
                'icon' => 'users',
                'config' => [
                    'title' => 'Let\'s Chat',
                    'welcome_message' => 'Hi! I\'d love to learn more about your needs. What brings you here today?',
                    'placeholder' => 'Share your thoughts...',
                    'system_prompt' => 'You are a friendly assistant helping qualify leads for {site_name}. Engage visitors in conversation, understand their needs, and collect contact information naturally. Ask about their challenges, timeline, and budget when appropriate.',
                    'primary_color' => '#ea580c',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => false,
                    'fallback_enabled' => true,
                ],
            ],

            'faq_bot' => [
                'id' => 'faq_bot',
                'name' => 'FAQ Bot',
                'description' => 'Answer common questions automatically',
                'category' => 'support',
                'icon' => 'help-circle',
                'config' => [
                    'title' => 'Quick Answers',
                    'welcome_message' => 'Hello! I can answer common questions about {site_name}. What would you like to know?',
                    'placeholder' => 'Ask a question...',
                    'system_prompt' => 'You are an FAQ assistant for {site_name}. Answer common questions concisely and accurately. If a question is outside your knowledge, suggest contacting support directly.',
                    'primary_color' => '#6366f1',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => false,
                ],
            ],

            'onboarding_guide' => [
                'id' => 'onboarding_guide',
                'name' => 'Onboarding Guide',
                'description' => 'Guide new users through your product',
                'category' => 'support',
                'icon' => 'compass',
                'config' => [
                    'title' => 'Getting Started',
                    'welcome_message' => 'Welcome to {site_name}! I\'m here to help you get started. What would you like to learn about first?',
                    'placeholder' => 'What do you want to know?',
                    'system_prompt' => 'You are an onboarding assistant for {site_name}. Help new users understand how to use the product/service. Provide step-by-step guidance, explain features, and answer questions. Be encouraging and patient.',
                    'primary_color' => '#14b8a6',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                ],
            ],

            'feedback_collector' => [
                'id' => 'feedback_collector',
                'name' => 'Feedback Collector',
                'description' => 'Gather user feedback and suggestions',
                'category' => 'marketing',
                'icon' => 'message-square',
                'config' => [
                    'title' => 'Share Feedback',
                    'welcome_message' => 'We\'d love to hear from you! Share your thoughts, suggestions, or report any issues.',
                    'placeholder' => 'Share your feedback...',
                    'system_prompt' => 'You are a feedback collection assistant for {site_name}. Encourage users to share detailed feedback. Ask follow-up questions to understand their experience better. Thank them for their input and explain how it helps improve the service.',
                    'primary_color' => '#f59e0b',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => false,
                ],
            ],

            'ecommerce_helper' => [
                'id' => 'ecommerce_helper',
                'name' => 'E-commerce Helper',
                'description' => 'WooCommerce-optimized shopping assistant',
                'category' => 'ecommerce',
                'icon' => 'shopping-bag',
                'config' => [
                    'title' => 'Shopping Assistant',
                    'welcome_message' => 'Hi! I can help you find products, check order status, or answer questions about shipping and returns.',
                    'placeholder' => 'How can I help you shop?',
                    'system_prompt' => 'You are a shopping assistant for {site_name}. Help customers find products, provide information about {woo_cart_items} items in their cart worth {woo_cart_total}, and answer questions about orders, shipping, and returns. Current user has {woo_order_count} previous orders.',
                    'primary_color' => '#8b5cf6',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                ],
            ],

            'internal_wiki' => [
                'id' => 'internal_wiki',
                'name' => 'Internal Wiki',
                'description' => 'Internal knowledge base for team members',
                'category' => 'internal',
                'icon' => 'book-open',
                'config' => [
                    'title' => 'Knowledge Base',
                    'welcome_message' => 'Hello {user_name}! How can I help you find information today?',
                    'placeholder' => 'Search our knowledge base...',
                    'system_prompt' => 'You are an internal knowledge assistant for {site_name}. Help team members find information, documentation, and answers to common questions. The current user is {user_name} with role {user_role}.',
                    'primary_color' => '#475569',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                    'enable_history' => true,
                    'require_login' => true,
                ],
            ],

            'blank' => [
                'id' => 'blank',
                'name' => 'Blank Template',
                'description' => 'Start from scratch with minimal defaults',
                'category' => 'basic',
                'icon' => 'file',
                'config' => [
                    'title' => 'Chat',
                    'welcome_message' => 'Hello! How can I help you?',
                    'placeholder' => 'Type a message...',
                    'system_prompt' => '',
                    'primary_color' => '#3b82f6',
                    'theme' => 'light',
                    'position' => 'bottom-right',
                ],
            ],
        ];

        // Allow filtering templates
        $this->templates = apply_filters('flowchat_templates', $this->templates);
    }

    /**
     * Load style presets
     */
    private function load_style_presets(): void {
        // Load from JSON file if exists
        $presets_file = FLOWCHAT_PLUGIN_DIR . 'assets/style-presets.json';
        if (file_exists($presets_file)) {
            $json = file_get_contents($presets_file);
            $presets = json_decode($json, true);
            if (is_array($presets)) {
                $this->style_presets = $presets;
                return;
            }
        }

        // Default presets
        $this->style_presets = [
            'default' => [
                'id' => 'default',
                'name' => 'Default',
                'description' => 'Clean, modern appearance',
                'styles' => [
                    'primary_color' => '#3b82f6',
                    'secondary_color' => '#1e40af',
                    'background_color' => '#ffffff',
                    'text_color' => '#1f2937',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, -apple-system, sans-serif',
                ],
            ],

            'minimal' => [
                'id' => 'minimal',
                'name' => 'Minimal',
                'description' => 'Simple, distraction-free design',
                'styles' => [
                    'primary_color' => '#000000',
                    'secondary_color' => '#333333',
                    'background_color' => '#ffffff',
                    'text_color' => '#000000',
                    'border_radius' => '4px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'dark' => [
                'id' => 'dark',
                'name' => 'Dark Mode',
                'description' => 'Dark theme for low-light environments',
                'styles' => [
                    'primary_color' => '#60a5fa',
                    'secondary_color' => '#3b82f6',
                    'background_color' => '#1f2937',
                    'text_color' => '#f9fafb',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'rounded' => [
                'id' => 'rounded',
                'name' => 'Rounded',
                'description' => 'Soft, friendly appearance with rounded corners',
                'styles' => [
                    'primary_color' => '#8b5cf6',
                    'secondary_color' => '#7c3aed',
                    'background_color' => '#ffffff',
                    'text_color' => '#1f2937',
                    'border_radius' => '24px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'corporate' => [
                'id' => 'corporate',
                'name' => 'Corporate',
                'description' => 'Professional, business-oriented design',
                'styles' => [
                    'primary_color' => '#0f172a',
                    'secondary_color' => '#1e293b',
                    'background_color' => '#f8fafc',
                    'text_color' => '#0f172a',
                    'border_radius' => '8px',
                    'font_family' => '"Inter", system-ui, sans-serif',
                ],
            ],

            'playful' => [
                'id' => 'playful',
                'name' => 'Playful',
                'description' => 'Fun, colorful design for casual interactions',
                'styles' => [
                    'primary_color' => '#ec4899',
                    'secondary_color' => '#db2777',
                    'background_color' => '#fdf4ff',
                    'text_color' => '#701a75',
                    'border_radius' => '20px',
                    'font_family' => '"Nunito", system-ui, sans-serif',
                ],
            ],

            'nature' => [
                'id' => 'nature',
                'name' => 'Nature',
                'description' => 'Earth tones and organic feel',
                'styles' => [
                    'primary_color' => '#059669',
                    'secondary_color' => '#047857',
                    'background_color' => '#f0fdf4',
                    'text_color' => '#14532d',
                    'border_radius' => '16px',
                    'font_family' => '"Lato", system-ui, sans-serif',
                ],
            ],

            'ocean' => [
                'id' => 'ocean',
                'name' => 'Ocean',
                'description' => 'Calm, blue-themed design',
                'styles' => [
                    'primary_color' => '#0891b2',
                    'secondary_color' => '#0e7490',
                    'background_color' => '#ecfeff',
                    'text_color' => '#164e63',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],

            'sunset' => [
                'id' => 'sunset',
                'name' => 'Sunset',
                'description' => 'Warm orange and red tones',
                'styles' => [
                    'primary_color' => '#ea580c',
                    'secondary_color' => '#c2410c',
                    'background_color' => '#fff7ed',
                    'text_color' => '#7c2d12',
                    'border_radius' => '12px',
                    'font_family' => 'system-ui, sans-serif',
                ],
            ],
        ];

        // Allow filtering presets
        $this->style_presets = apply_filters('flowchat_style_presets', $this->style_presets);
    }

    /**
     * Get all templates
     *
     * @return array
     */
    public function get_templates(): array {
        return $this->templates;
    }

    /**
     * Get templates by category
     *
     * @param string $category Category slug
     * @return array
     */
    public function get_templates_by_category(string $category): array {
        return array_filter(
            $this->templates,
            fn($template) => $template['category'] === $category
        );
    }

    /**
     * Get template by ID
     *
     * @param string $id Template ID
     * @return array|null
     */
    public function get_template(string $id): ?array {
        return $this->templates[$id] ?? null;
    }

    /**
     * Get all style presets
     *
     * @return array
     */
    public function get_style_presets(): array {
        return $this->style_presets;
    }

    /**
     * Get style preset by ID
     *
     * @param string $id Preset ID
     * @return array|null
     */
    public function get_style_preset(string $id): ?array {
        return $this->style_presets[$id] ?? null;
    }

    /**
     * Get template categories
     *
     * @return array
     */
    public function get_categories(): array {
        return [
            'basic' => [
                'name' => 'Basic',
                'description' => 'Simple starting points',
            ],
            'business' => [
                'name' => 'Business',
                'description' => 'Customer-facing business use cases',
            ],
            'support' => [
                'name' => 'Support',
                'description' => 'Help and support scenarios',
            ],
            'marketing' => [
                'name' => 'Marketing',
                'description' => 'Lead generation and engagement',
            ],
            'ecommerce' => [
                'name' => 'E-commerce',
                'description' => 'Online store integrations',
            ],
            'internal' => [
                'name' => 'Internal',
                'description' => 'Team and internal use',
            ],
        ];
    }

    /**
     * Apply template to instance config
     *
     * @param string $template_id Template ID
     * @param array  $overrides Config overrides
     * @return array Instance configuration
     */
    public function apply_template(string $template_id, array $overrides = []): array {
        $template = $this->get_template($template_id);

        if (!$template) {
            $template = $this->get_template('blank');
        }

        $config = $template['config'];

        // Merge overrides
        return array_merge($config, $overrides);
    }

    /**
     * Apply style preset to instance config
     *
     * @param string $preset_id Preset ID
     * @param array  $config Existing config
     * @return array Updated configuration
     */
    public function apply_style_preset(string $preset_id, array $config): array {
        $preset = $this->get_style_preset($preset_id);

        if (!$preset) {
            return $config;
        }

        return array_merge($config, $preset['styles']);
    }

    /**
     * Save custom template
     *
     * @param array $template Template data
     * @return bool
     */
    public function save_custom_template(array $template): bool {
        $custom_templates = get_option('flowchat_custom_templates', []);

        $id = sanitize_key($template['id'] ?? wp_generate_uuid4());
        $template['id'] = $id;
        $template['custom'] = true;

        $custom_templates[$id] = $template;

        return update_option('flowchat_custom_templates', $custom_templates);
    }

    /**
     * Delete custom template
     *
     * @param string $id Template ID
     * @return bool
     */
    public function delete_custom_template(string $id): bool {
        $custom_templates = get_option('flowchat_custom_templates', []);

        if (!isset($custom_templates[$id])) {
            return false;
        }

        unset($custom_templates[$id]);

        return update_option('flowchat_custom_templates', $custom_templates);
    }

    /**
     * Get all templates including custom ones
     *
     * @return array
     */
    public function get_all_templates(): array {
        $custom_templates = get_option('flowchat_custom_templates', []);
        return array_merge($this->templates, $custom_templates);
    }

    /**
     * Export template to JSON
     *
     * @param string $id Template ID
     * @return string|null JSON string or null
     */
    public function export_template(string $id): ?string {
        $templates = $this->get_all_templates();
        $template = $templates[$id] ?? null;

        if (!$template) {
            return null;
        }

        return wp_json_encode($template, JSON_PRETTY_PRINT);
    }

    /**
     * Import template from JSON
     *
     * @param string $json JSON string
     * @return array|null Imported template or null on error
     */
    public function import_template(string $json): ?array {
        $template = json_decode($json, true);

        if (!is_array($template) || empty($template['config'])) {
            return null;
        }

        // Generate new ID to prevent conflicts
        $template['id'] = wp_generate_uuid4();
        $template['custom'] = true;
        $template['imported'] = true;
        $template['imported_at'] = current_time('mysql');

        if ($this->save_custom_template($template)) {
            return $template;
        }

        return null;
    }
}
