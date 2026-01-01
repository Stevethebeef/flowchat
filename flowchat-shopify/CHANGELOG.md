# Changelog

All notable changes to N8.chat will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [6.0.0] - 2025-01-01

### Added

- **Privacy Mode** (enabled by default) - Customer PII is no longer sent to webhooks unless explicitly enabled
- **GDPR Compliance** - Implemented mandatory Shopify GDPR webhooks via Supabase Edge Functions
- **Internationalization** - Full i18n support with 20 languages:
  - English, German, French, Spanish, Italian, Portuguese, Dutch, Polish, Czech, Russian
  - Japanese, Korean, Chinese (Simplified & Traditional), Arabic, Turkish, Swedish, Danish, Finnish, Norwegian
- **Proactive Triggers** - Exit intent, scroll depth, time on page, idle time, cart abandonment
- **Branch Navigation** - Navigate between regenerated message versions
- **Voice Input** - Optional speech-to-text support
- **File Upload** - Optional file/image upload capability
- **Theme Support** - Light, Dark, and Auto (system) themes

### Changed

- Removed `cart.token` from data sent to webhooks (security improvement)
- Removed `shop.email` and `shop.phone` from webhook data (privacy improvement)
- Customer data now only sent when Privacy Mode is disabled
- Upgraded to Assistant UI v0.11.0

### Security

- All customer PII is now opt-in via Privacy Mode toggle
- Cart token is stripped before transmission
- HMAC verification on all GDPR webhooks

### Documentation

- Added Privacy Policy
- Added Terms of Service
- Added GDPR webhook deployment guide

## [5.0.0] - 2024-12-15

### Added

- Initial Theme App Extension implementation
- Streaming responses via SSE
- Assistant UI integration
- Rich Shopify context (shop, customer, cart, product, collection)

### Changed

- Complete rewrite using React 18 and TypeScript
- Migrated from WordPress plugin to Shopify app

---

## Upgrade Guide

### From 5.x to 6.x

1. **Privacy Mode**: Privacy Mode is now enabled by default. If your n8n workflow requires customer name/email, disable Privacy Mode in Theme Editor settings.

2. **Cart Token**: The `cart.token` field is no longer available in webhook data. Update your n8n workflows if they depend on this field.

3. **GDPR Webhooks**: You must deploy the GDPR webhook handler before submitting to the Shopify App Store. See `supabase/functions/gdpr-webhooks/README.md`.
