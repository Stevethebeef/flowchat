<?php
/**
 * n8n Chat Block Server-Side Render
 *
 * @package N8nChat
 */

defined('ABSPATH') || exit;

// Extract attributes with prefixed variable names to avoid global scope conflicts
$n8n_chat_instance_id = $attributes['instanceId'] ?? '';
$n8n_chat_mode = $attributes['mode'] ?? 'inline';
$n8n_chat_width = $attributes['width'] ?? '100%';
$n8n_chat_height = $attributes['height'] ?? '500px';
$n8n_chat_theme = $attributes['theme'] ?? 'light';
$n8n_chat_primary_color = $attributes['primaryColor'] ?? '';
$n8n_chat_welcome_message = $attributes['welcomeMessage'] ?? '';
$n8n_chat_placeholder = $attributes['placeholder'] ?? '';
$n8n_chat_title = $attributes['title'] ?? '';
$n8n_chat_bubble_position = $attributes['bubblePosition'] ?? 'bottom-right';
$n8n_chat_auto_open = $attributes['autoOpen'] ?? false;
$n8n_chat_auto_open_delay = $attributes['autoOpenDelay'] ?? 3000;
$n8n_chat_show_header = $attributes['showHeader'] ?? true;
$n8n_chat_show_timestamp = $attributes['showTimestamp'] ?? true;
$n8n_chat_show_avatar = $attributes['showAvatar'] ?? true;
$n8n_chat_require_login = $attributes['requireLogin'] ?? false;
$n8n_chat_custom_class = $attributes['customClass'] ?? '';

// Build shortcode attributes
$n8n_chat_shortcode_atts = [];

if ($n8n_chat_instance_id) {
    $n8n_chat_shortcode_atts[] = sprintf('id="%s"', esc_attr($n8n_chat_instance_id));
}

$n8n_chat_shortcode_atts[] = sprintf('mode="%s"', esc_attr($n8n_chat_mode));

if ($n8n_chat_mode === 'inline') {
    $n8n_chat_shortcode_atts[] = sprintf('width="%s"', esc_attr($n8n_chat_width));
    $n8n_chat_shortcode_atts[] = sprintf('height="%s"', esc_attr($n8n_chat_height));
}

if ($n8n_chat_mode === 'fullscreen') {
    $n8n_chat_shortcode_atts[] = 'fullscreen="true"';
}

$n8n_chat_shortcode_atts[] = sprintf('theme="%s"', esc_attr($n8n_chat_theme));

if ($n8n_chat_primary_color) {
    $n8n_chat_shortcode_atts[] = sprintf('primary-color="%s"', esc_attr($n8n_chat_primary_color));
}

if ($n8n_chat_welcome_message) {
    $n8n_chat_shortcode_atts[] = sprintf('welcome="%s"', esc_attr($n8n_chat_welcome_message));
}

if ($n8n_chat_placeholder) {
    $n8n_chat_shortcode_atts[] = sprintf('placeholder="%s"', esc_attr($n8n_chat_placeholder));
}

if ($n8n_chat_title) {
    $n8n_chat_shortcode_atts[] = sprintf('title="%s"', esc_attr($n8n_chat_title));
}

if ($n8n_chat_mode === 'bubble') {
    $n8n_chat_shortcode_atts[] = sprintf('position="%s"', esc_attr($n8n_chat_bubble_position));

    if ($n8n_chat_auto_open) {
        $n8n_chat_shortcode_atts[] = 'auto-open="true"';
        $n8n_chat_shortcode_atts[] = sprintf('auto-open-delay="%d"', intval($n8n_chat_auto_open_delay));
    }
}

$n8n_chat_shortcode_atts[] = sprintf('show-header="%s"', $n8n_chat_show_header ? 'true' : 'false');
$n8n_chat_shortcode_atts[] = sprintf('show-timestamp="%s"', $n8n_chat_show_timestamp ? 'true' : 'false');
$n8n_chat_shortcode_atts[] = sprintf('show-avatar="%s"', $n8n_chat_show_avatar ? 'true' : 'false');

if ($n8n_chat_require_login) {
    $n8n_chat_shortcode_atts[] = 'require-login="true"';
}

if ($n8n_chat_custom_class) {
    $n8n_chat_shortcode_atts[] = sprintf('class="%s"', esc_attr($n8n_chat_custom_class));
}

// Build shortcode string
$n8n_chat_shortcode = '[n8n_chat ' . implode(' ', $n8n_chat_shortcode_atts) . ']';

// Get wrapper attributes
$n8n_chat_wrapper_attributes = get_block_wrapper_attributes([
    'class' => 'n8n-chat-block-wrapper',
]);

// Render - wrapper_attributes is already escaped by get_block_wrapper_attributes()
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- get_block_wrapper_attributes() returns escaped attributes
echo '<div ' . $n8n_chat_wrapper_attributes . '>';
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_shortcode() is allowed to output HTML
echo do_shortcode($n8n_chat_shortcode);
echo '</div>';
