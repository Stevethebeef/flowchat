<?php
/**
 * JWT Manager for FlowChat
 *
 * Handles JWT token generation and validation for direct
 * browser-to-n8n streaming authentication.
 *
 * @package FlowChat
 */

namespace FlowChat\Core;

defined('ABSPATH') || exit;

/**
 * JWT Manager class
 */
class JWT_Manager {

    /**
     * Token expiration time in seconds (1 hour)
     */
    const TOKEN_EXPIRY = 3600;

    /**
     * Refresh threshold in seconds (5 minutes before expiry)
     */
    const REFRESH_THRESHOLD = 300;

    /**
     * Algorithm used for signing
     */
    const ALGORITHM = 'HS256';

    /**
     * Singleton instance
     */
    private static ?JWT_Manager $instance = null;

    /**
     * Secret key for signing
     */
    private string $secret_key;

    /**
     * Get singleton instance
     */
    public static function get_instance(): JWT_Manager {
        if (null === self::$instance) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    /**
     * Constructor
     */
    private function __construct() {
        $this->secret_key = $this->get_secret_key();
    }

    /**
     * Get or create secret key
     *
     * @return string Secret key
     */
    private function get_secret_key(): string {
        $key = get_option('flowchat_jwt_secret');

        if (empty($key)) {
            // Generate a secure random key
            $key = wp_generate_password(64, true, true);
            update_option('flowchat_jwt_secret', $key, false);
        }

        return $key;
    }

    /**
     * Generate JWT token for a session
     *
     * @param int    $instance_id Instance ID
     * @param string $session_id Session ID
     * @param int    $user_id User ID (0 for guest)
     * @param array  $extra_claims Additional claims
     * @return string JWT token
     */
    public function generate_token(
        int $instance_id,
        string $session_id,
        int $user_id = 0,
        array $extra_claims = []
    ): string {
        $now = time();
        $expiry = $now + self::TOKEN_EXPIRY;

        $header = [
            'typ' => 'JWT',
            'alg' => self::ALGORITHM,
        ];

        $payload = [
            'iss' => home_url(),
            'iat' => $now,
            'exp' => $expiry,
            'nbf' => $now,
            'jti' => wp_generate_uuid4(),
            'sub' => $session_id,
            'instance_id' => $instance_id,
            'user_id' => $user_id,
            'site_id' => get_current_blog_id(),
        ];

        // Add extra claims
        if (!empty($extra_claims)) {
            $payload = array_merge($payload, $extra_claims);
        }

        // Generate nonce for added security
        $payload['nonce'] = wp_create_nonce('flowchat_jwt_' . $session_id);

        return $this->encode_token($header, $payload);
    }

    /**
     * Encode JWT token
     *
     * @param array $header Header data
     * @param array $payload Payload data
     * @return string Encoded token
     */
    private function encode_token(array $header, array $payload): string {
        $header_b64 = $this->base64_url_encode(wp_json_encode($header));
        $payload_b64 = $this->base64_url_encode(wp_json_encode($payload));

        $signature_input = $header_b64 . '.' . $payload_b64;
        $signature = $this->sign($signature_input);
        $signature_b64 = $this->base64_url_encode($signature);

        return $header_b64 . '.' . $payload_b64 . '.' . $signature_b64;
    }

    /**
     * Validate and decode JWT token
     *
     * @param string $token JWT token
     * @return array|null Decoded payload or null if invalid
     */
    public function validate_token(string $token): ?array {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        list($header_b64, $payload_b64, $signature_b64) = $parts;

        // Verify signature
        $signature_input = $header_b64 . '.' . $payload_b64;
        $expected_signature = $this->sign($signature_input);
        $actual_signature = $this->base64_url_decode($signature_b64);

        if (!hash_equals($expected_signature, $actual_signature)) {
            return null;
        }

        // Decode header
        $header = json_decode($this->base64_url_decode($header_b64), true);
        if (!$header || ($header['alg'] ?? '') !== self::ALGORITHM) {
            return null;
        }

        // Decode payload
        $payload = json_decode($this->base64_url_decode($payload_b64), true);
        if (!$payload) {
            return null;
        }

        // Check expiration
        if (($payload['exp'] ?? 0) < time()) {
            return null;
        }

        // Check not before
        if (($payload['nbf'] ?? 0) > time()) {
            return null;
        }

        // Check issuer
        if (($payload['iss'] ?? '') !== home_url()) {
            return null;
        }

        return $payload;
    }

    /**
     * Refresh token if needed
     *
     * @param string $token Current token
     * @return array Result with new token if refreshed
     */
    public function refresh_if_needed(string $token): array {
        $payload = $this->validate_token($token);

        if (!$payload) {
            return [
                'refreshed' => false,
                'error' => 'Invalid token',
            ];
        }

        // Check if needs refresh
        $time_to_expiry = ($payload['exp'] ?? 0) - time();

        if ($time_to_expiry > self::REFRESH_THRESHOLD) {
            return [
                'refreshed' => false,
                'token' => $token,
                'expires_in' => $time_to_expiry,
            ];
        }

        // Generate new token
        $new_token = $this->generate_token(
            $payload['instance_id'] ?? 0,
            $payload['sub'] ?? '',
            $payload['user_id'] ?? 0,
            array_diff_key($payload, array_flip([
                'iss', 'iat', 'exp', 'nbf', 'jti', 'sub',
                'instance_id', 'user_id', 'site_id', 'nonce'
            ]))
        );

        return [
            'refreshed' => true,
            'token' => $new_token,
            'expires_in' => self::TOKEN_EXPIRY,
        ];
    }

    /**
     * Create signature
     *
     * @param string $input Input to sign
     * @return string Signature
     */
    private function sign(string $input): string {
        return hash_hmac('sha256', $input, $this->secret_key, true);
    }

    /**
     * Base64 URL encode
     *
     * @param string $data Data to encode
     * @return string Encoded string
     */
    private function base64_url_encode(string $data): string {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }

    /**
     * Base64 URL decode
     *
     * @param string $data Data to decode
     * @return string Decoded string
     */
    private function base64_url_decode(string $data): string {
        $padding = 4 - (strlen($data) % 4);
        if ($padding < 4) {
            $data .= str_repeat('=', $padding);
        }
        return base64_decode(strtr($data, '-_', '+/'));
    }

    /**
     * Get token expiry time
     *
     * @param string $token JWT token
     * @return int|null Expiry timestamp or null
     */
    public function get_expiry(string $token): ?int {
        $payload = $this->validate_token($token);
        return $payload['exp'] ?? null;
    }

    /**
     * Check if token is expired
     *
     * @param string $token JWT token
     * @return bool True if expired
     */
    public function is_expired(string $token): bool {
        $expiry = $this->get_expiry($token);
        return $expiry === null || $expiry < time();
    }

    /**
     * Get session ID from token
     *
     * @param string $token JWT token
     * @return string|null Session ID or null
     */
    public function get_session_id(string $token): ?string {
        $payload = $this->validate_token($token);
        return $payload['sub'] ?? null;
    }

    /**
     * Get instance ID from token
     *
     * @param string $token JWT token
     * @return int|null Instance ID or null
     */
    public function get_instance_id(string $token): ?int {
        $payload = $this->validate_token($token);
        return $payload['instance_id'] ?? null;
    }

    /**
     * Get user ID from token
     *
     * @param string $token JWT token
     * @return int|null User ID or null
     */
    public function get_user_id(string $token): ?int {
        $payload = $this->validate_token($token);
        return $payload['user_id'] ?? null;
    }

    /**
     * Revoke secret key (invalidates all tokens)
     *
     * @return bool Success
     */
    public function revoke_all_tokens(): bool {
        delete_option('flowchat_jwt_secret');
        $this->secret_key = $this->get_secret_key();
        return true;
    }

    /**
     * Create token for webhook authentication
     *
     * This creates a token that can be verified by n8n to ensure
     * requests are coming from a legitimate source.
     *
     * @param int    $instance_id Instance ID
     * @param string $session_id Session ID
     * @param string $webhook_url Target webhook URL
     * @return array Token data for frontend
     */
    public function create_webhook_auth(int $instance_id, string $session_id, string $webhook_url): array {
        $user_id = get_current_user_id();

        $token = $this->generate_token($instance_id, $session_id, $user_id, [
            'type' => 'webhook_auth',
            'webhook_hash' => hash('sha256', $webhook_url . $this->secret_key),
        ]);

        return [
            'token' => $token,
            'type' => 'Bearer',
            'expires_in' => self::TOKEN_EXPIRY,
            'refresh_at' => time() + self::TOKEN_EXPIRY - self::REFRESH_THRESHOLD,
        ];
    }

    /**
     * Validate webhook authentication token
     *
     * @param string $token JWT token
     * @param string $webhook_url Expected webhook URL
     * @return bool Valid
     */
    public function validate_webhook_auth(string $token, string $webhook_url): bool {
        $payload = $this->validate_token($token);

        if (!$payload) {
            return false;
        }

        // Verify webhook hash
        $expected_hash = hash('sha256', $webhook_url . $this->secret_key);
        $actual_hash = $payload['webhook_hash'] ?? '';

        return hash_equals($expected_hash, $actual_hash);
    }

    /**
     * Get token claims without validation
     * (Use only when you need to inspect an invalid/expired token)
     *
     * @param string $token JWT token
     * @return array|null Claims or null
     */
    public function get_claims_unsafe(string $token): ?array {
        $parts = explode('.', $token);

        if (count($parts) !== 3) {
            return null;
        }

        $payload = json_decode($this->base64_url_decode($parts[1]), true);

        return is_array($payload) ? $payload : null;
    }
}
