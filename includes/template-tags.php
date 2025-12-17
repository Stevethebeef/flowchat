<?php
/**
 * Template Tags for Theme Developers
 *
 * Provides easy-to-use functions for theme developers to render n8n Chat
 * instances in their themes without dealing with shortcodes directly.
 *
 * @package N8nChat
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

/**
 * Render n8n Chat instance
 *
 * Outputs an n8n Chat instance directly. Use in theme template files.
 *
 * Example:
 *   <?php n8n_chat_render('support'); ?>
 *   <?php n8n_chat_render('sales', ['mode' => 'bubble', 'height' => '600px']); ?>
 *
 * @param string $instance_id Instance ID (e.g., 'inst_abc123' or just 'abc123')
 * @param array  $args        Optional arguments to override instance settings
 * @return void
 */
function n8n_chat_render(string $instance_id = '', array $args = []): void {
    echo n8n_chat_get_rendered($instance_id, $args);
}

/**
 * Get rendered n8n Chat instance HTML
 *
 * Returns the HTML for an n8n Chat instance without outputting it.
 * Useful when you need to store or manipulate the HTML before output.
 *
 * @param string $instance_id Instance ID
 * @param array  $args        Optional arguments to override instance settings
 * @return string Rendered HTML
 */
function n8n_chat_get_rendered(string $instance_id = '', array $args = []): string {
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

    return do_shortcode('[n8n_chat' . $atts_string . ']');
}

/**
 * Check if n8n Chat is available
 *
 * Use this to conditionally render n8n Chat only when the plugin is active
 * and has at least one configured instance.
 *
 * Example:
 *   <?php if (n8n_chat_is_available()): ?>
 *       <?php n8n_chat_render('support'); ?>
 *   <?php endif; ?>
 *
 * @return bool True if n8n Chat is ready to use
 */
function n8n_chat_is_available(): bool {
    if (!class_exists('\N8nChat\Core\Instance_Manager')) {
        return false;
    }

    $manager = \N8nChat\Core\Instance_Manager::get_instance();
    $instances = $manager->get_all_instances();

    return !empty($instances);
}

/**
 * Get all n8n Chat instances
 *
 * Returns an array of all configured n8n Chat instances.
 * Useful for building custom instance selectors or listings.
 *
 * @return array Array of instance data, each containing:
 *               - id: string Instance ID
 *               - name: string Instance name
 *               - status: string 'active' or 'inactive'
 *               - config: array Instance configuration
 */
function n8n_chat_get_instances(): array {
    if (!class_exists('\N8nChat\Core\Instance_Manager')) {
        return [];
    }

    $manager = \N8nChat\Core\Instance_Manager::get_instance();
    return $manager->get_all_instances();
}

/**
 * Get a specific n8n Chat instance
 *
 * @param string $instance_id Instance ID
 * @return array|null Instance data or null if not found
 */
function n8n_chat_get_instance(string $instance_id): ?array {
    if (!class_exists('\N8nChat\Core\Instance_Manager')) {
        return null;
    }

    $manager = \N8nChat\Core\Instance_Manager::get_instance();
    return $manager->get($instance_id);
}

/**
 * Check if a specific instance exists
 *
 * @param string $instance_id Instance ID
 * @return bool True if instance exists
 */
function n8n_chat_instance_exists(string $instance_id): bool {
    return n8n_chat_get_instance($instance_id) !== null;
}

/**
 * Get active n8n Chat instances only
 *
 * @return array Array of active instance data
 */
function n8n_chat_get_active_instances(): array {
    $instances = n8n_chat_get_instances();

    return array_filter($instances, function ($instance) {
        return isset($instance['status']) && $instance['status'] === 'active';
    });
}

/**
 * Check if user can access an n8n Chat instance
 *
 * Checks instance access rules against the current user.
 *
 * @param string $instance_id Instance ID
 * @return bool True if current user can access the instance
 */
function n8n_chat_user_can_access(string $instance_id): bool {
    if (!class_exists('\N8nChat\Security\Instance_Access')) {
        return true; // Default to allow if security class not loaded
    }

    $access = new \N8nChat\Security\Instance_Access();
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
function n8n_chat_get_shortcode(string $instance_id, array $args = []): string {
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

    return '[n8n_chat' . $atts_string . ']';
}

/**
 * Check if premium features are available
 *
 * @return bool True if premium license is active
 */
function n8n_chat_is_premium(): bool {
    if (!class_exists('\N8nChat\Core\License_Manager')) {
        return false;
    }

    $license = \N8nChat\Core\License_Manager::get_instance();
    return $license->is_premium();
}

/**
 * Check if a specific feature is available
 *
 * @param string $feature Feature name (e.g., 'multiple_instances', 'analytics')
 * @return bool True if feature is available
 */
function n8n_chat_has_feature(string $feature): bool {
    if (!class_exists('\N8nChat\Core\Feature_Checker')) {
        return true; // Default to allow if feature checker not loaded
    }

    return \N8nChat\Core\Feature_Checker::is_enabled($feature);
}
