<?php
/**
 * License REST API Endpoints
 *
 * Handles license-related API endpoints for the admin panel.
 *
 * @package N8nChat
 */

namespace N8nChat\API;

use N8nChat\Core\License_Manager;

if (!defined('ABSPATH')) {
    exit;
}

/**
 * Class License_Endpoints
 */
class License_Endpoints {

    /**
     * API namespace
     */
    private const NAMESPACE = 'n8n-chat/v1/admin';

    /**
     * License manager
     *
     * @var License_Manager
     */
    private License_Manager $license_manager;

    /**
     * Constructor
     */
    public function __construct() {
        $this->license_manager = License_Manager::get_instance();

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes
     */
    public function register_routes(): void {
        // Get license status
        register_rest_route(self::NAMESPACE, '/license', [
            'methods' => 'GET',
            'callback' => [$this, 'get_license_status'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Activate license
        register_rest_route(self::NAMESPACE, '/license/activate', [
            'methods' => 'POST',
            'callback' => [$this, 'activate_license'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'license_key' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
                'email' => [
                    'required' => true,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                ],
            ],
        ]);

        // Deactivate license
        register_rest_route(self::NAMESPACE, '/license/deactivate', [
            'methods' => 'POST',
            'callback' => [$this, 'deactivate_license'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Revalidate license
        register_rest_route(self::NAMESPACE, '/license/revalidate', [
            'methods' => 'POST',
            'callback' => [$this, 'revalidate_license'],
            'permission_callback' => [$this, 'check_admin_permission'],
        ]);

        // Get resend license URL
        register_rest_route(self::NAMESPACE, '/license/resend-url', [
            'methods' => 'GET',
            'callback' => [$this, 'get_resend_url'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'email' => [
                    'required' => false,
                    'type' => 'string',
                    'sanitize_callback' => 'sanitize_email',
                ],
            ],
        ]);

        // Get purchase URL
        register_rest_route(self::NAMESPACE, '/license/purchase-url', [
            'methods' => 'GET',
            'callback' => [$this, 'get_purchase_url'],
            'permission_callback' => [$this, 'check_admin_permission'],
            'args' => [
                'campaign' => [
                    'required' => false,
                    'type' => 'string',
                    'default' => 'plugin',
                    'sanitize_callback' => 'sanitize_text_field',
                ],
            ],
        ]);
    }

    /**
     * Check admin permission
     *
     * @return bool
     */
    public function check_admin_permission(): bool {
        return current_user_can('manage_options');
    }

    /**
     * Get license status
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_license_status(\WP_REST_Request $request): \WP_REST_Response {
        $status = $this->license_manager->get_premium_status();
        $license = $this->license_manager->get_license();

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'is_premium' => $status['is_premium'],
                'status' => $status['status'],
                'email' => $status['email'],
                'license_key_masked' => $this->mask_license_key($license['license_key'] ?? ''),
                'valid_until' => $status['valid_until'],
                'grace_until' => $status['grace_until'],
                'days_left' => $status['days_left'],
                'grace_days_left' => $status['grace_days_left'],
                'offline_mode' => $status['offline_mode'],
                'last_checked' => $status['last_checked'],
                'purchase_url' => $this->license_manager->get_purchase_url('status'),
                'resend_url' => $this->license_manager->get_resend_url($status['email']),
            ],
        ]);
    }

    /**
     * Activate license
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function activate_license(\WP_REST_Request $request): \WP_REST_Response {
        $license_key = $request->get_param('license_key');
        $email = $request->get_param('email');

        $result = $this->license_manager->activate($license_key, $email);

        $http_code = $result['success'] ? 200 : 400;

        // Handle network errors differently
        if (isset($result['status']) && $result['status'] === 'network_error') {
            $http_code = 503; // Service Unavailable
        }

        return new \WP_REST_Response([
            'success' => $result['success'],
            'data' => [
                'status' => $result['status'] ?? 'error',
                'valid_until' => $result['valid_until'] ?? null,
                'grace_until' => $result['grace_until'] ?? null,
                'message' => $result['message'] ?? '',
            ],
        ], $http_code);
    }

    /**
     * Deactivate license
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function deactivate_license(\WP_REST_Request $request): \WP_REST_Response {
        $result = $this->license_manager->deactivate();

        return new \WP_REST_Response([
            'success' => $result,
            'data' => [
                'message' => $result
                    ? __('License deactivated successfully.', 'n8n-chat')
                    : __('Failed to deactivate license.', 'n8n-chat'),
            ],
        ]);
    }

    /**
     * Revalidate license
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function revalidate_license(\WP_REST_Request $request): \WP_REST_Response {
        $result = $this->license_manager->revalidate();

        $http_code = $result['success'] ? 200 : 400;

        if (isset($result['status']) && $result['status'] === 'network_error') {
            $http_code = 503;
        }

        return new \WP_REST_Response([
            'success' => $result['success'],
            'data' => [
                'status' => $result['status'] ?? 'error',
                'message' => $result['message'] ?? '',
            ],
        ], $http_code);
    }

    /**
     * Get resend license URL
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_resend_url(\WP_REST_Request $request): \WP_REST_Response {
        $email = $request->get_param('email');

        if (empty($email)) {
            $license = $this->license_manager->get_license();
            $email = $license['email'] ?? '';
        }

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'url' => $this->license_manager->get_resend_url($email),
            ],
        ]);
    }

    /**
     * Get purchase URL
     *
     * @param \WP_REST_Request $request Request object
     * @return \WP_REST_Response
     */
    public function get_purchase_url(\WP_REST_Request $request): \WP_REST_Response {
        $campaign = $request->get_param('campaign');

        return new \WP_REST_Response([
            'success' => true,
            'data' => [
                'url' => $this->license_manager->get_purchase_url($campaign),
            ],
        ]);
    }

    /**
     * Mask license key for display
     *
     * @param string $key License key
     * @return string Masked key
     */
    private function mask_license_key(string $key): string {
        if (empty($key)) {
            return '';
        }

        // Show first 4 and last 4 characters
        $length = strlen($key);
        if ($length <= 8) {
            return str_repeat('*', $length);
        }

        return substr($key, 0, 4) . str_repeat('*', $length - 8) . substr($key, -4);
    }
}
