<?php
/**
 * Frontend Handler
 *
 * Main frontend controller for n8n Chat.
 *
 * @package N8nChat
 */

namespace N8nChat\Frontend;

use N8nChat\Core\Instance_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Frontend
 */
class Frontend {

    /**
     * Instance manager
     *
     * @var Instance_Manager
     */
    private Instance_Manager $instance_manager;

    /**
     * Constructor
     */
    public function __construct() {
        $this->instance_manager = Instance_Manager::get_instance();

        add_action('wp_footer', [$this, 'render_bubble_instances']);
        add_action('wp_head', [$this, 'output_custom_css']);
    }

    /**
     * Render bubble instances - either site-wide or with URL targeting
     */
    public function render_bubble_instances(): void {
        $rendered = false;

        // First, check for instances with "showOnAllPages" enabled (site-wide bubble)
        $all_instances = $this->instance_manager->get_all_instances();

        foreach ($all_instances as $instance) {
            // Skip disabled instances
            if (empty($instance['isEnabled'])) {
                continue;
            }

            // Check for site-wide bubble mode
            if (!empty($instance['bubble']['enabled']) && !empty($instance['bubble']['showOnAllPages'])) {
                // Check access permissions
                if (!$this->check_access($instance)) {
                    continue;
                }

                // Check schedule restrictions (MED-001)
                if (!$this->is_within_schedule($instance)) {
                    continue;
                }

                // Check device targeting (MED-002)
                if (!$this->is_allowed_device($instance)) {
                    continue;
                }

                // Render the bubble container
                $this->render_bubble_container($instance);
                $rendered = true;

                // Only render one bubble per page
                break;
            }
        }

        // If no site-wide bubble, check URL-targeted bubbles
        if (!$rendered) {
            $current_url = home_url(add_query_arg(null, null));
            $matching_instances = $this->instance_manager->get_instances_for_url($current_url);

            foreach ($matching_instances as $instance) {
                // Only render if bubble mode is enabled
                if (empty($instance['bubble']['enabled'])) {
                    continue;
                }

                // Check access permissions
                if (!$this->check_access($instance)) {
                    continue;
                }

                // Check schedule restrictions (MED-001)
                if (!$this->is_within_schedule($instance)) {
                    continue;
                }

                // Check device targeting (MED-002)
                if (!$this->is_allowed_device($instance)) {
                    continue;
                }

                // Render the bubble container
                $this->render_bubble_container($instance);

                // Only render one bubble per page (highest priority wins)
                break;
            }
        }
    }

    /**
     * Render bubble container for an instance
     *
     * @param array $instance Instance configuration
     */
    private function render_bubble_container(array $instance): void {
        $container_id = 'n8n-chat-bubble-' . esc_attr($instance['id']);

        // Enqueue assets
        wp_enqueue_script('n8n-chat-frontend');
        wp_enqueue_style('n8n-chat-frontend');

        // Pass config to JS
        $js_var_name = 'n8nChatBubble_' . str_replace('-', '_', $instance['id']);
        wp_localize_script('n8n-chat-frontend', $js_var_name, [
            'containerId' => $container_id,
            'instanceId' => $instance['id'],
            'mode' => 'bubble',
            'apiUrl' => rest_url('n8n-chat/v1'),
            'nonce' => wp_create_nonce('wp_rest'),
        ]);

        // Output container
        printf(
            '<div id="%s" class="n8n-chat-bubble-container"></div>',
            esc_attr($container_id)
        );
    }

    /**
     * Check if current user has access to an instance
     *
     * @param array $instance Instance configuration
     * @return bool
     */
    public function check_access(array $instance): bool {
        // Check if instance is enabled
        if (empty($instance['isEnabled'])) {
            return false;
        }

        $access = $instance['access'] ?? [];

        // Check login requirement
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return false;
        }

        // Check role restriction
        if (!empty($access['allowedRoles']) && is_user_logged_in()) {
            $user = wp_get_current_user();
            if (!array_intersect($access['allowedRoles'], $user->roles)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Output custom CSS from global settings and active instances (HIGH-005 fix)
     */
    public function output_custom_css(): void {
        $css_parts = [];

        // Add global custom CSS
        $settings = get_option('n8n_chat_global_settings', []);
        if (!empty($settings['custom_css'])) {
            $css_parts[] = wp_strip_all_tags($settings['custom_css']);
        }

        // Add custom CSS from active instances (HIGH-005 fix)
        $all_instances = $this->instance_manager->get_all_instances();
        foreach ($all_instances as $instance) {
            // Only include CSS from enabled instances
            if (empty($instance['isEnabled'])) {
                continue;
            }

            // Check for customCss in appearance settings
            $custom_css = $instance['appearance']['customCss'] ?? '';
            if (!empty($custom_css)) {
                // Wrap instance CSS in a comment for debugging and scope identification
                $css_parts[] = sprintf(
                    "/* Instance: %s */\n%s",
                    esc_html($instance['id']),
                    wp_strip_all_tags($custom_css)
                );
            }
        }

        // Output combined CSS if any exists
        if (!empty($css_parts)) {
            // phpcs:disable WordPress.Security.EscapeOutput.OutputNotEscaped -- CSS is sanitized via wp_strip_all_tags
            printf(
                '<style id="n8n-chat-custom-css">%s</style>',
                implode("\n\n", $css_parts)
            );
            // phpcs:enable WordPress.Security.EscapeOutput.OutputNotEscaped
        }
    }

    /**
     * Get access denied message for an instance
     *
     * @param array $instance Instance configuration
     * @return string
     */
    public function get_access_denied_message(array $instance): string {
        $access = $instance['access'] ?? [];

        if (!empty($access['deniedMessage'])) {
            return $access['deniedMessage'];
        }

        $error_messages = get_option('n8n_chat_error_messages', []);

        if (!is_user_logged_in() && !empty($access['requireLogin'])) {
            return $error_messages['access_denied'] ?? __('Please log in to use this chat.', 'n8n-chat');
        }

        return $error_messages['access_denied'] ?? __('You do not have permission to access this chat.', 'n8n-chat');
    }

    /**
     * Check if current time is within the instance's schedule (MED-001)
     *
     * @param array $instance Instance configuration
     * @return bool True if within schedule or schedule not enabled
     */
    public function is_within_schedule(array $instance): bool {
        $schedule = $instance['schedule'] ?? [];

        // If schedule is not enabled, allow access
        if (empty($schedule['enabled'])) {
            return true;
        }

        // Get timezone from schedule settings, fallback to WordPress timezone
        $timezone_string = $schedule['timezone'] ?? wp_timezone_string();

        try {
            $timezone = new \DateTimeZone($timezone_string);
        } catch (\Exception $e) {
            // Invalid timezone, fallback to UTC
            $timezone = new \DateTimeZone('UTC');
        }

        $now = new \DateTime('now', $timezone);

        // Check day of week (0 = Sunday, 6 = Saturday)
        $current_day = strtolower($now->format('l')); // e.g., 'monday', 'tuesday'
        $allowed_days = $schedule['days'] ?? [];

        // If days array is specified, check if current day is allowed
        if (!empty($allowed_days)) {
            // Normalize day names to lowercase
            $allowed_days = array_map('strtolower', $allowed_days);

            if (!in_array($current_day, $allowed_days, true)) {
                return false;
            }
        }

        // Check time range
        $start_time = $schedule['startTime'] ?? null;
        $end_time = $schedule['endTime'] ?? null;

        if ($start_time && $end_time) {
            $current_time = $now->format('H:i');

            // Handle overnight schedules (e.g., 22:00 to 06:00)
            if ($start_time > $end_time) {
                // Overnight: valid if current time is >= start OR < end
                if ($current_time < $start_time && $current_time >= $end_time) {
                    return false;
                }
            } else {
                // Normal schedule: valid if current time is >= start AND < end
                if ($current_time < $start_time || $current_time >= $end_time) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Check if current device type is allowed (MED-002)
     *
     * @param array $instance Instance configuration
     * @return bool True if device is allowed
     */
    public function is_allowed_device(array $instance): bool {
        $devices = $instance['devices'] ?? [];

        // If no device restrictions, allow all
        if (empty($devices)) {
            return true;
        }

        // Default all to true if not specified
        $allow_desktop = $devices['desktop'] ?? true;
        $allow_tablet = $devices['tablet'] ?? true;
        $allow_mobile = $devices['mobile'] ?? true;

        // If all devices are allowed, return early
        if ($allow_desktop && $allow_tablet && $allow_mobile) {
            return true;
        }

        // Detect device type from User-Agent
        $user_agent = isset($_SERVER['HTTP_USER_AGENT']) ? sanitize_text_field(wp_unslash($_SERVER['HTTP_USER_AGENT'])) : '';

        if (empty($user_agent)) {
            // No user agent, assume desktop
            return $allow_desktop;
        }

        $device_type = $this->detect_device_type($user_agent);

        switch ($device_type) {
            case 'mobile':
                return $allow_mobile;
            case 'tablet':
                return $allow_tablet;
            case 'desktop':
            default:
                return $allow_desktop;
        }
    }

    /**
     * Detect device type from User-Agent string
     *
     * @param string $user_agent The User-Agent string
     * @return string Device type: 'mobile', 'tablet', or 'desktop'
     */
    private function detect_device_type(string $user_agent): string {
        $user_agent = strtolower($user_agent);

        // Check for tablets first (some tablets have 'mobile' in UA)
        $tablet_patterns = [
            'tablet',
            'ipad',
            'playbook',
            'silk',
            'kindle',
            'android(?!.*mobile)', // Android without 'mobile' = tablet
        ];

        foreach ($tablet_patterns as $pattern) {
            if (preg_match('/' . $pattern . '/i', $user_agent)) {
                return 'tablet';
            }
        }

        // Check for mobile devices
        $mobile_patterns = [
            'mobile',
            'iphone',
            'ipod',
            'android.*mobile',
            'windows phone',
            'blackberry',
            'bb10',
            'opera mini',
            'opera mobi',
            'webos',
            'palm',
            'symbian',
        ];

        foreach ($mobile_patterns as $pattern) {
            if (preg_match('/' . $pattern . '/i', $user_agent)) {
                return 'mobile';
            }
        }

        // Default to desktop
        return 'desktop';
    }
}
