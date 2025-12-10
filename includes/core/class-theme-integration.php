<?php
/**
 * Theme Integration for FlowChat
 *
 * Extracts colors and styles from the active WordPress theme
 * to automatically style the chat widget.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Theme Integration class
 */
class Theme_Integration {

    /**
     * Singleton instance
     */
    private static ?Theme_Integration $instance = null;

    /**
     * Cached theme colors
     */
    private ?array $cached_colors = null;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Theme_Integration {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        // Clear cache when theme changes
        add_action('switch_theme', [$this, 'clear_cache']);
        add_action('customize_save_after', [$this, 'clear_cache']);
    }

    /**
     * Get theme colors
     *
     * @param bool $force_refresh Force cache refresh
     * @return array Theme colors
     */
    public function get_theme_colors(bool $force_refresh = false): array {
        if (!$force_refresh && $this->cached_colors !== null) {
            return $this->cached_colors;
        }

        // Check transient cache
        $cached = get_transient('flowchat_theme_colors');
        if (!$force_refresh && $cached !== false) {
            $this->cached_colors = $cached;
            return $cached;
        }

        // Extract colors
        $colors = $this->extract_theme_colors();

        // Cache for 24 hours
        set_transient('flowchat_theme_colors', $colors, DAY_IN_SECONDS);
        $this->cached_colors = $colors;

        return $colors;
    }

    /**
     * Extract colors from theme
     *
     * @return array Extracted colors
     */
    private function extract_theme_colors(): array {
        $colors = [
            'primary' => null,
            'secondary' => null,
            'accent' => null,
            'background' => null,
            'text' => null,
            'link' => null,
            'border' => null,
        ];

        // Try theme.json (block themes)
        $theme_json_colors = $this->get_theme_json_colors();
        if (!empty($theme_json_colors)) {
            $colors = array_merge($colors, $theme_json_colors);
        }

        // Try theme mods (Customizer)
        $theme_mod_colors = $this->get_theme_mod_colors();
        if (!empty($theme_mod_colors)) {
            $colors = array_merge($colors, array_filter($theme_mod_colors));
        }

        // Try CSS custom properties from theme
        $css_var_colors = $this->get_css_var_colors();
        if (!empty($css_var_colors)) {
            $colors = array_merge($colors, array_filter($css_var_colors));
        }

        // Ensure we have defaults
        return $this->apply_default_colors($colors);
    }

    /**
     * Get colors from theme.json (WordPress 5.8+)
     *
     * @return array Colors
     */
    private function get_theme_json_colors(): array {
        $colors = [];

        if (!function_exists('wp_get_global_settings')) {
            return $colors;
        }

        $settings = wp_get_global_settings();

        if (empty($settings['color']['palette']['theme'])) {
            return $colors;
        }

        $palette = $settings['color']['palette']['theme'];

        // Map common color slug names
        $slug_map = [
            'primary' => ['primary', 'brand', 'main', 'accent'],
            'secondary' => ['secondary', 'secondary-brand'],
            'accent' => ['accent', 'tertiary', 'highlight'],
            'background' => ['background', 'base', 'surface'],
            'text' => ['foreground', 'text', 'contrast', 'body'],
        ];

        foreach ($palette as $color_def) {
            $slug = $color_def['slug'] ?? '';
            $color = $color_def['color'] ?? '';

            if (empty($slug) || empty($color)) {
                continue;
            }

            foreach ($slug_map as $key => $possible_slugs) {
                if (in_array(strtolower($slug), $possible_slugs, true)) {
                    $colors[$key] = $color;
                    break;
                }
            }
        }

        return $colors;
    }

    /**
     * Get colors from theme mods (Customizer)
     *
     * @return array Colors
     */
    private function get_theme_mod_colors(): array {
        $colors = [];

        // Common theme mod names
        $mod_map = [
            'primary' => [
                'primary_color',
                'primary-color',
                'brand_color',
                'theme_color',
                'accent_color',
            ],
            'secondary' => [
                'secondary_color',
                'secondary-color',
            ],
            'background' => [
                'background_color',
                'bg_color',
                'site_background',
            ],
            'text' => [
                'text_color',
                'body_text_color',
                'content_color',
            ],
            'link' => [
                'link_color',
                'links_color',
                'anchor_color',
            ],
        ];

        foreach ($mod_map as $key => $mod_names) {
            foreach ($mod_names as $mod_name) {
                $value = get_theme_mod($mod_name);
                if ($value && $this->is_valid_color($value)) {
                    $colors[$key] = $this->normalize_color($value);
                    break;
                }
            }
        }

        // Also check background_color which is a core setting
        $bg = get_background_color();
        if ($bg && !isset($colors['background'])) {
            $colors['background'] = '#' . ltrim($bg, '#');
        }

        return $colors;
    }

    /**
     * Get colors from CSS custom properties
     *
     * @return array Colors
     */
    private function get_css_var_colors(): array {
        $colors = [];

        // Check for common CSS custom property patterns
        // This requires the stylesheet to be available
        $stylesheet = get_stylesheet_directory() . '/style.css';

        if (!file_exists($stylesheet)) {
            return $colors;
        }

        $css = file_get_contents($stylesheet);

        // Look for CSS custom properties in :root
        $var_patterns = [
            'primary' => [
                '--wp--preset--color--primary',
                '--primary-color',
                '--color-primary',
                '--theme-primary',
            ],
            'secondary' => [
                '--wp--preset--color--secondary',
                '--secondary-color',
                '--color-secondary',
            ],
            'background' => [
                '--wp--preset--color--background',
                '--background-color',
                '--color-background',
                '--bg-color',
            ],
            'text' => [
                '--wp--preset--color--foreground',
                '--text-color',
                '--color-text',
                '--body-color',
            ],
        ];

        foreach ($var_patterns as $key => $patterns) {
            foreach ($patterns as $pattern) {
                if (preg_match('/' . preg_quote($pattern, '/') . '\s*:\s*([^;]+)/i', $css, $matches)) {
                    $value = trim($matches[1]);
                    if ($this->is_valid_color($value)) {
                        $colors[$key] = $this->normalize_color($value);
                        break;
                    }
                }
            }
        }

        return $colors;
    }

    /**
     * Apply default colors where missing
     *
     * @param array $colors Extracted colors
     * @return array Complete colors
     */
    private function apply_default_colors(array $colors): array {
        $defaults = [
            'primary' => '#3b82f6',
            'secondary' => '#1e40af',
            'accent' => '#8b5cf6',
            'background' => '#ffffff',
            'text' => '#1f2937',
            'link' => '#3b82f6',
            'border' => '#e5e7eb',
        ];

        foreach ($defaults as $key => $default) {
            if (empty($colors[$key])) {
                $colors[$key] = $default;
            }
        }

        // Generate derived colors
        if (!isset($colors['primary_light'])) {
            $colors['primary_light'] = $this->lighten_color($colors['primary'], 0.9);
        }

        if (!isset($colors['primary_dark'])) {
            $colors['primary_dark'] = $this->darken_color($colors['primary'], 0.2);
        }

        return $colors;
    }

    /**
     * Check if value is a valid CSS color
     *
     * @param string $value Value to check
     * @return bool Valid
     */
    private function is_valid_color(string $value): bool {
        // Hex color
        if (preg_match('/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $value)) {
            return true;
        }

        // RGB/RGBA
        if (preg_match('/^rgba?\s*\(/i', $value)) {
            return true;
        }

        // HSL/HSLA
        if (preg_match('/^hsla?\s*\(/i', $value)) {
            return true;
        }

        // Named colors
        $named_colors = ['black', 'white', 'red', 'green', 'blue', 'transparent'];
        if (in_array(strtolower($value), $named_colors, true)) {
            return true;
        }

        return false;
    }

    /**
     * Normalize color to hex format
     *
     * @param string $color Color value
     * @return string Normalized hex color
     */
    private function normalize_color(string $color): string {
        // Already hex
        if (preg_match('/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/', $color)) {
            return '#' . ltrim($color, '#');
        }

        // RGB
        if (preg_match('/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i', $color, $matches)) {
            return sprintf('#%02x%02x%02x', (int) $matches[1], (int) $matches[2], (int) $matches[3]);
        }

        // RGBA - ignore alpha
        if (preg_match('/^rgba\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i', $color, $matches)) {
            return sprintf('#%02x%02x%02x', (int) $matches[1], (int) $matches[2], (int) $matches[3]);
        }

        return $color;
    }

    /**
     * Lighten a color
     *
     * @param string $hex Hex color
     * @param float  $amount Amount to lighten (0-1)
     * @return string Lightened color
     */
    private function lighten_color(string $hex, float $amount): string {
        $hex = ltrim($hex, '#');

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        $r = $r + (255 - $r) * $amount;
        $g = $g + (255 - $g) * $amount;
        $b = $b + (255 - $b) * $amount;

        return sprintf('#%02x%02x%02x', (int) $r, (int) $g, (int) $b);
    }

    /**
     * Darken a color
     *
     * @param string $hex Hex color
     * @param float  $amount Amount to darken (0-1)
     * @return string Darkened color
     */
    private function darken_color(string $hex, float $amount): string {
        $hex = ltrim($hex, '#');

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        $r = $r * (1 - $amount);
        $g = $g * (1 - $amount);
        $b = $b * (1 - $amount);

        return sprintf('#%02x%02x%02x', (int) $r, (int) $g, (int) $b);
    }

    /**
     * Get color for contrast (light/dark text)
     *
     * @param string $background_color Background hex color
     * @return string Text color for contrast
     */
    public function get_contrast_color(string $background_color): string {
        $hex = ltrim($background_color, '#');

        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        // Calculate relative luminance
        $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;

        return $luminance > 0.5 ? '#1f2937' : '#ffffff';
    }

    /**
     * Generate CSS variables for chat widget
     *
     * @param array $instance_config Instance configuration
     * @return string CSS custom properties
     */
    public function generate_css_variables(array $instance_config = []): string {
        $theme_colors = $this->get_theme_colors();

        // Override with instance config
        $primary = $instance_config['primary_color'] ?? $theme_colors['primary'];
        $background = $instance_config['background_color'] ?? $theme_colors['background'];
        $text = $instance_config['text_color'] ?? $theme_colors['text'];

        $vars = [
            '--flowchat-primary' => $primary,
            '--flowchat-primary-light' => $this->lighten_color($primary, 0.9),
            '--flowchat-primary-dark' => $this->darken_color($primary, 0.2),
            '--flowchat-background' => $background,
            '--flowchat-text' => $text,
            '--flowchat-text-muted' => $this->lighten_color($text, 0.4),
            '--flowchat-border' => $theme_colors['border'],
            '--flowchat-contrast' => $this->get_contrast_color($primary),
        ];

        $css = ':root {' . PHP_EOL;
        foreach ($vars as $name => $value) {
            $css .= "  {$name}: {$value};" . PHP_EOL;
        }
        $css .= '}';

        return $css;
    }

    /**
     * Clear theme colors cache
     */
    public function clear_cache(): void {
        delete_transient('flowchat_theme_colors');
        $this->cached_colors = null;
    }

    /**
     * Detect if dark mode is active
     *
     * @return bool Dark mode detected
     */
    public function is_dark_mode(): bool {
        $colors = $this->get_theme_colors();

        if (empty($colors['background'])) {
            return false;
        }

        $hex = ltrim($colors['background'], '#');
        $r = hexdec(substr($hex, 0, 2));
        $g = hexdec(substr($hex, 2, 2));
        $b = hexdec(substr($hex, 4, 2));

        $luminance = (0.299 * $r + 0.587 * $g + 0.114 * $b) / 255;

        return $luminance < 0.5;
    }

    /**
     * Get recommended theme for chat widget
     *
     * @return string 'light' or 'dark'
     */
    public function get_recommended_theme(): string {
        return $this->is_dark_mode() ? 'dark' : 'light';
    }
}
