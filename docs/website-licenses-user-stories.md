# Website / Backend - User Stories (n8.chat Licenses)

## Epic: Purchase & license creation

### Story 1: As a customer, I want to buy a yearly subscription so I can use premium plugin features.
**AC:**
- Stripe checkout creates a subscription in test mode.
- After successful checkout, a license is created in Supabase with status `active`.
- Customer receives an email with the license key and instructions.

**Tests:**
- Simulate `checkout.session.completed` and confirm DB row and email sent.

### Story 2: As the system, I want to generate a unique license key and store it alongside email.
**AC:**
- License key is unique and matches format `N8C-XXXX-XXXX-XXXX`.
- DB row contains `email`, `valid_until`, `grace_until`, `stripe_subscription_id`.

**Tests:**
- Insert a license and verify uniqueness / format.

---

## Epic: Payment failure handling

### Story 3: As the system, when payment fails, set license to `grace` and notify customer.
**AC:**
- On `invoice.payment_failed` webhook, license status becomes `grace`.
- Customer receives an email indicating 15-day grace period.

**Tests:**
- Simulate webhook and assert DB status and email.

### Story 4: As the system, if payment is re-succeeded within grace, reactivate and extend.
**AC:**
- On `invoice.payment_succeeded` after fail, status becomes `active`.
- `valid_until` extended appropriately.

**Tests:**
- Simulate succeeded invoice.

---

## Epic: Grace expiration

### Story 5: Cron job finalizes expiration after 15 days.
**AC:**
- If now > `grace_until`, status set to `expired`.
- Deactivation email sent.

**Tests:**
- Simulate cron run past grace date, assert status change and email.

---

## Epic: Resend license

### Story 6: As a customer, I want to resend my license with only my email.
**AC:**
- POST `/license/resend` accepts email; if license active or grace, email is resent.
- If none found, an info email is sent saying no active license.

**Tests:**
- Request resend with test email and inspect email.

---

## Epic: Validate API

### Story 7: As a plugin, I want to validate a license key quickly.
**AC:**
- `/license/validate` returns `valid` true/false and status.
- Rate-limited and secure.

**Tests:**
- Call endpoint with active/grace/expired license keys.

---

## API Endpoints (Backend)

### POST /api/license/validate
Validates a license key and returns status.

**Request:**
```json
{
    "license_key": "N8C-XXXX-XXXX-XXXX",
    "email": "customer@example.com",
    "site_url": "https://example.com",
    "product": "wordpress"
}
```

**Response (Success):**
```json
{
    "valid": true,
    "status": "active",
    "valid_until": "2026-01-01T00:00:00Z",
    "grace_until": "2026-01-16T00:00:00Z",
    "message": "OK"
}
```

**Response (Invalid):**
```json
{
    "valid": false,
    "status": "expired",
    "message": "License has expired"
}
```

### POST /api/license/resend
Resends license key to customer email.

**Request:**
```json
{
    "email": "customer@example.com"
}
```

**Response:**
```json
{
    "success": true,
    "message": "License key sent to your email"
}
```

---

## Database Schema (Supabase)

### licenses table
```sql
CREATE TABLE licenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    license_key VARCHAR(20) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    valid_until TIMESTAMPTZ NOT NULL,
    grace_until TIMESTAMPTZ,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    product VARCHAR(50) DEFAULT 'wordpress',
    site_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    activated_at TIMESTAMPTZ,
    last_validated_at TIMESTAMPTZ
);

CREATE INDEX idx_licenses_email ON licenses(email);
CREATE INDEX idx_licenses_license_key ON licenses(license_key);
CREATE INDEX idx_licenses_status ON licenses(status);
CREATE INDEX idx_licenses_stripe_subscription ON licenses(stripe_subscription_id);
```

### License Status Values
- `active` - License is valid and premium features are enabled
- `grace` - Payment failed, 15-day grace period active
- `expired` - Grace period ended, premium features disabled
- `cancelled` - Subscription cancelled by user
- `refunded` - Subscription refunded

---

## Stripe Integration

### Webhook Events to Handle
- `checkout.session.completed` - Create new license
- `invoice.payment_succeeded` - Extend license / reactivate from grace
- `invoice.payment_failed` - Set license to grace period
- `customer.subscription.deleted` - Set license to cancelled/expired
- `customer.subscription.updated` - Handle plan changes

### Stripe Products
- **Product:** n8n Chat Premium (WordPress Plugin)
- **Price:** Yearly subscription
- **Test Price ID:** Set in `STRIPE_PRICE_ID` env var

---

## Cron Jobs

### /cron/process-grace
Runs daily to check for expired grace periods.

**Logic:**
1. Query all licenses where `status = 'grace'` AND `grace_until < NOW()`
2. Update status to `expired`
3. Send expiration email to each customer
4. Log results

**Scheduling:**
- Run via external cron service (e.g., GitHub Actions, Vercel Cron)
- Recommended: Every 6 hours

---

## Email Templates

### License Activated
Subject: Your n8n Chat License Key
- Include license key
- Include activation instructions
- Link to documentation

### Payment Failed (Grace Started)
Subject: Action Required: Payment Failed for n8n Chat
- Explain 15-day grace period
- Link to update payment method
- Include countdown

### License Expired
Subject: Your n8n Chat License Has Expired
- Explain premium features are now disabled
- Link to renew
- Reassure data is preserved

### License Resent
Subject: Your n8n Chat License Key
- Include license key
- Link to plugin license page

---

## Test Licenses (Supabase)

Create these test licenses for plugin development:

1. **Active License (valid +1 year)**
```sql
INSERT INTO licenses (license_key, email, status, valid_until, grace_until)
VALUES ('N8C-TEST-ACTV-0001', 'active@test.com', 'active',
        NOW() + INTERVAL '1 year', NULL);
```

2. **Grace Period License (7 days left)**
```sql
INSERT INTO licenses (license_key, email, status, valid_until, grace_until)
VALUES ('N8C-TEST-GRAC-0001', 'grace@test.com', 'grace',
        NOW() - INTERVAL '1 day', NOW() + INTERVAL '7 days');
```

3. **Expired License**
```sql
INSERT INTO licenses (license_key, email, status, valid_until, grace_until)
VALUES ('N8C-TEST-EXPD-0001', 'expired@test.com', 'expired',
        NOW() - INTERVAL '30 days', NOW() - INTERVAL '15 days');
```

---

## Integration Testing Plan

### End-to-End Test Flow
1. Complete Stripe Checkout (test mode)
2. Confirm license created via `/license/validate`
3. Activate in plugin via license page
4. Verify premium features work
5. Simulate `invoice.payment_failed` webhook
6. Confirm plugin shows grace banner
7. Trigger `/cron/process-grace` to expire license
8. Confirm plugin disables premium features

### Manual Test Checklist
- [ ] Stripe test checkout creates license in Supabase
- [ ] License email is sent with correct key
- [ ] Plugin can validate active license
- [ ] Plugin handles grace status correctly
- [ ] Plugin handles expired status correctly
- [ ] Resend license works
- [ ] Payment update reactivates license
