<?php
/**
 * Template Tags for Theme Developers
 *
 * Provides easy-to-use functions for theme developers to render FlowChat
 * instances in their themes without dealing with shortcodes directly.
 *
 * Per 08-shortcodes-blocks.md specification.
 *
 * @package FlowChat
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Render FlowChat instance
 *
 * Outputs a FlowChat instance directly. Use in theme template files.
 *
 * Example:
 *   <?php flowchat_render('support'); ?>
 *   <?php flowchat_render('sales', ['mode' => 'bubble', 'height' => '600px']); ?>
 *
 * @param string $instance_id Instance ID (e.g., 'inst_abc123' or just 'abc123')
 * @param array  $args        Optional arguments to override instance settings
 * @return void
 */
function flowchat_render(string $instance_id = '', array $args = []): void {
    echo flowchat_get_rendered($instance_id, $args);
}

/**
 * Get rendered FlowChat instance HTML
 *
 * Returns the HTML for a FlowChat instance without outputting it.
 * Useful when you need to store or manipulate the HTML before output.
 *
 * @param string $instance_id Instance ID
 * @param array  $args        Optional arguments to override instance settings
 * @return string Rendered HTML
 */
function flowchat_get_rendered(string $instance_id = '', array $args = []): string {
    // Build shortcode attributes
    $atts = array_merge(['id' => $instance_id], $args);

    $atts_string = '';
    foreach ($atts as $key => $value) {
        if ($value !== '' && $value !== null) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $atts_string .= sprintf(' %s="%s"', esc_attr($key), esc_attr($value));
        }
    }

    return do_shortcode('[flowchat' . $atts_string . ']');
}

/**
 * Check if FlowChat is available
 *
 * Use this to conditionally render FlowChat only when the plugin is active
 * and has at least one configured instance.
 *
 * Example:
 *   <?php if (flowchat_is_available()): ?>
 *       <?php flowchat_render('support'); ?>
 *   <?php endif; ?>
 *
 * @return bool True if FlowChat is ready to use
 */
function flowchat_is_available(): bool {
    if (!class_exists('\FlowChat\Core\Instance_Manager')) {
        return false;
    }

    $manager = \FlowChat\Core\Instance_Manager::get_instance();
    $instances = $manager->get_all_instances();

    return !empty($instances);
}

/**
 * Get all FlowChat instances
 *
 * Returns an array of all configured FlowChat instances.
 * Useful for building custom instance selectors or listings.
 *
 * @return array Array of instance data, each containing:
 *               - id: string Instance ID
 *               - name: string Instance name
 *               - status: string 'active' or 'inactive'
 *               - config: array Instance configuration
 */
function flowchat_get_instances(): array {
    if (!class_exists('\FlowChat\Core\Instance_Manager')) {
        return [];
    }

    $manager = \FlowChat\Core\Instance_Manager::get_instance();
    return $manager->get_all_instances();
}

/**
 * Get a specific FlowChat instance
 *
 * @param string $instance_id Instance ID
 * @return array|null Instance data or null if not found
 */
function flowchat_get_instance(string $instance_id): ?array {
    if (!class_exists('\FlowChat\Core\Instance_Manager')) {
        return null;
    }

    $manager = \FlowChat\Core\Instance_Manager::get_instance();
    return $manager->get_instance($instance_id);
}

/**
 * Check if a specific instance exists
 *
 * @param string $instance_id Instance ID
 * @return bool True if instance exists
 */
function flowchat_instance_exists(string $instance_id): bool {
    return flowchat_get_instance($instance_id) !== null;
}

/**
 * Get active FlowChat instances only
 *
 * @return array Array of active instance data
 */
function flowchat_get_active_instances(): array {
    $instances = flowchat_get_instances();

    return array_filter($instances, function ($instance) {
        return isset($instance['status']) && $instance['status'] === 'active';
    });
}

/**
 * Check if user can access a FlowChat instance
 *
 * Checks instance access rules against the current user.
 *
 * @param string $instance_id Instance ID
 * @return bool True if current user can access the instance
 */
function flowchat_user_can_access(string $instance_id): bool {
    if (!class_exists('\FlowChat\Security\Instance_Access')) {
        return true; // Default to allow if security class not loaded
    }

    $access = new \FlowChat\Security\Instance_Access();
    return $access->user_can_access($instance_id, get_current_user_id());
}

/**
 * Get instance shortcode
 *
 * Returns the shortcode string for an instance (without rendering).
 * Useful for displaying in admin UI or copying.
 *
 * @param string $instance_id Instance ID
 * @param array  $args        Optional shortcode attributes
 * @return string Shortcode string
 */
function flowchat_get_shortcode(string $instance_id, array $args = []): string {
    $atts = array_merge(['id' => $instance_id], $args);

    $atts_string = '';
    foreach ($atts as $key => $value) {
        if ($value !== '' && $value !== null) {
            if (is_bool($value)) {
                $value = $value ? 'true' : 'false';
            }
            $atts_string .= sprintf(' %s="%s"', esc_attr($key), esc_attr($value));
        }
    }

    return '[flowchat' . $atts_string . ']';
}

/**
 * Check if premium features are available
 *
 * @return bool True if premium license is active
 */
function flowchat_is_premium(): bool {
    if (!class_exists('\FlowChat\Core\License_Manager')) {
        return false;
    }

    $license = \FlowChat\Core\License_Manager::get_instance();
    return $license->is_premium();
}

/**
 * Check if a specific feature is available
 *
 * @param string $feature Feature name (e.g., 'multiple_instances', 'analytics')
 * @return bool True if feature is available
 */
function flowchat_has_feature(string $feature): bool {
    if (!class_exists('\FlowChat\Core\Feature_Checker')) {
        return true; // Default to allow if feature checker not loaded
    }

    return \FlowChat\Core\Feature_Checker::is_enabled($feature);
}
