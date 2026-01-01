# FlowChat Shopify App - Publication Plan

**Version:** 1.0
**Date:** January 2025
**Status:** Pre-Publication Checklist

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Current Status Assessment](#2-current-status-assessment)
3. [Critical Blockers](#3-critical-blockers)
4. [Legal & Compliance Requirements](#4-legal--compliance-requirements)
5. [Technical Requirements](#5-technical-requirements)
6. [App Store Listing Requirements](#6-app-store-listing-requirements)
7. [Security Requirements](#7-security-requirements)
8. [Support & Documentation Requirements](#8-support--documentation-requirements)
9. [Built for Shopify Badge (Optional)](#9-built-for-shopify-badge-optional)
10. [Action Items by Priority](#10-action-items-by-priority)
11. [Appendix: File Checklist](#11-appendix-file-checklist)

---

## 1. Executive Summary

FlowChat is an AI chat widget for Shopify stores powered by n8n workflows. The app uses a Theme App Extension architecture that requires no backend, connecting directly to merchant-configured n8n webhook endpoints.

### App Classification
- **Type:** Theme App Extension (App Embed Block)
- **Data Processing:** Sends customer/cart/product data to external n8n webhooks
- **Target:** All Shopify merchants (Basic to Plus plans)
- **Billing:** To be determined (Free / Freemium / Paid)

### Key Considerations
- Processes Protected Customer Data (names, emails, order info)
- Sends data to third-party external services (n8n webhooks)
- Operates internationally (GDPR, CCPA, UK GDPR, LGPD applicable)
- Uses client-side JavaScript only (no backend server)

---

## 2. Current Status Assessment

### What Exists (51 Source Files)

| Category | Count | Status |
|----------|-------|--------|
| React Components | 18 | Complete |
| Custom Hooks | 4 | Complete |
| Library Files | 7 | Complete |
| i18n (20 languages) | 39 keys | Complete |
| Styles | 2 | Complete |
| TypeScript Types | 1 | Complete |
| Extension Config | 7 | Complete |
| Build Config | 6 | Complete |

### What's Missing

| Category | Items Missing | Priority |
|----------|---------------|----------|
| **Legal Documents** | Privacy Policy, Terms of Service, Cookie Policy, DPA | CRITICAL |
| **Compliance Webhooks** | customers/data_request, customers/redact, shop/redact | CRITICAL |
| **Documentation** | CHANGELOG.md, LICENSE, CONTRIBUTING.md | HIGH |
| **Environment** | .env.example | HIGH |
| **Marketing Assets** | App icon (1200x1200), Screenshots, Video | HIGH |
| **Support** | FAQ, Setup Guide, Deep Links | MEDIUM |
| **Dev Config** | ESLint config, Test files, CI/CD | LOW |

---

## 3. Critical Blockers

These items will cause **immediate rejection** from Shopify App Store:

### 3.1 Missing GDPR Compliance Webhooks
```
MANDATORY WEBHOOKS NOT IMPLEMENTED:
- customers/data_request
- customers/redact
- shop/redact
```

**Why Critical:** 60%+ of app rejections are due to missing compliance webhooks.

**Solution Required:**
Since FlowChat is a client-side-only Theme App Extension with no backend, you need ONE of:
1. **Add a minimal backend** to receive and process these webhooks
2. **Use a serverless function** (Cloudflare Workers, AWS Lambda, Vercel)
3. **Use Gadget.dev or similar** which handles webhooks automatically
4. **Document that no customer data is stored** (if applicable)

### 3.2 Missing Privacy Policy

**Required URL in App Listing:** `https://your-domain.com/privacy`

Must include:
- Data collection disclosure (chat messages, customer info, cart data)
- Third-party sharing (n8n webhooks)
- Data retention periods
- User rights (access, deletion, portability)
- Contact information
- International transfer disclosures

### 3.3 Missing Terms of Service

**Required URL in App Listing:** `https://your-domain.com/terms`

Must include:
- AI-generated content disclaimers
- Third-party service (n8n) disclaimers
- Liability limitations
- Data handling terms

### 3.4 Emergency Developer Contact

**Must be set in Partner Dashboard before submission:**
- Email address
- Phone number (24/7 availability recommended)

---

## 4. Legal & Compliance Requirements

### 4.1 Required Legal Documents

| Document | Status | Action Required |
|----------|--------|-----------------|
| Privacy Policy | MISSING | Create comprehensive policy covering GDPR, CCPA, UK GDPR |
| Terms of Service | MISSING | Create with liability disclaimers |
| Cookie Policy | MISSING | Document localStorage usage and any tracking |
| Data Processing Agreement | MISSING | Template for merchants using the app |
| Sub-processor List | MISSING | List n8n and any analytics services |

### 4.2 GDPR Compliance (EU/EEA/UK)

| Requirement | Status | Notes |
|-------------|--------|-------|
| Lawful basis documentation | MISSING | Document consent as legal basis |
| Right to access mechanism | MISSING | Implement via webhook |
| Right to erasure mechanism | MISSING | Implement via webhook |
| Data minimization | PARTIAL | Review what data is sent to n8n |
| 72-hour breach notification | MISSING | Create incident response plan |
| Records of processing | MISSING | Create Article 30 documentation |
| Cookie consent | MISSING | Chat uses localStorage - document this |

### 4.3 CCPA/CPRA Compliance (California)

| Requirement | Status | Notes |
|-------------|--------|-------|
| "Do Not Sell" mechanism | MISSING | Required if selling/sharing data |
| Global Privacy Control | MISSING | Must honor GPC browser signals |
| Privacy policy updates | MISSING | Annual update requirement |
| Service provider agreement | MISSING | For n8n webhook relationship |

### 4.4 Shopify-Specific Compliance

| Requirement | Status | Action |
|-------------|--------|--------|
| customers/data_request webhook | MISSING | CRITICAL - Implement |
| customers/redact webhook | MISSING | CRITICAL - Implement |
| shop/redact webhook | MISSING | CRITICAL - Implement |
| Protected Customer Data approval | NOT APPLIED | Apply in Partner Dashboard |
| API scope justification | OK | No scopes needed for TAE |

### 4.5 Third-Party Data Disclosure

Since FlowChat sends data to external n8n webhooks:

1. **Merchant Disclosure Required:** Clear explanation that customer data is transmitted externally
2. **Data Processor Relationship:** Define relationship with n8n service
3. **Security Requirements:** Document HTTPS requirement for webhooks

---

## 5. Technical Requirements

### 5.1 Theme App Extension Specifications

| Requirement | Current | Target | Status |
|-------------|---------|--------|--------|
| Liquid files total | < 100 KB | < 100 KB | PASS |
| JavaScript (gzipped) | ~104 KB | < 10 KB (warning threshold) | WARNING |
| Settings per block | 50+ | 25 max | NEEDS REVIEW |
| Locale translations | 39 keys | 3,400 max | PASS |
| API version | 2024-10 | 2024-10 or newer | PASS |

**JavaScript Size Note:** The 340 KB bundle (104 KB gzipped) exceeds Shopify's 10 KB warning threshold. This is a **soft warning**, not a blocker, but affects performance scores.

**Recommendations:**
- Implement code splitting/lazy loading
- Tree-shake unused dependencies
- Consider loading heavy modules on interaction only

### 5.2 Configuration Files

| File | Status | Notes |
|------|--------|-------|
| shopify.app.toml | EXISTS | Needs client_id and URLs |
| shopify.extension.toml | EXISTS | Complete |
| package.json | EXISTS | Complete |
| tsconfig.json | EXISTS | Complete |
| vite.config.ts | EXISTS | Complete |

### 5.3 Required Configuration Updates

**shopify.app.toml:**
```toml
# NEEDS UPDATE:
name = "FlowChat"
client_id = "YOUR_CLIENT_ID"  # Get from Partner Dashboard
application_url = "https://your-app-url.com"

[access_scopes]
scopes = ""  # No scopes needed for TAE-only app

[webhooks]
api_version = "2024-10"

# ADD MANDATORY WEBHOOKS:
[[webhooks.subscriptions]]
compliance_topics = ["customers/data_request", "customers/redact", "shop/redact"]
uri = "https://your-webhook-handler.com/webhooks"
```

### 5.4 API Requirements (2025)

| Requirement | Deadline | Status |
|-------------|----------|--------|
| GraphQL Admin API only (new apps) | April 1, 2025 | N/A (no API calls) |
| Latest App Bridge | March 13, 2024 | N/A (TAE only) |

---

## 6. App Store Listing Requirements

### 6.1 App Information

| Field | Requirement | Status |
|-------|-------------|--------|
| App name | Max 30 chars, brand-first | "FlowChat" (8 chars) - READY |
| Introduction | Max 100 chars, benefit-focused | MISSING |
| Description | 100-2800 chars, Markdown | MISSING |
| Features list | Max 80 chars each | MISSING |
| Category | Primary + optional secondary | TO SELECT |

**Suggested Introduction:**
> "AI chat widget powered by n8n. Connect your workflows and let AI assist your customers."

**Suggested Category:** Customer Service > Live Chat

### 6.2 Visual Assets

| Asset | Specification | Status |
|-------|---------------|--------|
| App Icon | 1200x1200px JPEG/PNG | MISSING |
| Desktop Screenshots | 1600x900px (16:9), 3-6 required | MISSING |
| Mobile Screenshots | 900x1600px (optional) | MISSING |
| Feature Image | 1600x900px (16:9) | MISSING |
| Promotional Video | 2-3 min, English/subtitles | MISSING |

**Icon Guidelines:**
- Bold colors, simple patterns
- No text, screenshots, or Shopify trademarks
- Keep logo within 750-900px center area (leave 75px margin)
- Avoid white/light gray backgrounds

**Screenshot Guidelines:**
- Include at least 1 of your app's UI
- Crop out browser chrome
- No PII, pricing, or reviews
- Include alt text

### 6.3 Pricing Configuration

| Option | Notes |
|--------|-------|
| Free | Widget functionality at no cost |
| Recurring | Monthly/annual subscription with features |
| One-time | Single payment for lifetime access |

**Recommendation:** Start with "Free to install" to build user base, add premium features later.

**Free Trial:** If paid, recommend 14 days.

### 6.4 Support Information

| Field | Requirement | Status |
|-------|-------------|--------|
| Privacy Policy URL | Required | MISSING |
| Support Email | Required | MISSING |
| Support URL | Recommended | MISSING |
| FAQ URL | Recommended | MISSING |
| Changelog URL | Recommended | MISSING |

---

## 7. Security Requirements

### 7.1 Content Security Policy

For embedded apps (not applicable to TAE-only):
```
Content-Security-Policy: frame-ancestors https://[shop].myshopify.com https://admin.shopify.com
```

For TAE: Not directly applicable as extension runs in theme context.

### 7.2 Webhook Security (If Implemented)

| Requirement | Implementation |
|-------------|----------------|
| HMAC-SHA256 validation | Verify `X-Shopify-Hmac-SHA256` header |
| Timing-safe comparison | Use crypto.timingSafeEqual() |
| Raw body parsing | Parse before middleware modifies |
| 5-second response | Respond 200 OK within 5 seconds |
| Idempotency | Track `X-Shopify-Webhook-Id` |

### 7.3 Data Security

| Requirement | Status | Notes |
|-------------|--------|-------|
| TLS 1.2+ for n8n webhooks | DOCUMENTED | In README |
| No hardcoded credentials | PASS | None in code |
| Session management | N/A | No sessions (TAE only) |
| Token storage | N/A | No tokens stored |

### 7.4 Client-Side Security

| Requirement | Status |
|-------------|--------|
| XSS prevention | PASS - React auto-escapes |
| No innerHTML usage | VERIFY - Review Markdown component |
| localStorage only | PASS - No cookies |
| No eval() usage | VERIFY - Check dependencies |

---

## 8. Support & Documentation Requirements

### 8.1 Required Documentation

| Document | Status | Priority |
|----------|--------|----------|
| README.md | EXISTS | Update for merchants |
| Setup Guide | MISSING | Create step-by-step |
| n8n Workflow Guide | PARTIAL | In README |
| FAQ | MISSING | Create common questions |
| Troubleshooting | MISSING | Create debug guide |

### 8.2 Onboarding Experience

**Requirements:**
- Concise onboarding that establishes core functionality
- Progress indicators (steps, progress bar)
- Option to complete later
- Deep links to Theme Editor for app embed activation

**Current Status:** Theme App Extension relies on Theme Editor configuration. Consider adding:
- Welcome message in Theme Editor settings
- Link to documentation
- Example n8n workflow template (already exists)

### 8.3 Support Channels

| Channel | Requirement | Status |
|---------|-------------|--------|
| Email | Required for paid apps | MISSING |
| Documentation | Required | PARTIAL |
| Response time | 2 business days (paid apps) | POLICY NEEDED |

### 8.4 Demo Screencast

**Required for app review:**
- Step-by-step walkthrough of setup
- Show n8n webhook configuration
- Demonstrate chat functionality
- English language or subtitles
- 2-3 minutes recommended

---

## 9. Built for Shopify Badge (Optional)

### 9.1 Prerequisites

| Requirement | Target | Notes |
|-------------|--------|-------|
| Net installs | 50+ active shops | Post-launch goal |
| Reviews | 5+ minimum | Request from beta users |
| App rating | > 4.0 stars | Maintain quality |

### 9.2 Performance Standards

| Metric | Requirement | Current |
|--------|-------------|---------|
| LCP (Largest Contentful Paint) | ≤ 2.5 seconds | UNKNOWN |
| CLS (Cumulative Layout Shift) | ≤ 0.1 | UNKNOWN |
| Lighthouse performance impact | < 10 points reduction | UNKNOWN |

**Recommendation:** Test with Lighthouse before submission.

### 9.3 Benefits

- 49% average increase in new installs
- Priority App Store placement
- Sidekick (AI) recommendations
- Priority review queue
- Exclusive advertising options

---

## 10. Action Items by Priority

### CRITICAL (Must Complete Before Submission)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 1 | Create Privacy Policy | 4h | Legal/Dev |
| 2 | Create Terms of Service | 4h | Legal/Dev |
| 3 | Implement compliance webhooks (or document N/A) | 8h-16h | Dev |
| 4 | Set up emergency developer contact | 15m | Admin |
| 5 | Get Partner Dashboard client_id | 30m | Admin |
| 6 | Create app icon (1200x1200px) | 2h | Design |
| 7 | Create 3-6 screenshots (1600x900px) | 4h | Design |
| 8 | Write app description and features | 2h | Marketing |
| 9 | Create demo screencast for review | 2h | Dev |

### HIGH (Required for Quality Submission)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 10 | Create CHANGELOG.md | 1h | Dev |
| 11 | Add LICENSE file | 15m | Dev |
| 12 | Create .env.example | 30m | Dev |
| 13 | Create merchant setup guide | 4h | Dev |
| 14 | Create FAQ document | 2h | Dev |
| 15 | Create promotional video (2-3 min) | 8h | Marketing |
| 16 | Add deep links for Theme Editor | 2h | Dev |
| 17 | Test Lighthouse performance impact | 2h | Dev |

### MEDIUM (Recommended)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 18 | Apply for Protected Customer Data access | 1h | Admin |
| 19 | Create Data Processing Agreement template | 4h | Legal |
| 20 | Add ESLint configuration | 1h | Dev |
| 21 | Add test files | 8h | Dev |
| 22 | Set up CI/CD workflows | 4h | Dev |
| 23 | Create CONTRIBUTING.md | 1h | Dev |
| 24 | Review and reduce JavaScript bundle size | 4h | Dev |

### LOW (Post-Launch)

| # | Task | Effort | Owner |
|---|------|--------|-------|
| 25 | Add mobile screenshots | 2h | Design |
| 26 | Add POS screenshots (if applicable) | 2h | Design |
| 27 | Implement analytics dashboard | 16h | Dev |
| 28 | Create video tutorials | 8h | Marketing |
| 29 | Build merchant success stories | Ongoing | Marketing |
| 30 | Apply for Built for Shopify badge | 2h | Admin |

---

## 11. Appendix: File Checklist

### Files to Create

```
flowchat-shopify/
├── CHANGELOG.md                    # Version history
├── LICENSE                         # MIT or proprietary
├── CONTRIBUTING.md                 # Contribution guidelines
├── .env.example                    # Environment template
├── .eslintrc.json                  # ESLint configuration
├── docs/
│   ├── SETUP.md                    # Merchant setup guide
│   ├── FAQ.md                      # Frequently asked questions
│   ├── TROUBLESHOOTING.md          # Debug guide
│   ├── PRIVACY-POLICY.md           # Privacy policy
│   └── TERMS-OF-SERVICE.md         # Terms of service
├── assets/
│   ├── icon-1200x1200.png          # App icon
│   ├── screenshot-1.png            # Desktop screenshot
│   ├── screenshot-2.png            # Desktop screenshot
│   ├── screenshot-3.png            # Desktop screenshot
│   ├── feature-image.png           # 1600x900 feature image
│   └── promo-video.mp4             # Promotional video
└── .github/
    ├── workflows/
    │   └── ci.yml                  # CI/CD pipeline
    ├── ISSUE_TEMPLATE/
    └── PULL_REQUEST_TEMPLATE.md
```

### Webhook Handler (If Implementing Backend)

```
webhook-handler/
├── index.js                        # Webhook entry point
├── handlers/
│   ├── customers-data-request.js   # Handle data requests
│   ├── customers-redact.js         # Handle data deletion
│   └── shop-redact.js              # Handle store data cleanup
└── utils/
    └── hmac-verify.js              # HMAC verification
```

---

## Review Checklist (Before Submission)

### Technical
- [ ] shopify.app.toml has valid client_id
- [ ] Compliance webhooks implemented or documented as N/A
- [ ] Build passes without errors
- [ ] Lighthouse impact < 10 points

### Legal
- [ ] Privacy Policy URL accessible
- [ ] Terms of Service URL accessible
- [ ] GDPR compliance documented
- [ ] CCPA compliance documented

### Listing
- [ ] App icon uploaded (1200x1200px)
- [ ] 3+ screenshots uploaded (1600x900px)
- [ ] Description complete (100-2800 chars)
- [ ] Category selected
- [ ] Pricing configured
- [ ] Support email set

### Partner Dashboard
- [ ] Emergency developer contact set
- [ ] Privacy policy linked
- [ ] Demo screencast ready
- [ ] Test credentials prepared (if needed)

---

## Estimated Timeline

| Phase | Duration | Tasks |
|-------|----------|-------|
| **Phase 1: Legal** | 1 week | Privacy, Terms, Compliance webhooks |
| **Phase 2: Assets** | 1 week | Icon, Screenshots, Video, Documentation |
| **Phase 3: Config** | 2-3 days | Partner Dashboard, TOML files, Testing |
| **Phase 4: Submission** | 1 day | Submit and prepare demo |
| **Phase 5: Review** | 5-10 business days | Shopify review process |
| **Phase 6: Revisions** | 1-2 weeks | Address any feedback |

**Total Estimated Time:** 4-6 weeks to publication

---

## Resources

### Shopify Documentation
- [App Requirements Checklist](https://shopify.dev/docs/apps/launch/app-requirements-checklist)
- [Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Privacy Law Compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Mandatory Webhooks](https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks)
- [App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Built for Shopify](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)

### Legal Templates
- [GDPR Privacy Policy Generator](https://gdpr.eu/privacy-notice/)
- [Terms of Service Generator](https://www.shopify.com/tools/policy-generator)
- [Data Processing Agreement Template](https://gdpr.eu/data-processing-agreement/)

### Tools
- [Lighthouse](https://developer.chrome.com/docs/lighthouse/)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [Theme Check](https://shopify.dev/docs/storefronts/themes/tools/theme-check)

---

*This document should be updated as requirements change and items are completed.*
