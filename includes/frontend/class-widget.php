<?php
/**
 * n8n Chat WordPress Widget
 *
 * Allows embedding chat in widget areas (sidebars).
 *
 * @package N8nChat
 */

namespace N8nChat\Frontend;

use N8nChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class N8nChat_Widget
 */
class N8nChat_Widget extends \WP_Widget {

    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct(
            'n8n_chat_widget',
            __('n8n Chat', 'n8n-chat'),
            [
                'description' => __('Display an AI chat widget powered by n8n.', 'n8n-chat'),
                'classname' => 'n8n-chat-widget',
            ]
        );
    }

    /**
     * Front-end display of widget
     *
     * @param array $args Widget arguments
     * @param array $instance Saved values from database
     */
    public function widget($args, $instance): void {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $instance_id = !empty($instance['instance_id']) ? $instance['instance_id'] : '';
        $height = !empty($instance['height']) ? $instance['height'] : '400px';
        $theme = !empty($instance['theme']) ? $instance['theme'] : 'light';
        $show_header = isset($instance['show_header']) ? (bool) $instance['show_header'] : true;

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Theme-provided widget wrapper markup
        echo $args['before_widget'];

        if ($title) {
            // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Theme-provided title wrapper markup
            echo $args['before_title'] . esc_html(apply_filters('widget_title', $title)) . $args['after_title'];
        }

        // Build shortcode
        $shortcode_atts = [];

        if ($instance_id) {
            $shortcode_atts[] = sprintf('id="%s"', esc_attr($instance_id));
        }

        $shortcode_atts[] = sprintf('height="%s"', esc_attr($height));
        $shortcode_atts[] = sprintf('theme="%s"', esc_attr($theme));
        $shortcode_atts[] = sprintf('show-header="%s"', $show_header ? 'true' : 'false');
        $shortcode_atts[] = 'mode="inline"';
        $shortcode_atts[] = 'width="100%"';

        $shortcode = '[n8n_chat' . implode(' ', $shortcode_atts) . ']';

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_shortcode() returns safe HTML
        echo do_shortcode($shortcode);

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Theme-provided widget wrapper markup
        echo $args['after_widget'];
    }

    /**
     * Back-end widget form
     *
     * @param array $instance Previously saved values from database
     */
    public function form($instance): void {
        $title = !empty($instance['title']) ? $instance['title'] : '';
        $instance_id = !empty($instance['instance_id']) ? $instance['instance_id'] : '';
        $height = !empty($instance['height']) ? $instance['height'] : '400px';
        $theme = !empty($instance['theme']) ? $instance['theme'] : 'light';
        $show_header = isset($instance['show_header']) ? (bool) $instance['show_header'] : true;

        // Get available instances
        $instance_manager = Instance_Manager::get_instance();
        $instances = $instance_manager->get_all_instances();
        ?>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('title')); ?>">
                <?php esc_html_e('Title:', 'n8n-chat'); ?>
            </label>
            <input
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('title')); ?>"
                name="<?php echo esc_attr($this->get_field_name('title')); ?>"
                type="text"
                value="<?php echo esc_attr($title); ?>"
            />
        </p>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('instance_id')); ?>">
                <?php esc_html_e('Chat Instance:', 'n8n-chat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('instance_id')); ?>"
                name="<?php echo esc_attr($this->get_field_name('instance_id')); ?>"
            >
                <option value=""><?php esc_html_e('— Select Instance —', 'n8n-chat'); ?></option>
                <?php foreach ($instances as $inst): ?>
                    <option value="<?php echo esc_attr($inst['id']); ?>" <?php selected($instance_id, $inst['id']); ?>>
                        <?php echo esc_html($inst['name']); ?>
                        <?php if (!$inst['isEnabled']): ?>
                            (<?php esc_html_e('disabled', 'n8n-chat'); ?>)
                        <?php endif; ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </p>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('height')); ?>">
                <?php esc_html_e('Height:', 'n8n-chat'); ?>
            </label>
            <input
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('height')); ?>"
                name="<?php echo esc_attr($this->get_field_name('height')); ?>"
                type="text"
                value="<?php echo esc_attr($height); ?>"
                placeholder="400px"
            />
            <small><?php esc_html_e('CSS value (e.g., 400px, 50vh)', 'n8n-chat'); ?></small>
        </p>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('theme')); ?>">
                <?php esc_html_e('Theme:', 'n8n-chat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('theme')); ?>"
                name="<?php echo esc_attr($this->get_field_name('theme')); ?>"
            >
                <option value="light" <?php selected($theme, 'light'); ?>><?php esc_html_e('Light', 'n8n-chat'); ?></option>
                <option value="dark" <?php selected($theme, 'dark'); ?>><?php esc_html_e('Dark', 'n8n-chat'); ?></option>
                <option value="auto" <?php selected($theme, 'auto'); ?>><?php esc_html_e('Auto (System)', 'n8n-chat'); ?></option>
            </select>
        </p>

        <p>
            <input
                class="checkbox"
                type="checkbox"
                id="<?php echo esc_attr($this->get_field_id('show_header')); ?>"
                name="<?php echo esc_attr($this->get_field_name('show_header')); ?>"
                <?php checked($show_header); ?>
            />
            <label for="<?php echo esc_attr($this->get_field_id('show_header')); ?>">
                <?php esc_html_e('Show chat header', 'n8n-chat'); ?>
            </label>
        </p>

        <?php if (empty($instances)): ?>
            <p class="description" style="color: #d63638;">
                <?php
                printf(
                    /* translators: %1$s: opening link tag, %2$s: closing link tag */
                    esc_html__('No chat instances found. %1$sCreate one first%2$s.', 'n8n-chat'),
                    '<a href="' . esc_url(admin_url('admin.php?page=n8n-chat-instances')) . '">',
                    '</a>'
                );
                ?>
            </p>
        <?php endif; ?>

        <?php
    }

    /**
     * Sanitize widget form values as they are saved
     *
     * @param array $new_instance Values just sent to be saved
     * @param array $old_instance Previously saved values from database
     * @return array Updated safe values
     */
    public function update($new_instance, $old_instance): array {
        $instance = [];

        $instance['title'] = !empty($new_instance['title'])
            ? sanitize_text_field($new_instance['title'])
            : '';

        $instance['instance_id'] = !empty($new_instance['instance_id'])
            ? sanitize_text_field($new_instance['instance_id'])
            : '';

        $instance['height'] = !empty($new_instance['height'])
            ? sanitize_text_field($new_instance['height'])
            : '400px';

        $instance['theme'] = !empty($new_instance['theme']) && in_array($new_instance['theme'], ['light', 'dark', 'auto'], true)
            ? $new_instance['theme']
            : 'light';

        $instance['show_header'] = !empty($new_instance['show_header']);

        return $instance;
    }
}

/**
 * Register the widget
 */
function n8n_chat_register_widget(): void {
    register_widget(N8nChat_Widget::class);
}
add_action('widgets_init', __NAMESPACE__ . '\n8n_chat_register_widget');
