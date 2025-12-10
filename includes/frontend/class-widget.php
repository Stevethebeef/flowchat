<?php
/**
 * FlowChat WordPress Widget
 *
 * Allows embedding chat in widget areas (sidebars).
 *
 * @package FlowChat
 */

namespace FlowChat\Frontend;

use FlowChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class FlowChat_Widget
 */
class FlowChat_Widget extends \WP_Widget {

    /**
     * Constructor
     */
    public function __construct() {
        parent::__construct(
            'flowchat_widget',
            __('FlowChat', 'flowchat'),
            [
                'description' => __('Display an AI chat widget powered by n8n.', 'flowchat'),
                'classname' => 'flowchat-widget',
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

        echo $args['before_widget'];

        if ($title) {
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

        $shortcode = '[flowchat ' . implode(' ', $shortcode_atts) . ']';

        echo do_shortcode($shortcode);

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
                <?php esc_html_e('Title:', 'flowchat'); ?>
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
                <?php esc_html_e('Chat Instance:', 'flowchat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('instance_id')); ?>"
                name="<?php echo esc_attr($this->get_field_name('instance_id')); ?>"
            >
                <option value=""><?php esc_html_e('— Select Instance —', 'flowchat'); ?></option>
                <?php foreach ($instances as $inst): ?>
                    <option value="<?php echo esc_attr($inst['id']); ?>" <?php selected($instance_id, $inst['id']); ?>>
                        <?php echo esc_html($inst['name']); ?>
                        <?php if (!$inst['isEnabled']): ?>
                            (<?php esc_html_e('disabled', 'flowchat'); ?>)
                        <?php endif; ?>
                    </option>
                <?php endforeach; ?>
            </select>
        </p>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('height')); ?>">
                <?php esc_html_e('Height:', 'flowchat'); ?>
            </label>
            <input
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('height')); ?>"
                name="<?php echo esc_attr($this->get_field_name('height')); ?>"
                type="text"
                value="<?php echo esc_attr($height); ?>"
                placeholder="400px"
            />
            <small><?php esc_html_e('CSS value (e.g., 400px, 50vh)', 'flowchat'); ?></small>
        </p>

        <p>
            <label for="<?php echo esc_attr($this->get_field_id('theme')); ?>">
                <?php esc_html_e('Theme:', 'flowchat'); ?>
            </label>
            <select
                class="widefat"
                id="<?php echo esc_attr($this->get_field_id('theme')); ?>"
                name="<?php echo esc_attr($this->get_field_name('theme')); ?>"
            >
                <option value="light" <?php selected($theme, 'light'); ?>><?php esc_html_e('Light', 'flowchat'); ?></option>
                <option value="dark" <?php selected($theme, 'dark'); ?>><?php esc_html_e('Dark', 'flowchat'); ?></option>
                <option value="auto" <?php selected($theme, 'auto'); ?>><?php esc_html_e('Auto (System)', 'flowchat'); ?></option>
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
                <?php esc_html_e('Show chat header', 'flowchat'); ?>
            </label>
        </p>

        <?php if (empty($instances)): ?>
            <p class="description" style="color: #d63638;">
                <?php
                printf(
                    /* translators: %s: URL to FlowChat instances page */
                    esc_html__('No chat instances found. %sCreate one first%s.', 'flowchat'),
                    '<a href="' . esc_url(admin_url('admin.php?page=flowchat-instances')) . '">',
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
function flowchat_register_widget(): void {
    register_widget(FlowChat_Widget::class);
}
add_action('widgets_init', __NAMESPACE__ . '\flowchat_register_widget');
