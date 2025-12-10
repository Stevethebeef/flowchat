# FlowChat: Authentication & Security Specification

## Overview

FlowChat implements multiple layers of security: WordPress authentication for admin operations, nonce verification for AJAX/REST requests, capability checks for access control, and secure data passthrough to n8n workflows.

## Security Architecture

### Security Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client (Browser)                          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 1: Transport Security                   │
│                    (HTTPS enforcement)                           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 2: Request Validation                   │
│                    (Nonce verification, Rate limiting)           │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 3: Authentication                       │
│                    (WordPress user sessions)                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 4: Authorization                        │
│                    (Capability checks, Instance access)          │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Layer 5: Data Validation                      │
│                    (Input sanitization, Output escaping)         │
└─────────────────────────────────────────────────────────────────┘
```

## WordPress Authentication

### Admin Authentication

```php
<?php
// includes/security/class-admin-auth.php

namespace FlowChat\Security;

class Admin_Auth {
    
    /**
     * Required capability for admin access
     */
    public const ADMIN_CAPABILITY = 'manage_options';
    
    /**
     * Required capability for instance management
     */
    public const INSTANCE_CAPABILITY = 'edit_posts';
    
    /**
     * Check if current user can access admin
     */
    public static function can_access_admin(): bool {
        return current_user_can(self::ADMIN_CAPABILITY);
    }
    
    /**
     * Check if current user can manage instances
     */
    public static function can_manage_instances(): bool {
        return current_user_can(self::ADMIN_CAPABILITY);
    }
    
    /**
     * Check if current user can view instances
     */
    public static function can_view_instances(): bool {
        return current_user_can(self::INSTANCE_CAPABILITY);
    }
    
    /**
     * Verify admin request
     */
    public static function verify_admin_request(string $nonce_action): bool {
        // Check nonce
        $nonce = $_REQUEST['_wpnonce'] ?? '';
        if (!wp_verify_nonce($nonce, $nonce_action)) {
            return false;
        }
        
        // Check capability
        if (!self::can_access_admin()) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Require admin authentication (die on failure)
     */
    public static function require_admin(string $nonce_action): void {
        if (!self::verify_admin_request($nonce_action)) {
            wp_die(
                __('You do not have permission to access this page.', 'flowchat'),
                __('Access Denied', 'flowchat'),
                ['response' => 403]
            );
        }
    }
}
```

### Frontend User Context

```php
<?php
// includes/security/class-user-context.php

namespace FlowChat\Security;

class User_Context {
    
    /**
     * Get current user data for frontend
     */
    public static function get_frontend_context(): array {
        $user = wp_get_current_user();
        
        if (!$user->exists()) {
            return [
                'isLoggedIn' => false,
                'id' => 0,
                'email' => '',
                'displayName' => '',
                'roles' => [],
            ];
        }
        
        return [
            'isLoggedIn' => true,
            'id' => $user->ID,
            'email' => $user->user_email,
            'displayName' => $user->display_name,
            'roles' => $user->roles,
            'firstName' => $user->first_name,
            'lastName' => $user->last_name,
        ];
    }
    
    /**
     * Get sanitized user data for n8n passthrough
     */
    public static function get_n8n_user_data(): array {
        $user = wp_get_current_user();
        
        if (!$user->exists()) {
            return [];
        }
        
        // Only include safe, non-sensitive data
        return [
            'id' => $user->ID,
            'email' => sanitize_email($user->user_email),
            'displayName' => sanitize_text_field($user->display_name),
            'roles' => array_map('sanitize_key', $user->roles),
        ];
    }
    
    /**
     * Check if current user can access specific instance
     */
    public static function can_access_instance(array $instance): bool {
        $access = $instance['access'] ?? [];
        
        // Check login requirement
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return false;
        }
        
        // Check role restrictions
        if (!empty($access['allowedRoles']) && is_user_logged_in()) {
            $user = wp_get_current_user();
            $allowed_roles = $access['allowedRoles'];
            
            if (!array_intersect($allowed_roles, $user->roles)) {
                return false;
            }
        }
        
        return true;
    }
}
```

## Nonce System

### Nonce Generation

```php
<?php
// includes/security/class-nonce-manager.php

namespace FlowChat\Security;

class Nonce_Manager {
    
    /**
     * Nonce action prefixes
     */
    private const PREFIX = 'flowchat_';
    
    /**
     * Nonce actions
     */
    public const ACTION_CHAT = 'flowchat_chat';
    public const ACTION_ADMIN = 'flowchat_admin';
    public const ACTION_SETTINGS = 'flowchat_settings';
    public const ACTION_INSTANCE = 'flowchat_instance';
    public const ACTION_LICENSE = 'flowchat_license';
    
    /**
     * Create nonce for action
     */
    public static function create(string $action): string {
        return wp_create_nonce($action);
    }
    
    /**
     * Create chat nonce (includes user ID for logged-in users)
     */
    public static function create_chat_nonce(): string {
        $user_id = get_current_user_id();
        return wp_create_nonce(self::ACTION_CHAT . '_' . $user_id);
    }
    
    /**
     * Verify nonce
     */
    public static function verify(string $nonce, string $action): bool {
        return wp_verify_nonce($nonce, $action) !== false;
    }
    
    /**
     * Verify chat nonce
     */
    public static function verify_chat_nonce(string $nonce, int $user_id = 0): bool {
        return wp_verify_nonce($nonce, self::ACTION_CHAT . '_' . $user_id) !== false;
    }
    
    /**
     * Get all nonces for frontend localization
     */
    public static function get_frontend_nonces(): array {
        return [
            'chat' => self::create_chat_nonce(),
            'rest' => wp_create_nonce('wp_rest'),
        ];
    }
}
```

### REST API Authentication

```php
<?php
// includes/api/class-rest-auth.php

namespace FlowChat\API;

class REST_Auth {
    
    /**
     * Permission callback for public endpoints
     */
    public static function public_permission(): bool {
        return true;
    }
    
    /**
     * Permission callback for authenticated endpoints
     */
    public static function authenticated_permission(): bool {
        return is_user_logged_in();
    }
    
    /**
     * Permission callback for admin endpoints
     */
    public static function admin_permission(): bool {
        return current_user_can('manage_options');
    }
    
    /**
     * Permission callback for instance-specific access
     */
    public static function instance_permission(\WP_REST_Request $request): bool {
        $instance_id = $request->get_param('instance_id');
        
        if (!$instance_id) {
            return false;
        }
        
        $instance = \FlowChat\FlowChat_Instances::get($instance_id);
        
        if (!$instance) {
            return false;
        }
        
        return \FlowChat\Security\User_Context::can_access_instance($instance);
    }
    
    /**
     * Validate nonce in REST request
     */
    public static function validate_nonce(\WP_REST_Request $request): bool {
        $nonce = $request->get_header('X-WP-Nonce');
        
        if (!$nonce) {
            $nonce = $request->get_param('_wpnonce');
        }
        
        return wp_verify_nonce($nonce, 'wp_rest');
    }
}
```

## Data Validation & Sanitization

### Input Sanitization

```php
<?php
// includes/security/class-sanitizer.php

namespace FlowChat\Security;

class Sanitizer {
    
    /**
     * Sanitize chat message input
     */
    public static function sanitize_message(string $message): string {
        // Remove any HTML tags
        $message = wp_strip_all_tags($message);
        
        // Limit length
        $message = substr($message, 0, 10000);
        
        // Remove null bytes
        $message = str_replace("\0", '', $message);
        
        return $message;
    }
    
    /**
     * Sanitize instance ID
     */
    public static function sanitize_instance_id(string $id): string {
        return sanitize_key($id);
    }
    
    /**
     * Sanitize webhook URL
     */
    public static function sanitize_webhook_url(string $url): string {
        $url = esc_url_raw($url);
        
        // Validate URL structure
        if (!filter_var($url, FILTER_VALIDATE_URL)) {
            return '';
        }
        
        // Require HTTPS
        if (strpos($url, 'https://') !== 0) {
            return '';
        }
        
        return $url;
    }
    
    /**
     * Sanitize instance configuration
     */
    public static function sanitize_instance_config(array $config): array {
        return [
            'id' => self::sanitize_instance_id($config['id'] ?? ''),
            'name' => sanitize_text_field($config['name'] ?? ''),
            'description' => sanitize_textarea_field($config['description'] ?? ''),
            'enabled' => (bool) ($config['enabled'] ?? true),
            
            'connection' => [
                'webhookUrl' => self::sanitize_webhook_url($config['connection']['webhookUrl'] ?? ''),
                'streaming' => (bool) ($config['connection']['streaming'] ?? true),
                'timeout' => min(max((int) ($config['connection']['timeout'] ?? 30000), 5000), 120000),
                'authPassthrough' => (bool) ($config['connection']['authPassthrough'] ?? false),
            ],
            
            'behavior' => [
                'welcomeMessage' => sanitize_textarea_field($config['behavior']['welcomeMessage'] ?? ''),
                'inputPlaceholder' => sanitize_text_field($config['behavior']['inputPlaceholder'] ?? ''),
                'systemPrompt' => sanitize_textarea_field($config['behavior']['systemPrompt'] ?? ''),
            ],
            
            'appearance' => [
                'theme' => in_array($config['appearance']['theme'] ?? '', ['light', 'dark', 'auto']) 
                         ? $config['appearance']['theme'] 
                         : 'light',
                'primaryColor' => sanitize_hex_color($config['appearance']['primaryColor'] ?? '') ?: '#0066cc',
                'avatar' => esc_url_raw($config['appearance']['avatar'] ?? ''),
            ],
            
            'access' => [
                'requireLogin' => (bool) ($config['access']['requireLogin'] ?? false),
                'allowedRoles' => array_map('sanitize_key', $config['access']['allowedRoles'] ?? []),
            ],
            
            'errors' => array_map('sanitize_textarea_field', $config['errors'] ?? []),
        ];
    }
    
    /**
     * Sanitize user roles array
     */
    public static function sanitize_roles(array $roles): array {
        $valid_roles = array_keys(wp_roles()->roles);
        
        return array_filter(
            array_map('sanitize_key', $roles),
            fn($role) => in_array($role, $valid_roles)
        );
    }
}
```

### Output Escaping

```php
<?php
// includes/security/class-escaper.php

namespace FlowChat\Security;

class Escaper {
    
    /**
     * Escape configuration for JavaScript output
     */
    public static function escape_for_js(array $config): array {
        return array_map(function ($value) {
            if (is_string($value)) {
                return esc_js($value);
            }
            if (is_array($value)) {
                return self::escape_for_js($value);
            }
            return $value;
        }, $config);
    }
    
    /**
     * Escape HTML attributes
     */
    public static function escape_attrs(array $attrs): string {
        $escaped = [];
        
        foreach ($attrs as $key => $value) {
            $escaped[] = sprintf(
                '%s="%s"',
                esc_attr($key),
                esc_attr($value)
            );
        }
        
        return implode(' ', $escaped);
    }
    
    /**
     * Escape data attributes for container
     */
    public static function escape_data_attrs(array $data): string {
        $attrs = [];
        
        foreach ($data as $key => $value) {
            if (is_array($value)) {
                $value = wp_json_encode($value);
            }
            
            $attrs[] = sprintf(
                'data-%s="%s"',
                esc_attr($key),
                esc_attr($value)
            );
        }
        
        return implode(' ', $attrs);
    }
}
```

## n8n Authentication Passthrough

### Secure Data Transmission

```php
<?php
// includes/security/class-n8n-auth.php

namespace FlowChat\Security;

class N8n_Auth {
    
    /**
     * Build authenticated payload for n8n
     */
    public static function build_auth_payload(array $instance): array {
        $payload = [];
        
        // Only include auth data if passthrough is enabled
        if (empty($instance['connection']['authPassthrough'])) {
            return $payload;
        }
        
        // Get user data
        $user_data = User_Context::get_n8n_user_data();
        
        if (!empty($user_data)) {
            $payload['user'] = $user_data;
        }
        
        // Add verification signature
        $payload['signature'] = self::generate_signature($user_data);
        $payload['timestamp'] = time();
        
        return $payload;
    }
    
    /**
     * Generate HMAC signature for payload
     */
    private static function generate_signature(array $data): string {
        $secret = self::get_signing_secret();
        $payload = wp_json_encode($data);
        
        return hash_hmac('sha256', $payload, $secret);
    }
    
    /**
     * Get or generate signing secret
     */
    private static function get_signing_secret(): string {
        $secret = get_option('flowchat_signing_secret');
        
        if (!$secret) {
            $secret = wp_generate_password(64, true, true);
            update_option('flowchat_signing_secret', $secret, false);
        }
        
        return $secret;
    }
    
    /**
     * Get signing secret for n8n configuration
     * (Admin only - for setting up n8n webhook verification)
     */
    public static function get_admin_signing_secret(): string {
        if (!current_user_can('manage_options')) {
            return '';
        }
        
        return self::get_signing_secret();
    }
}
```

### Frontend Auth Integration

```typescript
// src/runtime/authPayload.ts

export interface AuthPayload {
  user?: {
    id: number;
    email: string;
    displayName: string;
    roles: string[];
  };
  signature?: string;
  timestamp?: number;
}

export function buildAuthPayload(
  config: N8nAdapterConfig
): AuthPayload {
  if (!config.auth.enabled) {
    return {};
  }
  
  const payload: AuthPayload = {};
  
  if (config.auth.userId) {
    payload.user = {
      id: config.auth.userId,
      email: config.auth.userEmail ?? '',
      displayName: config.auth.userDisplayName ?? '',
      roles: config.auth.userRoles ?? [],
    };
  }
  
  // Signature is generated server-side and passed to frontend
  if (config.auth.signature) {
    payload.signature = config.auth.signature;
    payload.timestamp = config.auth.timestamp;
  }
  
  return payload;
}
```

## Rate Limiting

### Rate Limiter Implementation

```php
<?php
// includes/security/class-rate-limiter.php

namespace FlowChat\Security;

class Rate_Limiter {
    
    /**
     * Rate limit configurations
     */
    private const LIMITS = [
        'chat_message' => [
            'requests' => 30,
            'window' => 60, // seconds
        ],
        'chat_session' => [
            'requests' => 100,
            'window' => 3600, // 1 hour
        ],
        'api_request' => [
            'requests' => 60,
            'window' => 60,
        ],
    ];
    
    /**
     * Check if request is rate limited
     */
    public static function is_limited(string $type, string $identifier): bool {
        $config = self::LIMITS[$type] ?? self::LIMITS['api_request'];
        $key = self::get_key($type, $identifier);
        
        $data = get_transient($key);
        
        if (!$data) {
            return false;
        }
        
        return $data['count'] >= $config['requests'];
    }
    
    /**
     * Record a request
     */
    public static function record(string $type, string $identifier): void {
        $config = self::LIMITS[$type] ?? self::LIMITS['api_request'];
        $key = self::get_key($type, $identifier);
        
        $data = get_transient($key);
        
        if (!$data) {
            $data = [
                'count' => 0,
                'first_request' => time(),
            ];
        }
        
        $data['count']++;
        
        // Calculate remaining time in window
        $elapsed = time() - $data['first_request'];
        $remaining = max(1, $config['window'] - $elapsed);
        
        set_transient($key, $data, $remaining);
    }
    
    /**
     * Get remaining requests
     */
    public static function get_remaining(string $type, string $identifier): int {
        $config = self::LIMITS[$type] ?? self::LIMITS['api_request'];
        $key = self::get_key($type, $identifier);
        
        $data = get_transient($key);
        
        if (!$data) {
            return $config['requests'];
        }
        
        return max(0, $config['requests'] - $data['count']);
    }
    
    /**
     * Get transient key
     */
    private static function get_key(string $type, string $identifier): string {
        return 'flowchat_rate_' . md5($type . '_' . $identifier);
    }
    
    /**
     * Get client identifier
     */
    public static function get_client_id(): string {
        // Use user ID if logged in
        if (is_user_logged_in()) {
            return 'user_' . get_current_user_id();
        }
        
        // Use IP for guests (hashed for privacy)
        $ip = self::get_client_ip();
        return 'ip_' . md5($ip . SECURE_AUTH_SALT);
    }
    
    /**
     * Get client IP
     */
    private static function get_client_ip(): string {
        $headers = [
            'HTTP_CF_CONNECTING_IP', // Cloudflare
            'HTTP_X_FORWARDED_FOR',
            'HTTP_X_REAL_IP',
            'REMOTE_ADDR',
        ];
        
        foreach ($headers as $header) {
            if (!empty($_SERVER[$header])) {
                $ip = $_SERVER[$header];
                
                // Handle comma-separated IPs
                if (strpos($ip, ',') !== false) {
                    $ip = trim(explode(',', $ip)[0]);
                }
                
                if (filter_var($ip, FILTER_VALIDATE_IP)) {
                    return $ip;
                }
            }
        }
        
        return '0.0.0.0';
    }
}
```

### Rate Limit Middleware

```php
<?php
// includes/api/class-rate-limit-middleware.php

namespace FlowChat\API;

use FlowChat\Security\Rate_Limiter;

class Rate_Limit_Middleware {
    
    /**
     * Apply rate limiting to REST request
     */
    public static function check(\WP_REST_Request $request): bool|\WP_Error {
        $client_id = Rate_Limiter::get_client_id();
        $type = self::get_limit_type($request);
        
        if (Rate_Limiter::is_limited($type, $client_id)) {
            return new \WP_Error(
                'rate_limited',
                __('Too many requests. Please try again later.', 'flowchat'),
                ['status' => 429]
            );
        }
        
        // Record this request
        Rate_Limiter::record($type, $client_id);
        
        return true;
    }
    
    /**
     * Add rate limit headers to response
     */
    public static function add_headers(\WP_REST_Response $response): \WP_REST_Response {
        $client_id = Rate_Limiter::get_client_id();
        $remaining = Rate_Limiter::get_remaining('api_request', $client_id);
        
        $response->header('X-RateLimit-Remaining', $remaining);
        
        return $response;
    }
    
    /**
     * Get limit type based on request
     */
    private static function get_limit_type(\WP_REST_Request $request): string {
        $route = $request->get_route();
        
        if (strpos($route, '/chat/') !== false) {
            return 'chat_message';
        }
        
        return 'api_request';
    }
}
```

## CORS Configuration

### CORS Headers

```php
<?php
// includes/security/class-cors.php

namespace FlowChat\Security;

class CORS {
    
    /**
     * Add CORS headers for n8n requests
     */
    public static function add_headers(): void {
        // Get allowed origins from settings
        $allowed_origins = self::get_allowed_origins();
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
        
        if (self::is_allowed_origin($origin, $allowed_origins)) {
            header('Access-Control-Allow-Origin: ' . $origin);
            header('Access-Control-Allow-Methods: POST, GET, OPTIONS');
            header('Access-Control-Allow-Headers: Content-Type, X-WP-Nonce, X-FlowChat-Instance');
            header('Access-Control-Allow-Credentials: true');
            header('Access-Control-Max-Age: 86400');
        }
    }
    
    /**
     * Handle preflight request
     */
    public static function handle_preflight(): void {
        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            self::add_headers();
            exit;
        }
    }
    
    /**
     * Get allowed origins
     */
    private static function get_allowed_origins(): array {
        $origins = [home_url()];
        
        // Add any additional origins from settings
        $additional = get_option('flowchat_cors_origins', []);
        
        if (is_array($additional)) {
            $origins = array_merge($origins, $additional);
        }
        
        return array_unique($origins);
    }
    
    /**
     * Check if origin is allowed
     */
    private static function is_allowed_origin(string $origin, array $allowed): bool {
        if (empty($origin)) {
            return false;
        }
        
        foreach ($allowed as $allowed_origin) {
            if ($origin === $allowed_origin) {
                return true;
            }
            
            // Support wildcard subdomains
            if (strpos($allowed_origin, '*.') === 0) {
                $domain = substr($allowed_origin, 2);
                if (preg_match('/^https?:\/\/[a-z0-9-]+\.' . preg_quote($domain) . '$/', $origin)) {
                    return true;
                }
            }
        }
        
        return false;
    }
}
```

## Content Security Policy

### CSP Headers

```php
<?php
// includes/security/class-csp.php

namespace FlowChat\Security;

class CSP {
    
    /**
     * Add CSP headers for FlowChat resources
     */
    public static function add_headers(): void {
        // Only add on pages with FlowChat
        if (!self::has_flowchat_on_page()) {
            return;
        }
        
        $policy = self::build_policy();
        
        header('Content-Security-Policy: ' . $policy);
    }
    
    /**
     * Build CSP policy
     */
    private static function build_policy(): string {
        $directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'", // Required for wp_localize_script
            "style-src 'self' 'unsafe-inline'",  // Required for CSS variables
            "img-src 'self' data: https:",       // Allow data URIs for avatars
            "connect-src 'self' " . self::get_connect_sources(),
            "frame-ancestors 'self'",
        ];
        
        return implode('; ', $directives);
    }
    
    /**
     * Get connect-src for n8n endpoints
     */
    private static function get_connect_sources(): string {
        $sources = [];
        
        // Get all instance webhook URLs
        $instances = \FlowChat\FlowChat_Instances::get_all();
        
        foreach ($instances as $instance) {
            $url = $instance['connection']['webhookUrl'] ?? '';
            if ($url) {
                $parsed = parse_url($url);
                if ($parsed && isset($parsed['host'])) {
                    $sources[] = $parsed['scheme'] . '://' . $parsed['host'];
                }
            }
        }
        
        return implode(' ', array_unique($sources));
    }
    
    /**
     * Check if current page has FlowChat
     */
    private static function has_flowchat_on_page(): bool {
        global $post;
        
        if (!$post) {
            return false;
        }
        
        // Check for shortcode or block
        return has_shortcode($post->post_content, 'flowchat')
            || has_block('flowchat/chat', $post);
    }
}
```

## Instance Access Control

### Access Control Logic

```php
<?php
// includes/security/class-instance-access.php

namespace FlowChat\Security;

class Instance_Access {
    
    /**
     * Check if user can access instance
     */
    public static function can_access(array $instance): bool {
        $access = $instance['access'] ?? [];
        
        // Instance disabled
        if (empty($instance['enabled'])) {
            return false;
        }
        
        // Check login requirement
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return false;
        }
        
        // Check role restrictions
        if (!empty($access['allowedRoles'])) {
            if (!is_user_logged_in()) {
                return false;
            }
            
            $user = wp_get_current_user();
            if (!array_intersect($access['allowedRoles'], $user->roles)) {
                return false;
            }
        }
        
        // Check page restrictions
        if (!self::check_page_access($access)) {
            return false;
        }
        
        return true;
    }
    
    /**
     * Check page-based access rules
     */
    private static function check_page_access(array $access): bool {
        global $post;
        
        // Include pages
        if (!empty($access['includePages'])) {
            if (!$post) {
                return false;
            }
            
            $allowed = false;
            foreach ($access['includePages'] as $rule) {
                if (self::matches_page_rule($rule, $post)) {
                    $allowed = true;
                    break;
                }
            }
            
            if (!$allowed) {
                return false;
            }
        }
        
        // Exclude pages
        if (!empty($access['excludePages']) && $post) {
            foreach ($access['excludePages'] as $rule) {
                if (self::matches_page_rule($rule, $post)) {
                    return false;
                }
            }
        }
        
        return true;
    }
    
    /**
     * Check if page matches rule
     */
    private static function matches_page_rule(string $rule, \WP_Post $post): bool {
        // Exact ID match
        if (is_numeric($rule) && (int) $rule === $post->ID) {
            return true;
        }
        
        // Slug match
        if ($rule === $post->post_name) {
            return true;
        }
        
        // Post type match
        if (strpos($rule, 'type:') === 0) {
            $type = substr($rule, 5);
            return $post->post_type === $type;
        }
        
        // URL pattern match (wildcard support)
        if (strpos($rule, '/') === 0) {
            $current_url = $_SERVER['REQUEST_URI'] ?? '';
            $pattern = str_replace('*', '.*', $rule);
            return preg_match('#^' . $pattern . '$#', $current_url);
        }
        
        return false;
    }
    
    /**
     * Get access denied message for instance
     */
    public static function get_denied_message(array $instance): string {
        $access = $instance['access'] ?? [];
        
        if (!empty($access['requireLogin']) && !is_user_logged_in()) {
            return $access['loginMessage'] ?? __('Please log in to use chat.', 'flowchat');
        }
        
        return $instance['errors']['accessDeniedMessage'] 
            ?? __('You do not have permission to access this chat.', 'flowchat');
    }
}
```

## Security Checklist

### Server-Side Security

- [ ] All user input sanitized before use
- [ ] All output escaped appropriately
- [ ] Nonce verification on all state-changing requests
- [ ] Capability checks on all admin operations
- [ ] Rate limiting on public endpoints
- [ ] CSRF protection via WordPress nonces
- [ ] SQL injection prevention via prepared statements
- [ ] XSS prevention via proper escaping

### Frontend Security

- [ ] No sensitive data in client-side code
- [ ] Nonces included in all API requests
- [ ] Input validation before submission
- [ ] Content Security Policy headers
- [ ] No inline event handlers in HTML

### n8n Integration Security

- [ ] HTTPS required for webhook URLs
- [ ] Payload signature verification available
- [ ] Minimal user data transmitted
- [ ] No sensitive credentials in payloads
- [ ] Timestamp to prevent replay attacks

### Data Storage Security

- [ ] Sensitive options stored with autoload=false
- [ ] Webhook URLs validated and sanitized
- [ ] No storage of user passwords or tokens
- [ ] Session data properly scoped

## Related Documentation

- [07-api-endpoints.md](./07-api-endpoints.md) - REST API implementation
- [06-n8n-runtime-adapter.md](./06-n8n-runtime-adapter.md) - n8n communication
- [02-database-schema.md](./02-database-schema.md) - Data storage
