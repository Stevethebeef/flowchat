# License Enforcement Implementation Plan

## Overview

This document outlines the implementation plan for enforcing the license system across the N8.Chat WordPress plugin. The license infrastructure exists but features are not gated.

## Current State

- **License System**: ✅ Implemented (License_Manager, Feature_Manager, Runtime_Analytics)
- **Feature Enforcement**: ❌ Not implemented (no checks in UI or API)
- **Premium Features**: All accessible to everyone regardless of license

---

## Phase 1: Frontend Gating Components

### 1.1 Create PremiumFeature Wrapper Component

**File**: `src/components/admin/shared/PremiumFeature.tsx`

**Purpose**: Wraps premium features with license check and shows upgrade CTA

**Features**:
- [ ] Check feature availability via context
- [ ] Show lock icon + "Pro" badge for locked features
- [ ] Show upgrade CTA with link to n8.chat
- [ ] Support `disabled` mode (show but disable) vs `hidden` mode
- [ ] Support custom fallback content

**Test**:
- [ ] Renders children when feature available
- [ ] Shows lock/upgrade when feature unavailable
- [ ] Clicking upgrade opens correct URL

### 1.2 Create InstanceLimitGate Component

**File**: `src/components/admin/shared/InstanceLimitGate.tsx`

**Purpose**: Gates instance creation based on tier limits

**Features**:
- [ ] Check current instance count vs limit
- [ ] Show "Add Instance" when under limit
- [ ] Show upgrade prompt when at limit
- [ ] Display current/max count

**Test**:
- [ ] Free tier: blocks at 1 instance
- [ ] Pro tier: blocks at 10 instances
- [ ] Enterprise tier: unlimited

### 1.3 Create useLicenseStatus Hook

**File**: `src/hooks/useLicenseStatus.ts`

**Purpose**: Fetch and cache license status from API

**Features**:
- [ ] Fetch from `/n8n-chat/v1/admin/license`
- [ ] Cache response in React state
- [ ] Expose: tier, isPremium, features, limits
- [ ] Handle loading/error states

---

## Phase 2: Connect FeatureFlagsContext to Backend

### 2.1 Update FeatureFlagsProvider

**File**: `src/context/FeatureFlagsContext.tsx`

**Changes**:
- [ ] Fetch actual license status from API on mount
- [ ] Replace hardcoded tier with API response
- [ ] Add loading state while fetching
- [ ] Fallback to 'free' on error

### 2.2 Update App.tsx to Initialize License

**File**: `src/components/admin/App.tsx`

**Changes**:
- [ ] Wrap app in FeatureFlagsProvider
- [ ] Pass license data from window.n8nChatAdmin.license
- [ ] Show loading indicator during license check

---

## Phase 3: Gate Admin UI Features

### 3.1 InstanceList.tsx - Instance Limit

**Location**: Lines 160-162 (Add New Instance button)

**Changes**:
- [ ] Import InstanceLimitGate
- [ ] Wrap "Add New Instance" button
- [ ] Show count badge (e.g., "1/1 instances")
- [ ] Disable button when at limit

**Test**:
- [ ] Free user with 0 instances: can create
- [ ] Free user with 1 instance: blocked
- [ ] Pro user with 10 instances: blocked

### 3.2 DisplayTab.tsx - Bubble Mode & Auto-Open

**Location**: Lines 66-108 (mode selector), 322-485 (auto-open)

**Changes**:
- [ ] Wrap Bubble mode card with PremiumFeature
- [ ] Show "Pro" badge on bubble option
- [ ] Wrap Auto-Open section with PremiumFeature
- [ ] Free users: inline mode only, no auto-open

**Test**:
- [ ] Free user sees bubble mode locked
- [ ] Free user cannot select bubble mode
- [ ] Pro user can use bubble mode

### 3.3 AppearanceTab.tsx - Custom CSS

**Location**: Lines 441-471 (Custom CSS section)

**Changes**:
- [ ] Wrap Custom CSS section with PremiumFeature
- [ ] Show lock icon on collapsed state
- [ ] Disable textarea for free users

**Test**:
- [ ] Free user sees locked Custom CSS
- [ ] Pro user can edit Custom CSS

### 3.4 RulesTab.tsx - Targeting Rules

**Location**: Entire component

**Changes**:
- [ ] Wrap Page Targeting with PremiumFeature
- [ ] Wrap Schedule section with PremiumFeature
- [ ] Keep User Access (require login) as free feature
- [ ] Keep Device Targeting as free feature

**Test**:
- [ ] Free user: basic access control only
- [ ] Pro user: full targeting rules

### 3.5 MessagesTab.tsx - File Uploads

**Location**: File upload settings section

**Changes**:
- [ ] Wrap file upload toggle with PremiumFeature
- [ ] Show "Pro" badge

**Test**:
- [ ] Free user: file uploads disabled
- [ ] Pro user: can enable file uploads

### 3.6 Tools.tsx - Export Functions

**Location**: Lines 71-153 (export functions)

**Changes**:
- [ ] Wrap Export All with PremiumFeature
- [ ] Keep Export Settings as free (for support)
- [ ] Wrap Import with PremiumFeature

**Test**:
- [ ] Free user: can export settings only
- [ ] Pro user: full import/export

---

## Phase 4: Backend API Gating

### 4.1 Instance Creation Limit

**File**: `includes/api/class-admin-endpoints.php`

**Endpoint**: `POST /instances`

**Changes**:
- [ ] Check instance count before creation
- [ ] Return 403 with upgrade message when at limit
- [ ] Include limit info in error response

**Test**:
- [ ] API rejects instance creation when at limit
- [ ] Error message includes upgrade URL

### 4.2 File Upload Gating

**File**: `includes/api/class-public-endpoints.php`

**Endpoint**: `POST /upload`

**Changes**:
- [ ] Check file_uploads feature before accepting
- [ ] Return 403 for non-premium users
- [ ] Log attempted premium feature use

**Test**:
- [ ] Free user upload rejected
- [ ] Pro user upload accepted

### 4.3 History Endpoints Gating

**File**: `includes/api/class-public-endpoints.php`

**Endpoints**: `GET/POST /history`

**Changes**:
- [ ] Check history feature availability
- [ ] Return empty array for free users on GET
- [ ] Silently skip storage for free users on POST

**Test**:
- [ ] Free user: history not stored
- [ ] Pro user: history works normally

### 4.4 Export Gating

**File**: `includes/api/class-admin-endpoints.php`

**Endpoint**: `GET /export`

**Changes**:
- [ ] Check export_data feature for full export
- [ ] Allow settings-only export for free
- [ ] Return 403 for premium export types

**Test**:
- [ ] Free user: settings export works
- [ ] Free user: full export blocked
- [ ] Pro user: all exports work

---

## Phase 5: Localize License Data to Frontend

### 5.1 Update Admin Script Localization

**File**: `includes/admin/class-admin.php` or equivalent

**Changes**:
- [ ] Add license status to window.n8nChatAdmin
- [ ] Include: tier, isPremium, features array, limits object
- [ ] Include upgrade URL with UTM params

**Data Structure**:
```javascript
window.n8nChatAdmin.license = {
  tier: 'free' | 'pro' | 'enterprise',
  isPremium: boolean,
  features: {
    multiInstance: boolean,
    bubble: boolean,
    history: boolean,
    fileUpload: boolean,
    voiceInput: boolean,
    customCss: boolean,
    autoOpen: boolean,
    targeting: boolean,
    schedule: boolean,
    export: boolean
  },
  limits: {
    maxInstances: number | null,
    maxTemplates: number | null
  },
  upgradeUrl: 'https://n8.chat/pricing?utm_source=plugin'
}
```

---

## Phase 6: UI Polish

### 6.1 Create ProBadge Component

**File**: `src/components/admin/shared/ProBadge.tsx`

**Purpose**: Small "PRO" badge to mark premium features

**Styles**:
- Orange/gold background (#FF6B2C or gold)
- Small pill shape
- "PRO" or crown icon

### 6.2 Create UpgradeModal Component

**File**: `src/components/admin/shared/UpgradeModal.tsx`

**Purpose**: Modal shown when trying to use locked features

**Features**:
- [ ] Feature name and description
- [ ] Benefits list
- [ ] Pricing/CTA button
- [ ] "Maybe later" dismiss

### 6.3 Add Upgrade Notice to Dashboard

**File**: `src/components/admin/Dashboard.tsx`

**Changes**:
- [ ] Show banner for free users
- [ ] Highlight premium features available
- [ ] Link to upgrade page

---

## Phase 7: Testing Checklist

### 7.1 Free Tier Testing

- [ ] Can create exactly 1 instance
- [ ] Cannot create 2nd instance (UI blocked)
- [ ] Cannot create 2nd instance (API blocked)
- [ ] Can only use inline mode
- [ ] Bubble mode shows locked
- [ ] Auto-open shows locked
- [ ] Custom CSS shows locked
- [ ] Page targeting shows locked
- [ ] Schedule shows locked
- [ ] File upload disabled
- [ ] Voice input disabled (if exists)
- [ ] History not stored
- [ ] Export limited to settings
- [ ] Import blocked

### 7.2 Pro Tier Testing

- [ ] Can create up to 10 instances
- [ ] All display modes work
- [ ] Auto-open works
- [ ] Custom CSS works
- [ ] All targeting rules work
- [ ] File upload works
- [ ] History works
- [ ] Full export works
- [ ] Import works

### 7.3 Grace Period Testing

- [ ] Features work during grace
- [ ] Warning banner shows
- [ ] Days countdown accurate

### 7.4 Expired License Testing

- [ ] Reverts to free tier limits
- [ ] Existing configs preserved but limited
- [ ] Clear upgrade prompts

---

## Implementation Order

1. **Phase 5** - Localize license data (backend prep)
2. **Phase 2** - Connect context to backend
3. **Phase 1** - Create gating components
4. **Phase 3** - Gate UI features
5. **Phase 4** - Gate API endpoints
6. **Phase 6** - UI polish
7. **Phase 7** - Full testing

---

## Files to Modify

### New Files
- `src/components/admin/shared/PremiumFeature.tsx`
- `src/components/admin/shared/InstanceLimitGate.tsx`
- `src/components/admin/shared/ProBadge.tsx`
- `src/components/admin/shared/UpgradeModal.tsx`
- `src/hooks/useLicenseStatus.ts`

### Modified Files
- `src/context/FeatureFlagsContext.tsx`
- `src/components/admin/App.tsx`
- `src/components/admin/InstanceList.tsx`
- `src/components/admin/tabs/DisplayTab.tsx`
- `src/components/admin/tabs/AppearanceTab.tsx`
- `src/components/admin/tabs/RulesTab.tsx`
- `src/components/admin/tabs/MessagesTab.tsx`
- `src/components/admin/Tools.tsx`
- `src/components/admin/Dashboard.tsx`
- `includes/api/class-admin-endpoints.php`
- `includes/api/class-public-endpoints.php`
- `includes/frontend/class-frontend.php` (localization)

---

## Success Criteria

1. Free users limited to 1 instance with inline mode only
2. Premium features visually locked with upgrade CTAs
3. API endpoints enforce same limits as UI
4. Existing premium users unaffected
5. Grace period provides continued access with warnings
6. Clear path to upgrade throughout UI
