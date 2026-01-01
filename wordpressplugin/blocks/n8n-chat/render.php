<?php
/**
 * n8n Chat Block Server-Side Render
 *
 * @package N8nChat
 */

defined('ABSPATH') || exit;

// Extract attributes
$instance_id = $attributes['instanceId'] ?? '';
$mode = $attributes['mode'] ?? 'inline';
$width = $attributes['width'] ?? '100%';
$height = $attributes['height'] ?? '500px';
$theme = $attributes['theme'] ?? 'light';
$primary_color = $attributes['primaryColor'] ?? '';
$welcome_message = $attributes['welcomeMessage'] ?? '';
$placeholder = $attributes['placeholder'] ?? '';
$title = $attributes['title'] ?? '';
$bubble_position = $attributes['bubblePosition'] ?? 'bottom-right';
$auto_open = $attributes['autoOpen'] ?? false;
$auto_open_delay = $attributes['autoOpenDelay'] ?? 3000;
$show_header = $attributes['showHeader'] ?? true;
$show_timestamp = $attributes['showTimestamp'] ?? true;
$show_avatar = $attributes['showAvatar'] ?? true;
$require_login = $attributes['requireLogin'] ?? false;
$custom_class = $attributes['customClass'] ?? '';

// Build shortcode attributes
$shortcode_atts = [];

if ($instance_id) {
    $shortcode_atts[] = sprintf('id="%s"', esc_attr($instance_id));
}

$shortcode_atts[] = sprintf('mode="%s"', esc_attr($mode));

if ($mode === 'inline') {
    $shortcode_atts[] = sprintf('width="%s"', esc_attr($width));
    $shortcode_atts[] = sprintf('height="%s"', esc_attr($height));
}

if ($mode === 'fullscreen') {
    $shortcode_atts[] = 'fullscreen="true"';
}

$shortcode_atts[] = sprintf('theme="%s"', esc_attr($theme));

if ($primary_color) {
    $shortcode_atts[] = sprintf('primary-color="%s"', esc_attr($primary_color));
}

if ($welcome_message) {
    $shortcode_atts[] = sprintf('welcome="%s"', esc_attr($welcome_message));
}

if ($placeholder) {
    $shortcode_atts[] = sprintf('placeholder="%s"', esc_attr($placeholder));
}

if ($title) {
    $shortcode_atts[] = sprintf('title="%s"', esc_attr($title));
}

if ($mode === 'bubble') {
    $shortcode_atts[] = sprintf('position="%s"', esc_attr($bubble_position));

    if ($auto_open) {
        $shortcode_atts[] = 'auto-open="true"';
        $shortcode_atts[] = sprintf('auto-open-delay="%d"', intval($auto_open_delay));
    }
}

$shortcode_atts[] = sprintf('show-header="%s"', $show_header ? 'true' : 'false');
$shortcode_atts[] = sprintf('show-timestamp="%s"', $show_timestamp ? 'true' : 'false');
$shortcode_atts[] = sprintf('show-avatar="%s"', $show_avatar ? 'true' : 'false');

if ($require_login) {
    $shortcode_atts[] = 'require-login="true"';
}

if ($custom_class) {
    $shortcode_atts[] = sprintf('class="%s"', esc_attr($custom_class));
}

// Build shortcode string
$shortcode = '[n8n_chat ' . implode(' ', $shortcode_atts) . ']';

// Get wrapper attributes
$wrapper_attributes = get_block_wrapper_attributes([
    'class' => 'n8n-chat-block-wrapper',
]);

// Render
echo sprintf(
    '<div %s>%s</div>',
    $wrapper_attributes,
    do_shortcode($shortcode)
);
