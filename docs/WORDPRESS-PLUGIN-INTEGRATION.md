# n8.chat WordPress Plugin — License System Integration Guide

This document provides everything a WordPress plugin developer needs to integrate with the n8.chat license validation system.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [License Key Format](#license-key-format)
4. [API Endpoint](#api-endpoint)
5. [Request Format](#request-format)
6. [Response Format](#response-format)
7. [License States](#license-states)
8. [PHP Implementation](#php-implementation)
9. [Caching Strategy](#caching-strategy)
10. [Error Handling](#error-handling)
11. [Grace Period Handling](#grace-period-handling)
12. [Testing](#testing)
13. [Security Considerations](#security-considerations)
14. [FAQ](#faq)

---

## Overview

The n8.chat license system validates premium plugin licenses through a simple REST API. When a user purchases a license, they receive:

- **License Key**: Format `N8C-XXXX-XXXX-XXXX-XXXX` (16 alphanumeric characters)
- **Email**: The email used during purchase

The plugin calls the validation API to check if the license is valid, and enables/disables premium features accordingly.

---

## Architecture

```
┌─────────────────────┐        ┌─────────────────────┐
│   WordPress Site    │        │   n8.chat API       │
│   (Your Plugin)     │        │   (Validation)      │
│                     │        │                     │
│  ┌───────────────┐  │        │  ┌───────────────┐  │
│  │ License       │  │  POST  │  │ /api/license/ │  │
│  │ Settings Page │──┼───────▶│  │ validate      │  │
│  └───────────────┘  │        │  └───────────────┘  │
│                     │        │         │           │
│  ┌───────────────┐  │        │         ▼           │
│  │ Premium       │◀─┼────────│  { valid: true/   │  │
│  │ Features      │  │        │    false, ... }    │  │
│  └───────────────┘  │        │                     │
└─────────────────────┘        └─────────────────────┘
```

---

## License Key Format

```
N8C-XXXX-XXXX-XXXX-XXXX
```

- **Prefix**: `N8C-` (always uppercase)
- **Segments**: 4 groups of 4 characters
- **Characters**: Uppercase alphanumeric (A-Z, 0-9)
- **Total Length**: 23 characters (including hyphens)

**Regex Pattern:**
```regex
^N8C-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$
```

---

## API Endpoint

### Production
```
POST https://n8.chat/api/license/validate
```

### Request Headers
```http
Content-Type: application/json
```

### Rate Limits
- **60 requests per minute** per IP address
- Exceeding limit returns `429 Too Many Requests`

---

## Request Format

```json
{
  "license_key": "N8C-XXXX-XXXX-XXXX-XXXX",
  "email": "customer@example.com",
  "site_url": "https://customer-site.com",
  "product": "wordpress"
}
```

### Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `license_key` | string | Yes | The license key (case-insensitive, will be uppercased) |
| `email` | string | Yes | Customer email (case-insensitive, will be lowercased) |
| `site_url` | string | No | The site URL for logging/analytics |
| `product` | string | No | Product identifier (default: `"wordpress"`) |

**Product Identifiers:**
- `wordpress` — n8.chat WordPress Plugin Premium
- *(More products will be added in the future)*

---

## Response Format

### Successful Response (Active License)

```json
{
  "valid": true,
  "status": "active",
  "valid_until": "2025-12-31T23:59:59.000Z",
  "grace_until": "2026-01-15T23:59:59.000Z",
  "message": "License is active"
}
```

### Grace Period Response

```json
{
  "valid": true,
  "status": "grace",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "grace_until": "2025-01-15T23:59:59.000Z",
  "days_left": 10,
  "warning": "grace",
  "message": "License is in grace period. 10 days remaining."
}
```

### Expired License Response

```json
{
  "valid": false,
  "status": "expired",
  "message": "License has expired"
}
```

### Invalid License Response

```json
{
  "valid": false,
  "status": "not_found",
  "message": "License not found. Please check your license key and email."
}
```

### Product Mismatch Response

```json
{
  "valid": false,
  "status": "product_mismatch",
  "message": "This license is for shopify, not wordpress."
}
```

### Rate Limited Response

```json
{
  "valid": false,
  "status": "error",
  "message": "Rate limit exceeded. Please try again later."
}
```

### Response Fields

| Field | Type | Description |
|-------|------|-------------|
| `valid` | boolean | Whether the license grants access to premium features |
| `status` | string | License status: `active`, `grace`, `expired`, `revoked`, `not_found`, `product_mismatch`, `error` |
| `valid_until` | string (ISO 8601) | When the subscription period ends |
| `grace_until` | string (ISO 8601) | When the grace period ends (15 days after valid_until) |
| `days_left` | number | Days remaining in grace period (only when in grace) |
| `warning` | string | Warning type: `"grace"` (only when in grace period) |
| `message` | string | Human-readable message |

---

## License States

| Status | `valid` | Premium Features | Description |
|--------|---------|------------------|-------------|
| `active` | `true` | ✅ Enabled | License is valid, subscription is current |
| `grace` | `true` | ✅ Enabled | Payment failed, 15-day grace period active |
| `expired` | `false` | ❌ Disabled | Grace period ended, subscription lapsed |
| `revoked` | `false` | ❌ Disabled | License manually revoked by admin |
| `not_found` | `false` | ❌ Disabled | License key or email doesn't match |

---

## PHP Implementation

### Complete License Validation Class

```php
<?php
/**
 * N8Chat License Validator
 *
 * Handles license validation for the n8.chat WordPress plugin.
 */

if (!defined('ABSPATH')) {
    exit;
}

class N8Chat_License_Validator {

    /**
     * API endpoint for license validation
     */
    const API_URL = 'https://n8.chat/api/license/validate';

    /**
     * Product identifier
     */
    const PRODUCT = 'wordpress';

    /**
     * Cache duration for valid licenses (12 hours)
     */
    const CACHE_DURATION_VALID = 12 * HOUR_IN_SECONDS;

    /**
     * Cache duration for invalid licenses (1 hour)
     */
    const CACHE_DURATION_INVALID = HOUR_IN_SECONDS;

    /**
     * Cache duration for grace period (1 hour - check more frequently)
     */
    const CACHE_DURATION_GRACE = HOUR_IN_SECONDS;

    /**
     * Option keys
     */
    const OPTION_LICENSE_KEY = 'n8chat_license_key';
    const OPTION_LICENSE_EMAIL = 'n8chat_license_email';
    const OPTION_LICENSE_STATUS = 'n8chat_license_status';
    const TRANSIENT_CACHE = 'n8chat_license_cache';

    /**
     * Validate license key format
     *
     * @param string $license_key
     * @return bool
     */
    public static function is_valid_format($license_key) {
        $pattern = '/^N8C-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/';
        return (bool) preg_match($pattern, strtoupper(trim($license_key)));
    }

    /**
     * Validate email format
     *
     * @param string $email
     * @return bool
     */
    public static function is_valid_email($email) {
        return is_email($email);
    }

    /**
     * Get saved license key
     *
     * @return string|false
     */
    public static function get_license_key() {
        return get_option(self::OPTION_LICENSE_KEY, false);
    }

    /**
     * Get saved license email
     *
     * @return string|false
     */
    public static function get_license_email() {
        return get_option(self::OPTION_LICENSE_EMAIL, false);
    }

    /**
     * Save license credentials
     *
     * @param string $license_key
     * @param string $email
     * @return bool
     */
    public static function save_license($license_key, $email) {
        $license_key = strtoupper(trim($license_key));
        $email = strtolower(trim($email));

        // Validate format before saving
        if (!self::is_valid_format($license_key)) {
            return false;
        }

        if (!self::is_valid_email($email)) {
            return false;
        }

        update_option(self::OPTION_LICENSE_KEY, $license_key);
        update_option(self::OPTION_LICENSE_EMAIL, $email);

        // Clear cache to force re-validation
        delete_transient(self::TRANSIENT_CACHE);

        return true;
    }

    /**
     * Remove saved license
     *
     * @return void
     */
    public static function remove_license() {
        delete_option(self::OPTION_LICENSE_KEY);
        delete_option(self::OPTION_LICENSE_EMAIL);
        delete_option(self::OPTION_LICENSE_STATUS);
        delete_transient(self::TRANSIENT_CACHE);
    }

    /**
     * Validate license with API
     *
     * @param bool $force_refresh Bypass cache and validate with API
     * @return array Validation result
     */
    public static function validate($force_refresh = false) {
        $license_key = self::get_license_key();
        $email = self::get_license_email();

        // No license configured
        if (empty($license_key) || empty($email)) {
            return [
                'valid' => false,
                'status' => 'not_configured',
                'message' => 'No license key configured.',
            ];
        }

        // Check cache first (unless force refresh)
        if (!$force_refresh) {
            $cached = get_transient(self::TRANSIENT_CACHE);
            if ($cached !== false) {
                return $cached;
            }
        }

        // Make API request
        $result = self::api_validate($license_key, $email);

        // Cache the result
        $cache_duration = self::get_cache_duration($result);
        set_transient(self::TRANSIENT_CACHE, $result, $cache_duration);

        // Store status for quick access
        update_option(self::OPTION_LICENSE_STATUS, $result['status']);

        return $result;
    }

    /**
     * Make API validation request
     *
     * @param string $license_key
     * @param string $email
     * @return array
     */
    private static function api_validate($license_key, $email) {
        $body = [
            'license_key' => strtoupper(trim($license_key)),
            'email' => strtolower(trim($email)),
            'site_url' => home_url(),
            'product' => self::PRODUCT,
        ];

        $response = wp_remote_post(self::API_URL, [
            'timeout' => 15,
            'headers' => [
                'Content-Type' => 'application/json',
            ],
            'body' => wp_json_encode($body),
        ]);

        // Handle connection errors
        if (is_wp_error($response)) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => 'Could not connect to license server. ' . $response->get_error_message(),
                'error_code' => 'connection_error',
            ];
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        // Handle rate limiting
        if ($status_code === 429) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => 'Too many requests. Please try again later.',
                'error_code' => 'rate_limited',
            ];
        }

        // Handle other HTTP errors
        if ($status_code !== 200 || !$data) {
            return [
                'valid' => false,
                'status' => 'error',
                'message' => 'License server error. Please try again later.',
                'error_code' => 'server_error',
                'http_status' => $status_code,
            ];
        }

        return $data;
    }

    /**
     * Get appropriate cache duration based on license status
     *
     * @param array $result
     * @return int Seconds
     */
    private static function get_cache_duration($result) {
        if (!$result['valid']) {
            return self::CACHE_DURATION_INVALID;
        }

        if (isset($result['warning']) && $result['warning'] === 'grace') {
            return self::CACHE_DURATION_GRACE;
        }

        return self::CACHE_DURATION_VALID;
    }

    /**
     * Quick check if license is valid (uses cached status)
     *
     * @return bool
     */
    public static function is_valid() {
        $result = self::validate();
        return $result['valid'] === true;
    }

    /**
     * Check if license is in grace period
     *
     * @return bool
     */
    public static function is_in_grace() {
        $result = self::validate();
        return isset($result['warning']) && $result['warning'] === 'grace';
    }

    /**
     * Get days left in grace period
     *
     * @return int|null
     */
    public static function get_grace_days_left() {
        $result = self::validate();
        return isset($result['days_left']) ? (int) $result['days_left'] : null;
    }

    /**
     * Get license expiration date
     *
     * @return string|null ISO 8601 date string
     */
    public static function get_valid_until() {
        $result = self::validate();
        return isset($result['valid_until']) ? $result['valid_until'] : null;
    }

    /**
     * Get current license status
     *
     * @return string
     */
    public static function get_status() {
        $result = self::validate();
        return $result['status'];
    }

    /**
     * Activate license (validate and save)
     *
     * @param string $license_key
     * @param string $email
     * @return array
     */
    public static function activate($license_key, $email) {
        // Format inputs
        $license_key = strtoupper(trim($license_key));
        $email = strtolower(trim($email));

        // Validate format
        if (!self::is_valid_format($license_key)) {
            return [
                'success' => false,
                'message' => 'Invalid license key format. Expected: N8C-XXXX-XXXX-XXXX-XXXX',
            ];
        }

        if (!self::is_valid_email($email)) {
            return [
                'success' => false,
                'message' => 'Invalid email address.',
            ];
        }

        // Save credentials
        self::save_license($license_key, $email);

        // Validate with API
        $result = self::validate(true);

        if ($result['valid']) {
            return [
                'success' => true,
                'message' => 'License activated successfully!',
                'status' => $result['status'],
                'valid_until' => $result['valid_until'] ?? null,
            ];
        }

        // Activation failed - remove saved credentials
        self::remove_license();

        return [
            'success' => false,
            'message' => $result['message'] ?? 'License activation failed.',
            'status' => $result['status'],
        ];
    }

    /**
     * Deactivate license
     *
     * @return array
     */
    public static function deactivate() {
        self::remove_license();

        return [
            'success' => true,
            'message' => 'License deactivated.',
        ];
    }
}
```

### Usage Examples

```php
// Check if premium features should be enabled
if (N8Chat_License_Validator::is_valid()) {
    // Enable premium features
    add_action('init', 'n8chat_enable_premium_features');
}

// Activate a license
$result = N8Chat_License_Validator::activate('N8C-XXXX-XXXX-XXXX-XXXX', 'user@example.com');
if ($result['success']) {
    echo 'License activated! Valid until: ' . $result['valid_until'];
} else {
    echo 'Activation failed: ' . $result['message'];
}

// Check for grace period and show warning
if (N8Chat_License_Validator::is_in_grace()) {
    $days_left = N8Chat_License_Validator::get_grace_days_left();
    add_action('admin_notices', function() use ($days_left) {
        echo '<div class="notice notice-warning"><p>';
        echo 'Your n8.chat license payment failed. ';
        echo 'You have <strong>' . $days_left . ' days</strong> to update your payment method.';
        echo ' <a href="https://n8.chat/support">Update Payment</a>';
        echo '</p></div>';
    });
}

// Force refresh validation (bypass cache)
$result = N8Chat_License_Validator::validate(true);

// Deactivate license
N8Chat_License_Validator::deactivate();
```

---

## Caching Strategy

The plugin should cache validation results to minimize API calls:

| License Status | Cache Duration | Reason |
|----------------|----------------|--------|
| Active | 12 hours | Stable state, infrequent changes |
| Grace Period | 1 hour | Need to check for payment updates |
| Invalid/Expired | 1 hour | Allow retries after fixing issues |
| Error | 5 minutes | Temporary issues, retry soon |

**Important:** Always clear cache when:
- User enters new license key
- User clicks "Refresh License"
- Plugin is reactivated

---

## Error Handling

### Connection Errors

If the API is unreachable:
1. **First attempt**: Show "Could not verify license" message
2. **Cached valid license**: Continue to work (offline grace)
3. **No cache**: Disable premium features with helpful message

### Recommended Error Messages

```php
$error_messages = [
    'not_found' => 'License not found. Please check your license key and email.',
    'expired' => 'Your license has expired. <a href="https://n8.chat/#pricing">Renew now</a> to continue using premium features.',
    'revoked' => 'This license has been revoked. Please contact support.',
    'product_mismatch' => 'This license is for a different product.',
    'rate_limited' => 'Too many attempts. Please wait a few minutes.',
    'connection_error' => 'Could not connect to license server. Please check your internet connection.',
];
```

---

## Grace Period Handling

When a payment fails, the license enters a 15-day grace period:

1. **`valid` is still `true`** — Premium features continue to work
2. **`warning` is set to `"grace"`** — Indicates grace period
3. **`days_left`** — Number of days remaining

### Recommended UX

```php
if (N8Chat_License_Validator::is_in_grace()) {
    $days = N8Chat_License_Validator::get_grace_days_left();

    // Show persistent admin notice
    add_action('admin_notices', function() use ($days) {
        ?>
        <div class="notice notice-warning is-dismissible">
            <p>
                <strong>⚠️ Payment Issue:</strong>
                Your n8.chat license payment failed.
                Premium features will be disabled in <strong><?php echo $days; ?> days</strong>.
                <a href="https://n8.chat/support" target="_blank">Update payment method →</a>
            </p>
        </div>
        <?php
    });

    // Optionally show in plugin settings
    // Optionally send admin email notification
}
```

---

## Testing

### Test Credentials

Contact the n8.chat team for test license keys:
- **Test Active License**: Simulates active subscription
- **Test Grace License**: Simulates payment failure
- **Test Expired License**: Simulates expired subscription

### Test API Endpoint

For development, you may use:
```
POST https://n8.chat/api/license/validate
```

### Manual Testing Checklist

- [ ] Valid license activates successfully
- [ ] Invalid license shows appropriate error
- [ ] Wrong email shows "not found" error
- [ ] Expired license disables premium features
- [ ] Grace period shows warning but keeps features
- [ ] Rate limiting is handled gracefully
- [ ] Network errors don't crash the plugin
- [ ] Cache works correctly (fewer API calls)
- [ ] Force refresh bypasses cache
- [ ] Deactivation clears all stored data

### curl Test

```bash
curl -X POST https://n8.chat/api/license/validate \
  -H "Content-Type: application/json" \
  -d '{
    "license_key": "N8C-TEST-TEST-TEST-TEST",
    "email": "test@example.com",
    "site_url": "https://test-site.com",
    "product": "wordpress"
  }'
```

---

## Security Considerations

### Never Trust Client-Side Validation

Always validate licenses server-side. JavaScript validation can be bypassed.

### Protect License Keys

```php
// Don't expose full license key in HTML
$masked_key = substr($license_key, 0, 8) . '****-****-' . substr($license_key, -4);
echo 'License: ' . esc_html($masked_key);
```

### Secure Storage

License keys are stored in `wp_options`. Consider:
- Keys are not sensitive (can't be used for payment)
- Email + key combination is validated server-side
- Revoking a license server-side immediately invalidates it

### Rate Limiting

The API enforces 60 requests/minute per IP. The caching strategy prevents hitting this limit under normal use.

---

## FAQ

### How long are licenses valid?

Licenses are valid for 1 year from purchase. They auto-renew unless canceled.

### What happens when payment fails?

The license enters a 15-day grace period. Premium features continue to work, but the plugin should show a warning to update payment.

### Can one license be used on multiple sites?

Currently, licenses are not domain-locked. However, usage is logged, and abuse may result in revocation.

### How often should I validate?

With the recommended caching strategy:
- Active licenses: Every 12 hours
- Grace period: Every 1 hour
- After user action: Immediately (bypass cache)

### What if the API is down?

If you have a cached valid result, continue to honor it. Only fail if there's no cache AND the API is unreachable.

### How do users get their license key?

1. Purchase at https://n8.chat/#pricing
2. License key is sent via email
3. Lost key? https://n8.chat/resend-license

### How do I request a test license?

Contact support@n8.chat with:
- Your name
- Company/project name
- What you're testing

---

## Support

- **Documentation**: https://n8.chat/docs
- **Support Email**: support@n8.chat
- **License Issues**: https://n8.chat/resend-license

---

## Changelog

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-01-01 | Initial release |

---

## Appendix: API Response Examples

### All Possible Responses

```json
// Active license
{
  "valid": true,
  "status": "active",
  "valid_until": "2025-12-31T23:59:59.000Z",
  "grace_until": "2026-01-15T23:59:59.000Z",
  "message": "License is active"
}

// Grace period
{
  "valid": true,
  "status": "grace",
  "valid_until": "2024-12-31T23:59:59.000Z",
  "grace_until": "2025-01-15T23:59:59.000Z",
  "days_left": 10,
  "warning": "grace",
  "message": "License is in grace period. 10 days remaining."
}

// Expired
{
  "valid": false,
  "status": "expired",
  "message": "License has expired"
}

// Revoked
{
  "valid": false,
  "status": "revoked",
  "message": "License has been revoked"
}

// Not found
{
  "valid": false,
  "status": "not_found",
  "message": "License not found. Please check your license key and email."
}

// Invalid format
{
  "valid": false,
  "status": "invalid",
  "message": "Invalid license key format"
}

// Product mismatch
{
  "valid": false,
  "status": "product_mismatch",
  "message": "This license is for shopify, not wordpress."
}

// Rate limited
{
  "valid": false,
  "status": "error",
  "message": "Rate limit exceeded. Please try again later."
}

// Server error
{
  "valid": false,
  "status": "error",
  "message": "An error occurred while validating the license"
}
```
