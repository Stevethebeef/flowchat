# Plugin - User Stories (License Integration)

## Epic: Admin activation

### Story 1: As admin, I enter email+key and activate license.
**AC:**
- The plugin posts to `/api/license/validate`.
- If active, plugin stores license and unlocks premium features.

**Tests:**
- Use sample license from website dev to activate.

### Story 2: As admin, I can see license status and expiry.
**AC:**
- Admin UI shows active/grace/expired and expiry date.
- Banner shown for grace with countdown.

**Tests:**
- Activate license and inspect admin screen.

---

## Epic: Grace & expiry behavior

### Story 3: As a user, I keep premium features during grace.
**AC:**
- Premium features remain usable during `grace` state.

**Tests:**
- Use a license marked `grace` and test premium actions.

### Story 4: As a user, if license expired, premium features are disabled (no data loss).
**AC:**
- Features disabled, data remains.

**Tests:**
- Use expired license and confirm.

---

## Epic: Caching & offline

### Story 5: The plugin caches the last valid license and survives temporary network failures.
**AC:**
- If validation endpoint fails due to network, plugin uses cached license if not expired.

**Tests:**
- Simulate network down and ensure plugin works.

---

## Implementation Details

### License Manager Class
**File:** `includes/core/class-license-manager.php`

The `License_Manager` class handles:
- License activation via `activate($license_key, $email)`
- License deactivation via `deactivate()`
- Premium status check via `is_premium()` and `get_premium_status()`
- Revalidation via `revalidate()`
- Scheduled daily checks via WordPress cron
- Admin login license checks (throttled to once per 24 hours)
- Offline mode with cached license fallback

### License Storage
- **Option:** `n8n_chat_license` - Stores license data including:
  - `license_key` - The license key
  - `email` - Associated email
  - `status` - Current status (inactive, active, grace, expired)
  - `valid_until` - Expiry date
  - `grace_until` - Grace period end date
  - `checked_at` - Last validation timestamp
  - `activated_at` - Activation timestamp
  - `last_error` - Last error message
  - `offline_mode` - Whether operating in offline mode

- **Transient:** `n8n_chat_license_check` - 24-hour throttle for revalidation

### REST API Endpoints
**Namespace:** `n8n-chat/v1/admin`

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/license` | GET | Get current license status |
| `/license/activate` | POST | Activate a new license |
| `/license/deactivate` | POST | Deactivate current license |
| `/license/revalidate` | POST | Revalidate existing license |
| `/license/resend-url` | GET | Get resend license URL |
| `/license/purchase-url` | GET | Get purchase URL with UTM params |

### Helper Functions
**File:** `includes/template-tags.php`

```php
// Check if premium features are available
n8n_chat_is_premium(): bool
n8_is_premium(): bool  // Alias

// Get detailed premium status
n8_get_premium_status(): array
```

### Feature Gating Pattern
```php
if (!n8_is_premium()) {
    // Show CTA or disable UI
    return;
}

// Premium feature code here
```

### Hooks & Actions
- `n8n_license_activated` - Fires when license is successfully activated
- `n8n_license_expired` - Fires when license expires
- `n8n_license_grace` - Fires when license enters grace period

### Cron Jobs
- `n8n_chat_license_check` - Daily license validation check

---

## Testing Checklist

### Activation Flow
- [ ] Enter valid license key and email
- [ ] Click "Activate License"
- [ ] Verify success message appears
- [ ] Verify status badge shows "Active"
- [ ] Verify expiry date is displayed
- [ ] Verify premium features are unlocked

### Grace Period
- [ ] Use license in grace state
- [ ] Verify orange warning banner appears
- [ ] Verify days countdown is accurate
- [ ] Verify premium features still work
- [ ] Verify "Update Payment" button links correctly

### Expired License
- [ ] Use expired license
- [ ] Verify red error banner appears
- [ ] Verify premium features are disabled
- [ ] Verify "Renew License" button links correctly
- [ ] Verify user data is preserved

### Offline Mode
- [ ] Block network access to license server
- [ ] Verify plugin continues using cached license
- [ ] Verify offline warning message appears
- [ ] Verify premium features work if cached license is valid

### Deactivation
- [ ] Click "Deactivate" button
- [ ] Confirm deactivation dialog
- [ ] Verify status returns to "Inactive"
- [ ] Verify email is preserved for convenience

### Revalidation
- [ ] Click "Refresh" button
- [ ] Verify license status is updated
- [ ] Verify last checked timestamp updates

---

## API Response Format

### Success (active/grace):
```json
{
    "valid": true,
    "status": "active",
    "valid_until": "2026-01-01T00:00:00Z",
    "grace_until": "2026-01-16T00:00:00Z",
    "message": "OK"
}
```

### Invalid/Expired:
```json
{
    "valid": false,
    "status": "expired",
    "message": "Expired"
}
```

### Errors:
```json
{
    "error": "Invalid license key"
}
```
HTTP Status: 4xx/5xx
