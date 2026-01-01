# Anti-Piracy Protection Implementation Plan

## Overview

This document outlines a multi-layer protection system designed to deter piracy while being invisible to legitimate users. The strategy uses multiple hidden verification points, time-delayed enforcement, and code integrity checking.

**Core Principles:**
1. Never harm legitimate users
2. Make removal require finding multiple hidden checks
3. Use innocent-looking code and variable names
4. Gradual degradation so pirates don't know what triggered it
5. Silent telemetry to detect pirated installations

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    LAYER 1: VISIBLE DECOY                       │
│            class-license-manager.php (existing)                 │
│         Pirates will find this first - let them think          │
│              they've won by modifying just this                 │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 2: HIDDEN SECONDARY VERIFIER              │
│              class-runtime-analytics.php (NEW)                  │
│       Innocent name, contains real license verification         │
│            Monthly background check via WP Cron                 │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                  LAYER 3: TIME-BOMB ENFORCEMENT                 │
│                   class-feature-manager.php                     │
│       Tracks premium feature usage, enforces time limits        │
│          7-day grace → warnings → degradation → basic           │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                 LAYER 4: INTEGRITY VERIFICATION                 │
│               Embedded in multiple files (hidden)               │
│        Detects if license-related code was modified            │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                LAYER 5: DISTRIBUTED CHECKPOINTS                 │
│          Hidden in: assets.php, endpoints.php, plugin.php       │
│         Uses obfuscated variable names and indirect calls       │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                   LAYER 6: SILENT TELEMETRY                     │
│               Reports to licensing server monthly               │
│       Detects: mass license abuse, file tampering patterns      │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Changes

### NEW FILES

| File | Purpose | Innocent Name Rationale |
|------|---------|------------------------|
| `includes/core/class-runtime-analytics.php` | Hidden license verifier | "Analytics" sounds like usage tracking |
| `includes/core/class-feature-manager.php` | Time-bomb enforcement | "Feature manager" sounds like feature flags |

### MODIFIED FILES

| File | Changes |
|------|---------|
| `includes/class-plugin.php` | Load new classes, add hidden init check |
| `includes/frontend/class-assets.php` | Add asset-loading verification |
| `includes/api/class-public-endpoints.php` | Add API response verification |
| `includes/template-tags.php` | Add hidden helper check |

---

## Layer 2: Runtime Analytics (Hidden Verifier)

### File: `includes/core/class-runtime-analytics.php`

**Innocent-Looking Purpose:** "Collects anonymous usage analytics for plugin improvement"

**Actual Purpose:** Secondary license verification that runs independently

**Key Features:**
- Monthly background verification via WP Cron
- Uses misleading option names
- Obfuscated verification logic
- Reports telemetry to licensing server

**Option Names (Misleading):**
| Real Purpose | Option Name |
|--------------|-------------|
| Last verification timestamp | `n8n_chat_analytics_sync` |
| Cached verification result | `n8n_chat_runtime_cache` |
| Integrity check result | `n8n_chat_perf_baseline` |
| First premium usage | `n8n_chat_feature_init` |

**Cron Hook:** `n8n_chat_analytics_sync` (runs monthly)

---

## Layer 3: Time-Bomb Enforcement

### Timeline

```
Day 0: Premium feature first used, timestamp stored
        │
Days 1-7: ✅ Full functionality (grace period)
        │  - No warnings, no restrictions
        │  - Allows time for legitimate license issues
        │
Days 8-14: ⚠️ Warning phase
        │  - Subtle admin notices appear
        │  - "License verification pending"
        │  - All features still work
        │
Days 15-30: 🔶 Degradation phase
        │  - Some premium features disabled
        │  - Performance slightly reduced
        │  - More prominent warnings
        │
Day 30+: 🔴 Basic mode
           - All premium features disabled
           - Core chat still works (don't break user sites)
           - Clear upgrade prompts
```

### Tracking Variables

```php
// Stored in wp_options with misleading names
$tracking = [
    'n8n_chat_feature_init' => time(),      // When premium first used
    'n8n_chat_runtime_cache' => [            // Cached state
        'st' => 'active',                     // Status
        'ts' => time(),                       // Timestamp
        'sg' => hash('sha256', $secret),      // Signature
    ],
];
```

---

## Layer 4: Integrity Verification

### Protected Files

| File | Why Critical |
|------|--------------|
| `class-license-manager.php` | Primary license logic |
| `class-runtime-analytics.php` | Secondary verifier |
| `class-plugin.php` | Initialization |
| `template-tags.php` | Helper functions |

### Verification Method

1. At build time: Generate SHA256 hashes of protected files
2. Store hashes obfuscated in code (base64 encoded, split across variables)
3. At runtime: Compare current file hashes against stored values
4. If mismatch: Flag as potentially tampered, accelerate degradation

### Hash Storage (Obfuscated)

```php
// Looks like random config data
private static $_rt = 'YTFiMmMzZDQ=';  // Part 1 of hash
private static $_cfg = 'ZTVmNmc3aDg='; // Part 2 of hash

// Reconstructed at runtime
$expected = base64_decode(self::$_rt) . base64_decode(self::$_cfg);
```

---

## Layer 5: Distributed Checkpoints

### Checkpoint Locations

**1. In `class-assets.php` (Frontend Loading)**
```php
// Hidden in asset URL generation
private function _prepare_asset_url($handle) {
    // Innocent-looking cache key generation
    $_ck = $this->_get_cache_key();
    if (!$this->_validate_cache_key($_ck)) {
        // Silently degrade - load basic assets only
        return $this->_get_basic_asset_url($handle);
    }
    return $this->_get_premium_asset_url($handle);
}
```

**2. In `class-public-endpoints.php` (API)**
```php
// Hidden in response preparation
private function _prepare_response($data) {
    // "Performance optimization" check
    if (!$this->_check_runtime_config()) {
        // Add subtle limitations
        $data['_limited'] = true;
        unset($data['premium_features']);
    }
    return $data;
}
```

**3. In `template-tags.php` (Helper Functions)**
```php
function n8_is_premium() {
    // Primary check (visible)
    $manager = License_Manager::get_instance();
    if (!$manager->is_premium()) return false;

    // Hidden secondary check (obfuscated)
    if (!_n8_internal_verify()) return false;

    return true;
}
```

---

## Layer 6: Telemetry

### Data Collected (Anonymized)

```json
{
    "sh": "a1b2c3...",           // SHA256 of home_url (anonymous)
    "ls": "active",              // License status
    "lk": "N8C-****-****-XXXX",  // Masked license key
    "pv": "1.2.0",               // Plugin version
    "di": 45,                    // Days since install
    "pf": true,                  // Premium features used
    "ic": "ok",                  // Integrity check result
    "wp": "6.4.2",               // WordPress version
    "ph": "8.2"                  // PHP version
}
```

### Endpoint

```
POST https://n8.chat/api/telemetry/heartbeat
```

### Frequency

- On activation: Immediate
- On admin login: If >24h since last sync
- Background: Monthly via WP Cron
- On license change: Immediate

### Piracy Detection Signals

| Signal | Indication |
|--------|------------|
| Same license key on 50+ sites | License sharing/piracy |
| `ic: "modified"` | File tampering |
| Premium features used, license invalid | Likely nulled version |
| Sudden spike in new site activations | Pirated distribution |

---

## Obfuscation Techniques

### Variable Names

| Real Purpose | Obfuscated Name |
|--------------|-----------------|
| License status | `$_st`, `$_cfg['s']` |
| Is valid | `$_v`, `$_ok` |
| License key | `$_lk`, `$_k` |
| Verification result | `$_vr`, `$_chk` |
| Timestamp | `$_ts`, `$_t` |

### Function Names

| Real Purpose | Obfuscated Name |
|--------------|-----------------|
| Verify license | `_sync_runtime()`, `_prepare_cache()` |
| Check integrity | `_validate_baseline()`, `_check_perf()` |
| Is premium valid | `_get_feature_level()`, `_check_tier()` |
| Report telemetry | `_sync_analytics()`, `_heartbeat()` |

### String Encoding

```php
// Instead of:
$endpoint = 'https://n8.chat/api/license/validate';

// Use:
$_ep = base64_decode('aHR0cHM6Ly9uOC5jaGF0L2FwaS9saWNlbnNlL3ZhbGlkYXRl');
```

---

## Implementation Order

### Phase 1: Core Infrastructure
1. ✅ Create `class-runtime-analytics.php` - Hidden verifier
2. ✅ Create `class-feature-manager.php` - Time-bomb logic
3. ✅ Update `class-plugin.php` - Load new classes

### Phase 2: Distributed Checkpoints
4. ✅ Update `class-assets.php` - Asset loading check
5. ✅ Update `class-public-endpoints.php` - API check
6. ✅ Update `template-tags.php` - Helper function check

### Phase 3: Integrity & Telemetry
7. ✅ Add integrity verification logic
8. ✅ Add telemetry reporting
9. ✅ Add file hash generation (build step)

### Phase 4: Testing
10. Test with valid license - should work perfectly
11. Test with no license - should work in basic mode
12. Test with expired license - should degrade gracefully
13. Test with modified files - should detect tampering

---

## Security Notes

### For Legitimate Users
- All checks are transparent - valid license = full features
- Grace periods prevent accidental lockouts
- Network failures use cached validation
- Never breaks sites or causes data loss

### Against Pirates
- Multiple independent verification points
- Time-delayed enforcement hides what triggered it
- Obfuscated code is harder to understand
- Integrity checks detect common modifications
- Telemetry helps identify pirated distributions

### Legal Considerations
- No "phone home" without user awareness (privacy policy)
- Telemetry is anonymized (site hash, not URL)
- Degradation, not destruction (never corrupt data)
- Clear path to legitimacy (purchase links)

---

## File Checksums

*To be generated at build time and stored in `class-runtime-analytics.php`*

```php
private static $_baseline = [
    'lm' => '', // class-license-manager.php hash
    'ra' => '', // class-runtime-analytics.php hash
    'pl' => '', // class-plugin.php hash
    'tt' => '', // template-tags.php hash
];
```

---

## Rollback Plan

If issues arise:
1. All protection checks have fallback to "allow"
2. Emergency constant `N8N_CHAT_BYPASS_CHECKS` disables all hidden checks
3. Can disable via filter: `add_filter('n8n_chat_skip_verification', '__return_true')`

This ensures we can quickly disable protection if it causes issues for legitimate users.
