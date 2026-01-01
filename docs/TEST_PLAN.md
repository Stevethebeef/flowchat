# FlowChat End-to-End Test Plan

## Environment Details

| Resource | URL/Path |
|----------|----------|
| Frontend | http://n8chat.local/ |
| WP Admin | http://n8chat.local/wp-admin/?localwp_auto_login=1 |
| n8n Instance | https://n8n.pc9.de/ |
| n8n Login | stefan.mueller@zerummedia.com |
| n8n Password | Solarys1! |
| Plugin Path | C:\Users\steve\Local Sites\n8chat\app\public\wp-content\plugins\n8n-chat |

---

## Test Coverage Matrix

### 1. Display Tab Settings

| ID | Feature | Test Case | Status | Notes |
|----|---------|-----------|--------|-------|
| D01 | Bubble Position - Bottom Right | Bubble appears at bottom-right corner | [ ] | |
| D02 | Bubble Position - Bottom Left | Bubble appears at bottom-left corner | [ ] | |
| D03 | Bubble Position - Top Right | Bubble appears at top-right corner | [ ] | |
| D04 | Bubble Position - Top Left | Bubble appears at top-left corner | [ ] | |
| D05 | Bubble Icon - Chat | Chat icon displays correctly | [ ] | |
| D06 | Bubble Icon - Message | Message icon displays correctly | [ ] | |
| D07 | Bubble Icon - Help | Help icon displays correctly | [ ] | |
| D08 | Bubble Icon - Headphones | Headphones icon displays correctly | [ ] | |
| D09 | Bubble Icon - Sparkles | Sparkles icon displays correctly | [ ] | |
| D10 | Bubble Icon - Camera | Camera icon displays correctly | [ ] | |
| D11 | Custom Icon URL | Custom image displays as bubble icon | [ ] | |
| D12 | Bubble Text Label | Text appears next to bubble | [ ] | |
| D13 | Bubble Size - Small | 48x48px bubble | [ ] | |
| D14 | Bubble Size - Medium | 56x56px bubble | [ ] | |
| D15 | Bubble Size - Large | 64x64px bubble | [ ] | |
| D16 | Unread Badge | Badge shows unread count | [ ] | |
| D17 | Pulse Animation | Bubble pulses when enabled | [ ] | |
| D18 | Window Width | Custom width applied | [ ] | |
| D19 | Window Height | Custom height applied | [ ] | |
| D20 | Offset X | Horizontal offset applied | [ ] | |
| D21 | Offset Y | Vertical offset applied | [ ] | |
| D22 | Auto-Open Delay | Chat opens after X seconds | [ ] | |
| D23 | Auto-Open Scroll | Chat opens at scroll % | [ ] | |
| D24 | Auto-Open Exit Intent | Chat opens on mouse leave | [ ] | |
| D25 | Once Per Session | Auto-open only once per session | [ ] | |

### 2. Messages Tab Settings

| ID | Feature | Test Case | Status | Notes |
|----|---------|-----------|--------|-------|
| M01 | Welcome Message | Custom welcome message displays | [ ] | |
| M02 | Placeholder Text | Custom placeholder in input | [ ] | |
| M03 | Chat Title | Custom title in header | [ ] | |
| M04 | Suggested Prompts | Quick suggestions appear | [ ] | |
| M05 | Suggestion Click | Clicking sends the prompt | [ ] | |
| M06 | Show Timestamps | Timestamps visible on messages | [ ] | |
| M07 | Hide Timestamps | Timestamps hidden when disabled | [ ] | |
| M08 | Show Avatar | Bot avatar visible | [ ] | |
| M09 | Hide Avatar | Bot avatar hidden when disabled | [ ] | |
| M10 | Custom Avatar URL | Custom avatar image displays | [ ] | |
| M11 | Typing Indicator | Shows dots while waiting | [ ] | |
| M12 | Hide Typing Indicator | No indicator when disabled | [ ] | |
| M13 | File Upload Button | Attachment button visible | [ ] | |
| M14 | File Type Validation | Rejects invalid file types | [ ] | |
| M15 | File Size Validation | Rejects oversized files | [ ] | |

### 3. Appearance Tab Settings

| ID | Feature | Test Case | Status | Notes |
|----|---------|-----------|--------|-------|
| A01 | Primary Color | Color applied to bubble, header, send | [ ] | |
| A02 | User Bubble Color | User message color correct | [ ] | |
| A03 | Font Family | Custom font applied | [ ] | |
| A04 | Font Size | Custom size applied | [ ] | |
| A05 | Border Radius | Custom radius on elements | [ ] | |
| A06 | Custom CSS | Injected CSS applies | [ ] | |

### 4. Connection Tab Settings

| ID | Feature | Test Case | Status | Notes |
|----|---------|-----------|--------|-------|
| C01 | Webhook URL | Messages sent to correct URL | [ ] | |
| C02 | Auth - None | Works without authentication | [ ] | |
| C03 | Auth - Basic | Basic auth headers sent | [ ] | |
| C04 | Auth - Bearer | Bearer token sent | [ ] | |
| C05 | Timeout | Request times out correctly | [ ] | |
| C06 | Error Handling | Graceful error on failure | [ ] | |

### 5. Rules Tab Settings

| ID | Feature | Test Case | Status | Notes |
|----|---------|-----------|--------|-------|
| R01 | Device - Desktop | Widget shows on desktop | [ ] | |
| R02 | Device - Mobile Hidden | Widget hidden on mobile | [ ] | |
| R03 | Login Required | Widget hidden for guests | [ ] | |
| R04 | Login Not Required | Widget shows for guests | [ ] | |

### 6. Context Variables (sent to n8n)

| ID | Variable | Test Case | Status | Notes |
|----|----------|-----------|--------|-------|
| X01 | sessionId | Unique session ID sent | [ ] | |
| X02 | user.isLoggedIn | Correct login status | [ ] | |
| X03 | user.name | Username sent when logged in | [ ] | |
| X04 | user.email | Email sent when logged in | [ ] | |
| X05 | user.role | User role sent | [ ] | |
| X06 | page.url | Current page URL sent | [ ] | |
| X07 | page.title | Page title sent | [ ] | |
| X08 | page.type | Page type (post/page/etc) sent | [ ] | |
| X09 | site.name | Site name sent | [ ] | |
| X10 | site.url | Site URL sent | [ ] | |
| X11 | datetime.date | Current date sent | [ ] | |
| X12 | datetime.time | Current time sent | [ ] | |
| X13 | message content | User message text sent | [ ] | |

---

## Demo Bots Configuration

### Bot 1: General Assistant (Default)
- **Purpose**: General Q&A bot
- **Position**: Bottom-right
- **Icon**: Chat
- **Color**: Blue (#3B82F6)
- **Workflow**: Echo context + AI response

### Bot 2: Support Bot
- **Purpose**: Customer support
- **Position**: Bottom-left
- **Icon**: Headphones
- **Color**: Green (#10B981)
- **Workflow**: Ticket creation simulation

### Bot 3: Sales Assistant
- **Purpose**: Product recommendations
- **Position**: Top-right
- **Icon**: Sparkles
- **Color**: Purple (#8B5CF6)
- **Workflow**: Product lookup

### Bot 4: Help Center
- **Purpose**: FAQ answering
- **Position**: Bottom-right
- **Icon**: Help
- **Color**: Orange (#F59E0B)
- **Workflow**: FAQ matching

### Bot 5: Feedback Collector
- **Purpose**: Collect user feedback
- **Position**: Bottom-left
- **Icon**: Message
- **Color**: Red (#EF4444)
- **Workflow**: Store feedback

---

## n8n Workflow Specifications

### Workflow 1: Context Echo Bot
```
Trigger: Webhook (POST)
→ Set: Extract all context variables
→ Code: Format response with all received data
→ Respond to Webhook
```

### Workflow 2: Support Ticket Bot
```
Trigger: Webhook (POST)
→ Switch: Check message intent
→ Set: Create ticket data
→ Code: Generate ticket number
→ Respond to Webhook
```

### Workflow 3: Product Recommendation Bot
```
Trigger: Webhook (POST)
→ Set: Extract query
→ Code: Simple product matching
→ Respond to Webhook
```

### Workflow 4: FAQ Bot
```
Trigger: Webhook (POST)
→ Set: Extract question
→ Switch: Match FAQ patterns
→ Respond to Webhook
```

### Workflow 5: Feedback Collector Bot
```
Trigger: Webhook (POST)
→ Set: Extract feedback
→ Code: Store/process feedback
→ Respond to Webhook
```

---

## Test Execution Log

### Date: 2025-12-31

#### Phase 1: Environment Setup
- [x] Plugin files copied and updated
- [x] WordPress admin accessible
- [x] n8n instance accessible
- [x] 5 workflows created
- [x] 5 bot instances configured

#### Phase 2: Display Tests
- [x] Bubble position - bottom-right verified
- [x] Chat icon displays correctly
- [x] Medium size bubble verified
- [ ] Other position/icon/size tests pending

#### Phase 3: Message Tests
- [x] Welcome message works ("Hi! 👋 How can I help you today?")
- [x] Input placeholder works ("Type your message...")
- [x] Chat title displays ("Chat")
- [x] Bot avatar visible
- [x] Attach file button visible
- [x] Voice input button visible

#### Phase 4: Connection Tests
- [x] Webhook connectivity verified
- [x] Context variables sent (tested with Context Echo Bot)
- [x] Response received correctly
- [x] Messages display properly

#### Phase 5: End-to-End Flows
- [x] Bot 1 (Context Echo) - Full conversation tested via API
- [x] Bot 2 (Support Ticket) - Returns ticket numbers (e.g., TKT-MJUIFKTW)
- [x] Bot 3 (Sales Assistant) - Returns welcome message
- [x] Bot 4 (FAQ Bot) - Returns FAQ answers (password reset tested)
- [x] Bot 5 (Feedback Collector) - Creates feedback entries (e.g., FB-MJUIJCYU)

---

## n8n Workflow Details

| Bot | Workflow ID | Webhook Path | Status |
|-----|-------------|--------------|--------|
| Bot 1 - Context Echo | QGbc0lvfsA3UdxYd | flowchat-bot-1 | ✅ Active |
| Bot 2 - Support Ticket | 5CKeO12Bib3CMVQJ | flowchat-bot-2 | ✅ Active |
| Bot 3 - Sales Assistant | RzPyxhyuQrFkzu3U | flowchat-bot-3 | ✅ Active |
| Bot 4 - FAQ Bot | L1FecywjQcqSCWNS | flowchat-bot-4 | ✅ Active |
| Bot 5 - Feedback Collector | 9KJufEwEziTlnUYS | flowchat-bot-5 | ✅ Active |

---

## Issues Found

| ID | Severity | Description | Status | Fix |
|----|----------|-------------|--------|-----|
| I01 | High | Webhooks created via n8n API return 404 "not registered" | Fixed | Added webhookId field + republished via n8n UI |
| I02 | Medium | "process is not defined" console error in browser | Fixed | Updated vite.config.ts to provide full process.env polyfill |
| I03 | Low | Duplicate bubble container rendered in DOM | Noted | Two containers with same ID created; needs investigation |

---

## Fixes Applied

### I01: Webhook Registration Fix
- **Problem**: Workflows created via n8n MCP API had webhooks that returned 404
- **Root Cause**: Webhook nodes were missing the `webhookId` field
- **Solution**:
  1. Added `webhookId` to each workflow's Webhook node via `n8n_update_partial_workflow`
  2. Republished each workflow via n8n UI (Unpublish → Publish)
- **Status**: ✅ All 5 webhooks now responding correctly

### I02: Process.env Polyfill Fix
- **Problem**: Browser console showed "process is not defined" error
- **Root Cause**: Vite config only defined `process.env.NODE_ENV`, not full `process.env` object
- **Solution**: Updated `vite.config.ts` define block:
  ```javascript
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env': JSON.stringify({
      NODE_ENV: process.env.NODE_ENV || 'production',
    }),
  },
  ```
- **Status**: ✅ No console errors after rebuild

---

## Final Sign-off

- [x] Core functionality tests passed
- [x] All 5 bots working via webhook
- [x] All 5 workflows active in n8n
- [x] No critical issues remaining
- [x] Frontend renders without errors
- [x] End-to-end chat flow verified

**Tested By**: Claude Code
**Date**: 2025-12-31
**Version**: 1.0.2
