<?php
/**
 * n8n Chat Elementor Widget
 *
 * Native Elementor integration for n8n Chat.
 *
 * @package N8nChat
 */

namespace N8nChat\Integrations;

use N8nChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Check if Elementor is active
 */
function n8n_chat_is_elementor_active(): bool {
    return did_action('elementor/loaded');
}

/**
 * Register Elementor widget
 */
function n8n_chat_register_elementor_widget($widgets_manager): void {
    $widgets_manager->register(new N8nChat_Elementor_Widget());
}

/**
 * Register widget category
 */
function n8n_chat_add_elementor_category($elements_manager): void {
    $elements_manager->add_category(
        'n8n-chat',
        [
            'title' => __('n8n Chat', 'n8n-chat'),
            'icon' => 'fa fa-comments',
        ]
    );
}

/**
 * Initialize Elementor integration
 */
function n8n_chat_init_elementor(): void {
    if (!n8n_chat_is_elementor_active()) {
        return;
    }

    // Add category
    add_action('elementor/elements/categories_registered', __NAMESPACE__ . '\n8n_chat_add_elementor_category');

    // Register widget
    add_action('elementor/widgets/register', __NAMESPACE__ . '\n8n_chat_register_elementor_widget');
}
add_action('init', __NAMESPACE__ . '\n8n_chat_init_elementor');

/**
 * n8n Chat Elementor Widget Class
 */
class N8nChat_Elementor_Widget extends \Elementor\Widget_Base {

    /**
     * Get widget name
     */
    public function get_name(): string {
        return 'n8n-chat';
    }

    /**
     * Get widget title
     */
    public function get_title(): string {
        return __('n8n Chat', 'n8n-chat');
    }

    /**
     * Get widget icon
     */
    public function get_icon(): string {
        return 'eicon-comments';
    }

    /**
     * Get widget categories
     */
    public function get_categories(): array {
        return ['n8n-chat', 'general'];
    }

    /**
     * Get widget keywords
     */
    public function get_keywords(): array {
        return ['chat', 'ai', 'n8n', 'assistant', 'support', 'bot', 'n8n-chat'];
    }

    /**
     * Register widget controls
     */
    protected function register_controls(): void {
        // Get available instances
        $instance_manager = Instance_Manager::get_instance();
        $instances = $instance_manager->get_all_instances();

        $instance_options = ['' => __('— Select Instance —', 'n8n-chat')];
        foreach ($instances as $instance) {
            $label = $instance['name'];
            if (!$instance['isEnabled']) {
                $label .= ' (' . __('disabled', 'n8n-chat') . ')';
            }
            $instance_options[$instance['id']] = $label;
        }

        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Chat Settings', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'instance_id',
            [
                'label' => __('Chat Instance', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => '',
                'options' => $instance_options,
            ]
        );

        $this->add_control(
            'display_mode',
            [
                'label' => __('Display Mode', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'inline',
                'options' => [
                    'inline' => __('Inline', 'n8n-chat'),
                    'bubble' => __('Bubble', 'n8n-chat'),
                    'fullscreen' => __('Fullscreen', 'n8n-chat'),
                ],
            ]
        );

        $this->add_control(
            'theme',
            [
                'label' => __('Theme', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'light',
                'options' => [
                    'light' => __('Light', 'n8n-chat'),
                    'dark' => __('Dark', 'n8n-chat'),
                    'auto' => __('Auto (System)', 'n8n-chat'),
                ],
            ]
        );

        $this->end_controls_section();

        // Dimensions Section (for inline mode)
        $this->start_controls_section(
            'dimensions_section',
            [
                'label' => __('Dimensions', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
                'condition' => [
                    'display_mode' => 'inline',
                ],
            ]
        );

        $this->add_responsive_control(
            'width',
            [
                'label' => __('Width', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', '%', 'vw'],
                'range' => [
                    'px' => ['min' => 200, 'max' => 1200],
                    '%' => ['min' => 10, 'max' => 100],
                    'vw' => ['min' => 10, 'max' => 100],
                ],
                'default' => [
                    'unit' => '%',
                    'size' => 100,
                ],
                'selectors' => [
                    '{{WRAPPER}} .n8n-chat-container' => 'width: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_responsive_control(
            'height',
            [
                'label' => __('Height', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', 'vh'],
                'range' => [
                    'px' => ['min' => 200, 'max' => 1000],
                    'vh' => ['min' => 20, 'max' => 100],
                ],
                'default' => [
                    'unit' => 'px',
                    'size' => 500,
                ],
                'selectors' => [
                    '{{WRAPPER}} .n8n-chat-container' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();

        // Content Overrides Section
        $this->start_controls_section(
            'overrides_section',
            [
                'label' => __('Content Overrides', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'title_override',
            [
                'label' => __('Title', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'placeholder' => __('Leave empty for default', 'n8n-chat'),
            ]
        );

        $this->add_control(
            'welcome_override',
            [
                'label' => __('Welcome Message', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::TEXTAREA,
                'placeholder' => __('Leave empty for default', 'n8n-chat'),
            ]
        );

        $this->add_control(
            'placeholder_override',
            [
                'label' => __('Input Placeholder', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::TEXT,
                'placeholder' => __('Leave empty for default', 'n8n-chat'),
            ]
        );

        $this->end_controls_section();

        // Bubble Settings Section
        $this->start_controls_section(
            'bubble_section',
            [
                'label' => __('Bubble Settings', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
                'condition' => [
                    'display_mode' => 'bubble',
                ],
            ]
        );

        $this->add_control(
            'bubble_position',
            [
                'label' => __('Position', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'bottom-right',
                'options' => [
                    'bottom-right' => __('Bottom Right', 'n8n-chat'),
                    'bottom-left' => __('Bottom Left', 'n8n-chat'),
                ],
            ]
        );

        $this->add_control(
            'auto_open',
            [
                'label' => __('Auto Open', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => '',
            ]
        );

        $this->add_control(
            'auto_open_delay',
            [
                'label' => __('Auto Open Delay (ms)', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::NUMBER,
                'default' => 3000,
                'min' => 0,
                'max' => 30000,
                'step' => 500,
                'condition' => [
                    'auto_open' => 'yes',
                ],
            ]
        );

        $this->end_controls_section();

        // Display Options Section
        $this->start_controls_section(
            'display_options_section',
            [
                'label' => __('Display Options', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'show_header',
            [
                'label' => __('Show Header', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_timestamp',
            [
                'label' => __('Show Timestamps', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->add_control(
            'show_avatar',
            [
                'label' => __('Show Avatars', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Access Control Section
        $this->start_controls_section(
            'access_section',
            [
                'label' => __('Access Control', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'require_login',
            [
                'label' => __('Require Login', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => '',
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'n8n-chat'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'selectors' => [
                    '{{WRAPPER}} .n8n-chat-container' => '--n8n-chat-primary: {{VALUE}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Border::get_type(),
            [
                'name' => 'border',
                'selector' => '{{WRAPPER}} .n8n-chat-container',
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'n8n-chat'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .n8n-chat-container' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->add_group_control(
            \Elementor\Group_Control_Box_Shadow::get_type(),
            [
                'name' => 'box_shadow',
                'selector' => '{{WRAPPER}} .n8n-chat-container',
            ]
        );

        $this->end_controls_section();
    }

    /**
     * Render widget output
     */
    protected function render(): void {
        $settings = $this->get_settings_for_display();

        // Build shortcode attributes
        $shortcode_atts = [];

        if (!empty($settings['instance_id'])) {
            $shortcode_atts[] = sprintf('id="%s"', esc_attr($settings['instance_id']));
        }

        $shortcode_atts[] = sprintf('mode="%s"', esc_attr($settings['display_mode']));
        $shortcode_atts[] = sprintf('theme="%s"', esc_attr($settings['theme']));

        if ($settings['display_mode'] === 'inline') {
            if (!empty($settings['width']['size'])) {
                $shortcode_atts[] = sprintf('width="%s%s"', $settings['width']['size'], $settings['width']['unit']);
            }
            if (!empty($settings['height']['size'])) {
                $shortcode_atts[] = sprintf('height="%s%s"', $settings['height']['size'], $settings['height']['unit']);
            }
        }

        if ($settings['display_mode'] === 'fullscreen') {
            $shortcode_atts[] = 'fullscreen="true"';
        }

        if (!empty($settings['title_override'])) {
            $shortcode_atts[] = sprintf('title="%s"', esc_attr($settings['title_override']));
        }

        if (!empty($settings['welcome_override'])) {
            $shortcode_atts[] = sprintf('welcome="%s"', esc_attr($settings['welcome_override']));
        }

        if (!empty($settings['placeholder_override'])) {
            $shortcode_atts[] = sprintf('placeholder="%s"', esc_attr($settings['placeholder_override']));
        }

        if ($settings['display_mode'] === 'bubble') {
            $shortcode_atts[] = sprintf('position="%s"', esc_attr($settings['bubble_position']));

            if ($settings['auto_open'] === 'yes') {
                $shortcode_atts[] = 'auto-open="true"';
                $shortcode_atts[] = sprintf('auto-open-delay="%d"', intval($settings['auto_open_delay']));
            }
        }

        $shortcode_atts[] = sprintf('show-header="%s"', $settings['show_header'] === 'yes' ? 'true' : 'false');
        $shortcode_atts[] = sprintf('show-timestamp="%s"', $settings['show_timestamp'] === 'yes' ? 'true' : 'false');
        $shortcode_atts[] = sprintf('show-avatar="%s"', $settings['show_avatar'] === 'yes' ? 'true' : 'false');

        if ($settings['require_login'] === 'yes') {
            $shortcode_atts[] = 'require-login="true"';
        }

        // Build and render shortcode
        $shortcode = '[n8n_chat' . implode(' ', $shortcode_atts) . ']';

        echo '<div class="n8n-chat-elementor-widget">';
        echo do_shortcode($shortcode);
        echo '</div>';
    }

    /**
     * Render widget output in editor
     */
    protected function content_template(): void {
        ?>
        <#
        var instanceName = settings.instance_id || '<?php esc_html_e('No instance selected', 'n8n-chat'); ?>';
        var mode = settings.display_mode || 'inline';
        #>
        <div class="n8n-chat-elementor-preview">
            <div class="n8n-chat-elementor-preview-header">
                <span class="n8n-chat-elementor-preview-icon">💬</span>
                <span class="n8n-chat-elementor-preview-title">n8n Chat</span>
                <span class="n8n-chat-elementor-preview-mode">{{{ mode }}}</span>
            </div>
            <div class="n8n-chat-elementor-preview-body">
                <p class="n8n-chat-elementor-preview-instance">
                    <# if (settings.instance_id) { #>
                        <?php esc_html_e('Instance:', 'n8n-chat'); ?> {{{ settings.instance_id }}}
                    <# } else { #>
                        <?php esc_html_e('Please select a chat instance', 'n8n-chat'); ?>
                    <# } #>
                </p>
                <# if (settings.title_override) { #>
                    <p><?php esc_html_e('Title:', 'n8n-chat'); ?> {{{ settings.title_override }}}</p>
                <# } #>
            </div>
        </div>
        <?php
    }
}
