<?php
/**
 * Context Builder
 *
 * Builds context data for chat sessions including user info, page data, and dynamic tags.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class Context_Builder
 */
class Context_Builder {

    /**
     * Build context data for a chat instance
     *
     * @param array $instance Instance configuration
     * @return array Context data
     */
    public function build_context(array $instance): array {
        $context = [
            'site' => $this->get_site_context(),
            'user' => $this->get_user_context(),
            'page' => $this->get_page_context(),
            'datetime' => $this->get_datetime_context(),
        ];

        // Add WooCommerce context if available
        if ($this->is_woocommerce_active()) {
            $context['woocommerce'] = $this->get_woocommerce_context();
        }

        // Process system prompt with tags
        if (!empty($instance['systemPrompt'])) {
            $context['systemPrompt'] = $this->process_tags($instance['systemPrompt'], $context);
        }

        return $context;
    }

    /**
     * Get site-related context
     *
     * @return array
     */
    private function get_site_context(): array {
        return [
            'name' => get_bloginfo('name'),
            'url' => home_url(),
            'description' => get_bloginfo('description'),
            'language' => get_locale(),
            'timezone' => wp_timezone_string(),
        ];
    }

    /**
     * Get user-related context
     *
     * @return array
     */
    private function get_user_context(): array {
        if (!is_user_logged_in()) {
            return [
                'isLoggedIn' => false,
                'name' => __('Guest', 'flowchat'),
                'email' => '',
                'role' => 'guest',
            ];
        }

        $user = wp_get_current_user();

        return [
            'isLoggedIn' => true,
            'id' => $user->ID,
            'name' => $user->display_name,
            'email' => $user->user_email,
            'role' => $user->roles[0] ?? 'subscriber',
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
        ];
    }

    /**
     * Get current page context
     *
     * @return array
     */
    private function get_page_context(): array {
        global $post;

        $context = [
            'url' => $this->get_current_url(),
            'title' => $this->get_page_title(),
            'type' => 'unknown',
        ];

        if ($post instanceof \WP_Post) {
            $context['id'] = $post->ID;
            $context['type'] = $post->post_type;
            $context['slug'] = $post->post_name;
            $context['excerpt'] = $this->get_excerpt($post);
            $context['content'] = $this->get_content_preview($post);

            // Get categories and tags for posts
            if ($post->post_type === 'post') {
                $context['categories'] = $this->get_post_terms($post->ID, 'category');
                $context['tags'] = $this->get_post_terms($post->ID, 'post_tag');
            }

            // Get author
            $author = get_userdata($post->post_author);
            if ($author) {
                $context['author'] = $author->display_name;
            }
        }

        // Special page types
        if (is_front_page()) {
            $context['type'] = 'front_page';
        } elseif (is_home()) {
            $context['type'] = 'blog';
        } elseif (is_archive()) {
            $context['type'] = 'archive';
            $context['archiveTitle'] = get_the_archive_title();
        } elseif (is_search()) {
            $context['type'] = 'search';
            $context['searchQuery'] = get_search_query();
        } elseif (is_404()) {
            $context['type'] = '404';
        }

        return $context;
    }

    /**
     * Get datetime context
     *
     * @return array
     */
    private function get_datetime_context(): array {
        $timezone = wp_timezone();
        $now = new \DateTime('now', $timezone);

        return [
            'date' => $now->format('F j, Y'),
            'time' => $now->format('g:i a'),
            'day' => $now->format('l'),
            'timestamp' => $now->getTimestamp(),
            'iso' => $now->format('c'),
        ];
    }

    /**
     * Get WooCommerce context
     *
     * @return array
     */
    private function get_woocommerce_context(): array {
        if (!function_exists('WC') || !WC()->cart) {
            return [];
        }

        $cart = WC()->cart;
        $items = [];

        foreach ($cart->get_cart() as $cart_item) {
            $product = $cart_item['data'];
            $items[] = [
                'name' => $product->get_name(),
                'quantity' => $cart_item['quantity'],
                'price' => wc_price($product->get_price()),
            ];
        }

        return [
            'cartTotal' => $cart->get_cart_total(),
            'cartCount' => $cart->get_cart_contents_count(),
            'cartItems' => $items,
            'currency' => get_woocommerce_currency_symbol(),
            'isProductPage' => is_product(),
            'isShopPage' => is_shop(),
            'isCartPage' => is_cart(),
            'isCheckoutPage' => is_checkout(),
        ];
    }

    /**
     * Process dynamic tags in text
     *
     * @param string $text Text with tags
     * @param array $context Context data
     * @return string Processed text
     */
    public function process_tags(string $text, array $context): string {
        // Define tag mappings
        $tags = [
            // Site tags
            '{site_name}' => $context['site']['name'] ?? '',
            '{site_url}' => $context['site']['url'] ?? '',
            '{site_description}' => $context['site']['description'] ?? '',

            // Page tags
            '{current_page_url}' => $context['page']['url'] ?? '',
            '{current_page_title}' => $context['page']['title'] ?? '',
            '{current_page_content}' => $context['page']['content'] ?? '',
            '{current_page_excerpt}' => $context['page']['excerpt'] ?? '',
            '{current_page_type}' => $context['page']['type'] ?? '',

            // User tags
            '{user_name}' => $context['user']['name'] ?? 'Guest',
            '{user_email}' => $context['user']['email'] ?? '',
            '{user_role}' => $context['user']['role'] ?? 'guest',
            '{user_logged_in}' => ($context['user']['isLoggedIn'] ?? false) ? 'yes' : 'no',

            // Datetime tags
            '{current_date}' => $context['datetime']['date'] ?? '',
            '{current_time}' => $context['datetime']['time'] ?? '',
            '{current_day}' => $context['datetime']['day'] ?? '',
        ];

        // WooCommerce tags
        if (!empty($context['woocommerce'])) {
            $woo = $context['woocommerce'];
            $tags['{woo_cart_total}'] = $woo['cartTotal'] ?? '';
            $tags['{woo_cart_count}'] = (string) ($woo['cartCount'] ?? 0);
            $tags['{woo_currency}'] = $woo['currency'] ?? '';

            // Format cart items
            if (!empty($woo['cartItems'])) {
                $items_str = array_map(function($item) {
                    return $item['name'] . ' x' . $item['quantity'];
                }, $woo['cartItems']);
                $tags['{woo_cart_items}'] = implode(', ', $items_str);
            } else {
                $tags['{woo_cart_items}'] = '';
            }
        }

        // Replace all tags
        return str_replace(array_keys($tags), array_values($tags), $text);
    }

    /**
     * Get available tags for admin UI
     *
     * @return array
     */
    public function get_available_tags(): array {
        $tags = [
            'site' => [
                'label' => __('Site Information', 'flowchat'),
                'tags' => [
                    '{site_name}' => __('Site name', 'flowchat'),
                    '{site_url}' => __('Site URL', 'flowchat'),
                    '{site_description}' => __('Site tagline', 'flowchat'),
                ],
            ],
            'page' => [
                'label' => __('Current Page', 'flowchat'),
                'tags' => [
                    '{current_page_url}' => __('Page URL', 'flowchat'),
                    '{current_page_title}' => __('Page title', 'flowchat'),
                    '{current_page_excerpt}' => __('Page excerpt', 'flowchat'),
                    '{current_page_content}' => __('Page content (first 2000 chars)', 'flowchat'),
                    '{current_page_type}' => __('Page type (post, page, product, etc.)', 'flowchat'),
                ],
            ],
            'user' => [
                'label' => __('User Information', 'flowchat'),
                'tags' => [
                    '{user_name}' => __('User display name or "Guest"', 'flowchat'),
                    '{user_email}' => __('User email (empty if guest)', 'flowchat'),
                    '{user_role}' => __('User role or "guest"', 'flowchat'),
                    '{user_logged_in}' => __('"yes" or "no"', 'flowchat'),
                ],
            ],
            'datetime' => [
                'label' => __('Date & Time', 'flowchat'),
                'tags' => [
                    '{current_date}' => __('Current date (e.g., "December 10, 2024")', 'flowchat'),
                    '{current_time}' => __('Current time (e.g., "3:45 pm")', 'flowchat'),
                    '{current_day}' => __('Day of week (e.g., "Tuesday")', 'flowchat'),
                ],
            ],
        ];

        // Add WooCommerce tags if active
        if ($this->is_woocommerce_active()) {
            $tags['woocommerce'] = [
                'label' => __('WooCommerce', 'flowchat'),
                'tags' => [
                    '{woo_cart_total}' => __('Cart total with currency', 'flowchat'),
                    '{woo_cart_count}' => __('Number of items in cart', 'flowchat'),
                    '{woo_cart_items}' => __('Cart items list', 'flowchat'),
                    '{woo_currency}' => __('Currency symbol', 'flowchat'),
                ],
            ];
        }

        return $tags;
    }

    /**
     * Get current URL
     *
     * @return string
     */
    private function get_current_url(): string {
        global $wp;
        return home_url(add_query_arg([], $wp->request));
    }

    /**
     * Get page title
     *
     * @return string
     */
    private function get_page_title(): string {
        if (is_singular()) {
            return get_the_title();
        }

        if (is_archive()) {
            return get_the_archive_title();
        }

        if (is_search()) {
            return sprintf(
                /* translators: %s: search query */
                __('Search results for: %s', 'flowchat'),
                get_search_query()
            );
        }

        if (is_404()) {
            return __('Page not found', 'flowchat');
        }

        return get_bloginfo('name');
    }

    /**
     * Get post excerpt
     *
     * @param \WP_Post $post Post object
     * @return string
     */
    private function get_excerpt(\WP_Post $post): string {
        if (!empty($post->post_excerpt)) {
            return wp_strip_all_tags($post->post_excerpt);
        }

        $content = wp_strip_all_tags($post->post_content);
        return wp_trim_words($content, 55, '...');
    }

    /**
     * Get content preview (first 2000 chars)
     *
     * @param \WP_Post $post Post object
     * @return string
     */
    private function get_content_preview(\WP_Post $post): string {
        $content = wp_strip_all_tags($post->post_content);
        $content = preg_replace('/\s+/', ' ', $content);
        return mb_substr($content, 0, 2000);
    }

    /**
     * Get post terms
     *
     * @param int $post_id Post ID
     * @param string $taxonomy Taxonomy name
     * @return array Term names
     */
    private function get_post_terms(int $post_id, string $taxonomy): array {
        $terms = get_the_terms($post_id, $taxonomy);

        if (!$terms || is_wp_error($terms)) {
            return [];
        }

        return array_map(function($term) {
            return $term->name;
        }, $terms);
    }

    /**
     * Check if WooCommerce is active
     *
     * @return bool
     */
    private function is_woocommerce_active(): bool {
        return class_exists('WooCommerce');
    }
}
