<?php
/**
 * Instance Router for FlowChat
 *
 * Handles URL-based targeting to automatically display
 * chat instances on matching pages.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * Instance Router class
 */
class Instance_Router {

    /**
     * Singleton instance
     */
    private static ?Instance_Router $instance = null;

    /**
     * Instance Manager
     */
    private ?Instance_Manager $instance_manager = null;

    /**
     * Matched instance for current request
     */
    private ?array $matched_instance = null;

    /**
     * Whether routing has been performed
     */
    private bool $routing_done = false;

    /**
     * Get singleton instance
     */
    public static function get_instance(): Instance_Router {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->instance_manager = Instance_Manager::get_instance();
    }

    /**
     * Initialize router
     */
    public function init(): void {
        // Hook into template_redirect to perform routing
        add_action('template_redirect', [$this, 'perform_routing'], 5);

        // Hook into wp_footer to inject matched bubble
        add_action('wp_footer', [$this, 'maybe_inject_bubble'], 100);
    }

    /**
     * Perform URL-based routing
     */
    public function perform_routing(): void {
        if ($this->routing_done) {
            return;
        }

        $this->routing_done = true;

        // Don't route in admin
        if (is_admin()) {
            return;
        }

        // Get current URL
        $current_url = $this->get_current_url();
        $current_path = wp_parse_url($current_url, PHP_URL_PATH) ?? '/';

        // Find matching instance
        $this->matched_instance = $this->find_matching_instance($current_url, $current_path);

        // Fire action for matched instance
        if ($this->matched_instance) {
            do_action('flowchat_instance_matched', $this->matched_instance, $current_url);
        }
    }

    /**
     * Get current URL
     *
     * @return string Current URL
     */
    private function get_current_url(): string {
        $protocol = is_ssl() ? 'https://' : 'http://';
        $host = sanitize_text_field($_SERVER['HTTP_HOST'] ?? '');
        $uri = sanitize_text_field($_SERVER['REQUEST_URI'] ?? '/');

        return $protocol . $host . $uri;
    }

    /**
     * Find matching instance for URL
     *
     * @param string $url Full URL
     * @param string $path URL path
     * @return array|null Matching instance or null
     */
    private function find_matching_instance(string $url, string $path): ?array {
        $instances = $this->instance_manager->get_all_instances();

        // Filter to active instances with URL patterns
        $routable_instances = array_filter($instances, function($instance) {
            return !empty($instance['is_active'])
                && !empty($instance['url_patterns'])
                && is_array($instance['url_patterns']);
        });

        // Sort by priority (if set)
        usort($routable_instances, function($a, $b) {
            $priority_a = $a['config']['routing_priority'] ?? 10;
            $priority_b = $b['config']['routing_priority'] ?? 10;
            return $priority_a - $priority_b;
        });

        // Find first match
        foreach ($routable_instances as $instance) {
            if ($this->instance_matches_url($instance, $url, $path)) {
                return $instance;
            }
        }

        return null;
    }

    /**
     * Check if instance matches URL
     *
     * @param array  $instance Instance data
     * @param string $url Full URL
     * @param string $path URL path
     * @return bool Matches
     */
    private function instance_matches_url(array $instance, string $url, string $path): bool {
        $patterns = $instance['url_patterns'] ?? [];

        foreach ($patterns as $pattern) {
            if ($this->pattern_matches($pattern, $url, $path)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Check if a pattern matches the URL
     *
     * Supports:
     * - Exact paths: /about
     * - Wildcards: /blog/*
     * - Regex: regex:/^\/products\/\d+$/
     * - Contains: contains:pricing
     * - Post types: post_type:product
     * - Categories: category:news
     * - Tags: tag:featured
     *
     * @param string $pattern Pattern to match
     * @param string $url Full URL
     * @param string $path URL path
     * @return bool Matches
     */
    private function pattern_matches(string $pattern, string $url, string $path): bool {
        $pattern = trim($pattern);

        if (empty($pattern)) {
            return false;
        }

        // Handle special pattern types
        if (strpos($pattern, ':') !== false) {
            list($type, $value) = explode(':', $pattern, 2);

            return match ($type) {
                'regex' => $this->match_regex($value, $path),
                'contains' => $this->match_contains($value, $url),
                'post_type' => $this->match_post_type($value),
                'category' => $this->match_category($value),
                'tag' => $this->match_tag($value),
                'taxonomy' => $this->match_taxonomy($value),
                'template' => $this->match_template($value),
                'page_id' => $this->match_page_id($value),
                'user_role' => $this->match_user_role($value),
                'logged_in' => $this->match_logged_in($value),
                default => false,
            };
        }

        // Handle wildcard patterns
        if (strpos($pattern, '*') !== false) {
            return $this->match_wildcard($pattern, $path);
        }

        // Exact match (case-insensitive, trailing slash agnostic)
        $normalized_pattern = rtrim($pattern, '/');
        $normalized_path = rtrim($path, '/');

        return strcasecmp($normalized_pattern, $normalized_path) === 0;
    }

    /**
     * Match regex pattern
     *
     * @param string $pattern Regex pattern
     * @param string $path URL path
     * @return bool Matches
     */
    private function match_regex(string $pattern, string $path): bool {
        // Ensure pattern has delimiters
        if ($pattern[0] !== '/') {
            $pattern = '/' . $pattern . '/i';
        }

        return @preg_match($pattern, $path) === 1;
    }

    /**
     * Match contains pattern
     *
     * @param string $needle String to find
     * @param string $url Full URL
     * @return bool Contains
     */
    private function match_contains(string $needle, string $url): bool {
        return stripos($url, $needle) !== false;
    }

    /**
     * Match wildcard pattern
     *
     * @param string $pattern Wildcard pattern
     * @param string $path URL path
     * @return bool Matches
     */
    private function match_wildcard(string $pattern, string $path): bool {
        // Convert wildcard to regex
        $regex = str_replace(
            ['*', '/'],
            ['.*', '\/'],
            $pattern
        );

        return preg_match('/^' . $regex . '$/i', $path) === 1;
    }

    /**
     * Match post type
     *
     * @param string $post_type Post type to match
     * @return bool Matches
     */
    private function match_post_type(string $post_type): bool {
        if (!is_singular()) {
            return false;
        }

        return get_post_type() === $post_type;
    }

    /**
     * Match category
     *
     * @param string $category Category slug or ID
     * @return bool Matches
     */
    private function match_category(string $category): bool {
        if (is_numeric($category)) {
            return is_category((int) $category) || in_category((int) $category);
        }

        return is_category($category) || in_category($category);
    }

    /**
     * Match tag
     *
     * @param string $tag Tag slug or ID
     * @return bool Matches
     */
    private function match_tag(string $tag): bool {
        if (is_numeric($tag)) {
            return is_tag((int) $tag) || has_tag((int) $tag);
        }

        return is_tag($tag) || has_tag($tag);
    }

    /**
     * Match taxonomy term
     *
     * @param string $taxonomy_term Format: taxonomy:term
     * @return bool Matches
     */
    private function match_taxonomy(string $taxonomy_term): bool {
        $parts = explode(':', $taxonomy_term);

        if (count($parts) !== 2) {
            return false;
        }

        list($taxonomy, $term) = $parts;

        return is_tax($taxonomy, $term) || has_term($term, $taxonomy);
    }

    /**
     * Match page template
     *
     * @param string $template Template slug
     * @return bool Matches
     */
    private function match_template(string $template): bool {
        if (!is_page()) {
            return false;
        }

        $page_template = get_page_template_slug();

        return $page_template === $template;
    }

    /**
     * Match page ID
     *
     * @param string $page_id Page ID or comma-separated IDs
     * @return bool Matches
     */
    private function match_page_id(string $page_id): bool {
        if (!is_page()) {
            return false;
        }

        $ids = array_map('intval', explode(',', $page_id));

        return in_array(get_the_ID(), $ids, true);
    }

    /**
     * Match user role
     *
     * @param string $role Role name or comma-separated roles
     * @return bool Matches
     */
    private function match_user_role(string $role): bool {
        if (!is_user_logged_in()) {
            return false;
        }

        $user = wp_get_current_user();
        $roles = array_map('trim', explode(',', $role));

        return !empty(array_intersect($user->roles, $roles));
    }

    /**
     * Match logged in status
     *
     * @param string $status 'yes' or 'no'
     * @return bool Matches
     */
    private function match_logged_in(string $status): bool {
        $logged_in = is_user_logged_in();

        if ($status === 'yes' || $status === 'true' || $status === '1') {
            return $logged_in;
        }

        return !$logged_in;
    }

    /**
     * Maybe inject bubble for matched instance
     */
    public function maybe_inject_bubble(): void {
        if (!$this->matched_instance) {
            return;
        }

        // Check if bubble mode is enabled for this instance
        $config = $this->matched_instance['config'] ?? [];
        $display_mode = $config['display_mode'] ?? 'bubble';

        if ($display_mode !== 'bubble') {
            return;
        }

        // Check access restrictions
        if (!$this->check_access($this->matched_instance)) {
            return;
        }

        // Render bubble
        $frontend = \FlowChat\Frontend\Frontend::get_instance();
        $frontend->render_bubble($this->matched_instance['id']);
    }

    /**
     * Check access restrictions for instance
     *
     * @param array $instance Instance data
     * @return bool Has access
     */
    private function check_access(array $instance): bool {
        $config = $instance['config'] ?? [];

        // Check login requirement
        if (!empty($config['require_login']) && !is_user_logged_in()) {
            return false;
        }

        // Check role restrictions
        if (!empty($config['allowed_roles']) && is_array($config['allowed_roles'])) {
            if (!is_user_logged_in()) {
                return false;
            }

            $user = wp_get_current_user();
            if (empty(array_intersect($user->roles, $config['allowed_roles']))) {
                return false;
            }
        }

        return true;
    }

    /**
     * Get matched instance for current request
     *
     * @return array|null Matched instance or null
     */
    public function get_matched_instance(): ?array {
        if (!$this->routing_done) {
            $this->perform_routing();
        }

        return $this->matched_instance;
    }

    /**
     * Check if current page has a matched instance
     *
     * @return bool Has match
     */
    public function has_match(): bool {
        return $this->get_matched_instance() !== null;
    }

    /**
     * Get matched instance ID
     *
     * @return int|null Instance ID or null
     */
    public function get_matched_instance_id(): ?int {
        $instance = $this->get_matched_instance();
        return $instance ? ($instance['id'] ?? null) : null;
    }

    /**
     * Test URL patterns for an instance
     *
     * @param array  $patterns Patterns to test
     * @param string $test_url URL to test against
     * @return array Test results
     */
    public function test_patterns(array $patterns, string $test_url): array {
        $parsed = wp_parse_url($test_url);
        $path = $parsed['path'] ?? '/';

        $results = [];

        foreach ($patterns as $pattern) {
            $results[] = [
                'pattern' => $pattern,
                'matches' => $this->pattern_matches($pattern, $test_url, $path),
            ];
        }

        return $results;
    }

    /**
     * Get all pattern types with descriptions
     *
     * @return array Pattern types
     */
    public function get_pattern_types(): array {
        return [
            'exact' => [
                'name' => 'Exact Path',
                'description' => 'Match exact URL path',
                'example' => '/about',
            ],
            'wildcard' => [
                'name' => 'Wildcard',
                'description' => 'Match with * wildcards',
                'example' => '/blog/*',
            ],
            'regex' => [
                'name' => 'Regex',
                'description' => 'Match with regular expression',
                'example' => 'regex:/^\/products\/\d+$/',
            ],
            'contains' => [
                'name' => 'Contains',
                'description' => 'URL contains string',
                'example' => 'contains:pricing',
            ],
            'post_type' => [
                'name' => 'Post Type',
                'description' => 'Match specific post type',
                'example' => 'post_type:product',
            ],
            'category' => [
                'name' => 'Category',
                'description' => 'Match category archive or post',
                'example' => 'category:news',
            ],
            'tag' => [
                'name' => 'Tag',
                'description' => 'Match tag archive or post',
                'example' => 'tag:featured',
            ],
            'taxonomy' => [
                'name' => 'Taxonomy',
                'description' => 'Match custom taxonomy',
                'example' => 'taxonomy:product_cat:clothing',
            ],
            'template' => [
                'name' => 'Page Template',
                'description' => 'Match page template',
                'example' => 'template:full-width.php',
            ],
            'page_id' => [
                'name' => 'Page ID',
                'description' => 'Match specific page IDs',
                'example' => 'page_id:42,43,44',
            ],
            'user_role' => [
                'name' => 'User Role',
                'description' => 'Match user role',
                'example' => 'user_role:subscriber,customer',
            ],
            'logged_in' => [
                'name' => 'Logged In',
                'description' => 'Match login status',
                'example' => 'logged_in:yes',
            ],
        ];
    }
}
