# FlowChat Audit & Completion Protocol

## Instructions for Claude Code Agents

You are continuing development on an **existing FlowChat codebase**. The plugin has partial implementation. Your job is to systematically audit each specification document against the existing code, identify gaps, and implement what's missing.

---

## AGENT MISSION

**DO NOT start from scratch. DO NOT rewrite existing code unless it's broken.**

Instead:
1. Audit what exists
2. Compare against spec
3. Note what's missing
4. Implement only the gaps
5. Document progress for next agent

---

## PHASE 0: Initial Assessment (First Agent Only)

### Step 1: Explore Existing Codebase

```bash
# Get overview of what exists
find . -type f -name "*.php" | head -50
find . -type f -name "*.ts" -o -name "*.tsx" | head -50
cat package.json 2>/dev/null || echo "No package.json"
cat composer.json 2>/dev/null || echo "No composer.json"
```

### Step 2: Create/Update IMPLEMENTATION-STATUS.md

If it doesn't exist, create it. If it exists, read it first.

```markdown
# FlowChat Implementation Status

## Codebase Audit
- Audit Date: [DATE]
- Current Agent: 1
- Overall Completion: ~XX%

## Existing File Inventory

### PHP Files Found:
- [ ] flowchat.php - EXISTS / MISSING
- [ ] includes/autoload.php - EXISTS / MISSING
- [ ] includes/class-plugin.php - EXISTS / MISSING
- [ ] includes/class-activator.php - EXISTS / MISSING
- [ ] includes/class-deactivator.php - EXISTS / MISSING
- [ ] includes/core/class-instance-manager.php - EXISTS / MISSING
- [ ] includes/core/class-session-manager.php - EXISTS / MISSING
- [ ] includes/core/class-context-builder.php - EXISTS / MISSING
- [ ] includes/core/class-instance-router.php - EXISTS / MISSING
- [ ] includes/core/class-file-handler.php - EXISTS / MISSING
- [ ] includes/api/class-public-endpoints.php - EXISTS / MISSING
- [ ] includes/api/class-admin-endpoints.php - EXISTS / MISSING
- [ ] includes/frontend/class-frontend.php - EXISTS / MISSING
- [ ] includes/frontend/class-shortcode.php - EXISTS / MISSING
- [ ] includes/frontend/class-assets.php - EXISTS / MISSING
- [ ] includes/frontend/class-widget.php - EXISTS / MISSING
- [ ] includes/admin/class-admin.php - EXISTS / MISSING
- [ ] includes/admin/class-menu.php - EXISTS / MISSING
- [ ] includes/database/class-schema.php - EXISTS / MISSING

### TypeScript/React Files Found:
- [ ] src/index.ts - EXISTS / MISSING
- [ ] src/admin-index.ts - EXISTS / MISSING
- [ ] src/runtime/N8nRuntimeAdapter.ts - EXISTS / MISSING
- [ ] src/components/chat/ChatWidget.tsx - EXISTS / MISSING
- [ ] src/components/chat/ChatHeader.tsx - EXISTS / MISSING
- [ ] src/components/chat/ChatMessages.tsx - EXISTS / MISSING
- [ ] src/components/chat/ChatMessage.tsx - EXISTS / MISSING
- [ ] src/components/chat/ChatInput.tsx - EXISTS / MISSING
- [ ] src/components/chat/TypingIndicator.tsx - EXISTS / MISSING
- [ ] src/components/bubble/BubbleWidget.tsx - EXISTS / MISSING
- [ ] src/components/bubble/BubbleTrigger.tsx - EXISTS / MISSING
- [ ] src/components/bubble/BubblePanel.tsx - EXISTS / MISSING
- [ ] src/components/admin/App.tsx - EXISTS / MISSING
- [ ] src/components/admin/InstanceList.tsx - EXISTS / MISSING
- [ ] src/components/admin/InstanceEditor.tsx - EXISTS / MISSING
- [ ] src/hooks/useChat.ts - EXISTS / MISSING
- [ ] src/hooks/useBubble.ts - EXISTS / MISSING
- [ ] src/context/FlowChatContext.tsx - EXISTS / MISSING
- [ ] src/types/index.ts - EXISTS / MISSING
- [ ] src/styles/chat.css - EXISTS / MISSING
- [ ] src/styles/admin.css - EXISTS / MISSING

### Config Files Found:
- [ ] package.json - EXISTS / MISSING
- [ ] composer.json - EXISTS / MISSING
- [ ] vite.config.ts - EXISTS / MISSING
- [ ] tsconfig.json - EXISTS / MISSING

## Document-by-Document Audit

| # | Document | Status | Completion | Issues Found |
|---|----------|--------|------------|--------------|
| 1 | DEVELOPER-MASTER-PROMPT.md | ⏳ Pending | -% | - |
| 2 | 02-database-schema.md | ⏳ Pending | -% | - |
| 3 | 04-chat-instances-config.md | ⏳ Pending | -% | - |
| 4 | 07-api-endpoints.md | ⏳ Pending | -% | - |
| 5 | 08-shortcodes-blocks.md | ⏳ Pending | -% | - |
| 6 | 06-n8n-runtime-adapter.md | ⏳ Pending | -% | - |
| 7 | 05-frontend-components.md | ⏳ Pending | -% | - |
| 8 | 09-bubble-system.md | ⏳ Pending | -% | - |
| 9 | 03-admin-ui-spec.md | ⏳ Pending | -% | - |
| 10 | 10-authentication-security.md | ⏳ Pending | -% | - |
| 11 | 16-ADDENDUM-critical-fixes.md | ⏳ Pending | -% | - |
| 12 | 11-error-handling.md | ⏳ Pending | -% | - |
| 13 | 12-feature-gating.md | ⏳ Pending | -% | - |
| 14 | 13-templates-system.md | ⏳ Pending | -% | - |
| 15 | 15-build-deployment.md | ⏳ Pending | -% | - |
| 16 | FINAL-VERIFICATION | ⏳ Pending | -% | - |

## Detailed Gap Analysis

### Document 1: Core Bootstrap
Requirements from spec:
- [ ] Plugin header with correct metadata
- [ ] Version constant defined
- [ ] Autoloader with PSR-4 style loading
- [ ] Main Plugin class with singleton
- [ ] Activator with database table creation
- [ ] Deactivator with cleanup
- [ ] Proper hook registration

Existing implementation notes:
[To be filled by agent]

Missing/Incomplete:
[To be filled by agent]

---
[Continue for each document...]
---

## Agent Session Log

### Agent 1 - [DATE]
**Document Processed:** 
**Time Spent:**
**Files Created:**
**Files Modified:**
**Issues Found:**
**Handoff Notes:**

### Agent 2 - [DATE]
[To be filled...]
```

---

## AGENT WORKFLOW: Audit & Complete

### For EVERY Agent Session:

#### Step 1: Read Status (ALWAYS FIRST)
```
1. Open IMPLEMENTATION-STATUS.md
2. Read previous agent's handoff notes
3. Identify which document to audit next
4. Note any known issues
```

#### Step 2: Deep Audit of Current Document

For the spec document you're processing:

```
1. Read the ENTIRE spec document carefully
2. List ALL requirements (be thorough!)
3. For EACH requirement:
   a. Find the relevant file(s) in codebase
   b. Check if implementation matches spec
   c. Mark as:
      ✅ Complete - Matches spec fully
      ⚠️ Partial - Exists but incomplete or differs from spec  
      ❌ Missing - Not implemented at all
      🐛 Broken - Exists but has bugs
```

#### Step 3: Create Detailed Gap Report

Before implementing anything, document:

```markdown
## Gap Report: [Document Name]

### Requirements Checklist

#### Section: [e.g., Database Tables]
| Requirement | Status | File | Notes |
|-------------|--------|------|-------|
| Sessions table with uuid column | ✅ | class-activator.php | Correct |
| Messages table with JSON content | ⚠️ | class-activator.php | Missing session_uuid index |
| Fallback messages table | ❌ | - | Not created |

#### Section: [e.g., API Endpoints]
| Requirement | Status | File | Notes |
|-------------|--------|------|-------|
| GET /init endpoint | ✅ | class-public-endpoints.php | Works |
| POST /upload endpoint | ❌ | - | Not implemented |
| Nonce verification | ⚠️ | class-public-endpoints.php | Only on some endpoints |

[Continue for all sections in the spec...]
```

#### Step 4: Implement Gaps (Priority Order)

Work through gaps in this order:
1. 🐛 **Broken** - Fix bugs first
2. ❌ **Missing (Critical)** - Core functionality 
3. ⚠️ **Partial** - Complete incomplete implementations
4. ❌ **Missing (Non-critical)** - Nice-to-haves

For each implementation:
```
1. State what you're implementing
2. Show the code
3. Explain how it connects to existing code
4. Note any dependencies
```

#### Step 5: Verify Your Changes

```
1. Check for syntax errors
2. Verify imports/requires are correct
3. Test if possible (even manually tracing logic)
4. Ensure no regressions to working code
```

#### Step 6: Update Status File

```markdown
## Document X: [Name]
**Status:** ✅ Complete (or ⚠️ Partial - reason)
**Completion:** 95%
**Agent:** [session number]

### What Was Done:
- Fixed: [list]
- Added: [list]  
- Modified: [list]

### What Remains:
- [anything left for next agent]

### Issues Discovered:
- [any problems found]

### Handoff Notes:
- [critical info for next agent]
```

---

## DOCUMENT PROCESSING ORDER

Audit documents in this order (dependencies first):

| Order | Document | Focus Area | Critical Files |
|-------|----------|------------|----------------|
| 1 | DEVELOPER-MASTER-PROMPT.md | Core bootstrap | flowchat.php, autoload, plugin class |
| 2 | 02-database-schema.md | Database | activator, schema |
| 3 | 04-chat-instances-config.md | Instance config | instance-manager |
| 4 | 07-api-endpoints.md | REST API | public/admin endpoints |
| 5 | 08-shortcodes-blocks.md | WP integration | shortcode, assets |
| 6 | 06-n8n-runtime-adapter.md | n8n connection | N8nRuntimeAdapter.ts |
| 7 | 05-frontend-components.md | React chat | ChatWidget, etc |
| 8 | 09-bubble-system.md | Bubble mode | BubbleWidget, etc |
| 9 | 03-admin-ui-spec.md | Admin UI | admin components |
| 10 | 10-authentication-security.md | Security | auth, nonces |
| 11 | 16-ADDENDUM-critical-fixes.md | Critical fixes | context builder, file handler |
| 12 | 11-error-handling.md | Errors | error system |
| 13 | 12-feature-gating.md | Premium | license, gating |
| 14 | 13-templates-system.md | Templates | template system |
| 15 | 15-build-deployment.md | Build | configs, scripts |
| 16 | FINAL-VERIFICATION | Full test | everything |

---

## PROMPT TO START EACH AGENT SESSION

### For First Agent (Initial Audit):

```
# FlowChat Audit & Completion - Agent 1

You are auditing and completing an existing FlowChat WordPress plugin codebase.

## Your Protocol
Read `specs/AGENT-WORKFLOW-PROTOCOL.md` for the full workflow.

## Your Tasks for This Session

### 1. Explore Existing Code
First, explore what already exists:
- List all PHP files in includes/
- List all TS/TSX files in src/
- Check package.json, composer.json
- Check if build/ folder has compiled assets

### 2. Create/Update Status File
Create or update `IMPLEMENTATION-STATUS.md` with:
- Full inventory of existing files (mark EXISTS or MISSING)
- Initial assessment of completion %

### 3. Audit Document 1: DEVELOPER-MASTER-PROMPT.md
Read the spec and check EVERY requirement against existing code:
- Does flowchat.php exist and have correct headers?
- Does autoloader work correctly?
- Does Plugin class initialize properly?
- Does Activator create all database tables?
- Are all dependencies in package.json?

For each requirement, mark: ✅ Complete | ⚠️ Partial | ❌ Missing | 🐛 Broken

### 4. Implement Gaps
Fix/add anything missing from Document 1.

### 5. Update Status & Handoff
Update IMPLEMENTATION-STATUS.md with your findings and progress.

## Output Format
Structure your response as:
1. **Exploration Results** - What exists
2. **Gap Analysis** - What's missing/broken per spec
3. **Implementation** - Code you're adding/fixing
4. **Status Update** - Progress summary
5. **Handoff Notes** - For next agent

Begin by exploring the codebase structure.
```

---

### For Subsequent Agents:

```
# FlowChat Audit & Completion - Continue

You are continuing the systematic audit and completion of FlowChat.

## First: Read Status
Open `IMPLEMENTATION-STATUS.md` and read:
- Previous agent's handoff notes
- Which document to process next
- Any known issues or blockers

## Then: Audit Next Document
1. Read the entire spec document thoroughly
2. Check existing code against EVERY requirement
3. Create detailed gap report with status markers:
   ✅ Complete | ⚠️ Partial | ❌ Missing | 🐛 Broken
4. Implement all missing/broken items
5. Update status file

## Your Checklist Before Stopping
- [ ] Read previous agent notes
- [ ] Identified which document is next
- [ ] Read entire spec document
- [ ] Audited EVERY requirement against existing code
- [ ] Created gap report
- [ ] Implemented all ❌ Missing items
- [ ] Fixed all 🐛 Broken items
- [ ] Completed all ⚠️ Partial items
- [ ] Tested changes where possible
- [ ] Updated IMPLEMENTATION-STATUS.md
- [ ] Wrote detailed handoff notes for next agent

## Output Format
1. **Status Check** - What I learned from previous agent
2. **Document Being Processed** - Which spec, why it's next
3. **Gap Analysis** - Detailed requirement-by-requirement checklist
4. **Implementations** - What I added/fixed (show code)
5. **Verification** - How I confirmed it works
6. **Handoff** - Clear notes for next agent

Begin by reading IMPLEMENTATION-STATUS.md
```

---

## COMMON SCENARIOS

### "File exists but doesn't match spec"

```
1. Document the specific differences
2. Determine if existing code is:
   a. Wrong → Fix it to match spec
   b. Different but functionally equivalent → Note it, keep it
   c. Outdated approach → Refactor to match spec
3. Be careful not to break working features
4. Test after changes
```

### "Spec requirement seems unnecessary"

```
1. Implement it anyway (spec is source of truth)
2. Note your concern in handoff notes
3. Let human decide later if it should be removed
```

### "Found a bug unrelated to current document"

```
1. Note it in status file under "Issues Discovered"
2. Fix it only if it's blocking your current work
3. Otherwise leave for appropriate document audit
```

### "Code exists but is clearly incomplete"

```
1. Check what's there carefully
2. Add only what's missing
3. Don't rewrite working parts
4. Mark as ⚠️ Partial → ✅ Complete after fixing
```

### "Dependency on code not yet implemented"

```
1. Create minimal stub/placeholder if needed
2. Mark as "⚠️ Partial - needs X implemented first"
3. Note the dependency clearly in handoff
4. Continue with what you can complete
```

### "Not sure if something matches spec"

```
1. Default to implementing spec exactly
2. When spec is ambiguous, check FINAL-CONSOLIDATED-SPEC.md
3. Note uncertainty in handoff for human review
```

---

## FINAL VERIFICATION CHECKLIST

After all documents audited, final agent runs this complete check:

### Plugin Lifecycle
```
□ Plugin activates without PHP errors
□ Plugin deactivates cleanly  
□ Plugin uninstall removes all data
□ No errors in debug.log
```

### Database
```
□ wp_flowchat_sessions table exists with correct columns
□ wp_flowchat_messages table exists with correct columns
□ wp_flowchat_fallback_messages table exists
□ All indexes created
□ Foreign keys working
```

### Admin Interface
```
□ FlowChat menu appears in admin
□ Dashboard page loads
□ Instances list page loads
□ Can create new instance
□ Can edit existing instance
□ Can delete instance
□ Settings page loads and saves
□ Live preview shows chat correctly
```

### Chat Widget
```
□ Shortcode [flowchat] renders container
□ Chat initializes and shows welcome message
□ Can type and send message
□ Message appears in chat
□ Connects to n8n webhook
□ Response streams in real-time
□ Typing indicator shows during response
□ Suggested prompts work
□ Timestamps show (if enabled)
□ Avatars show (if enabled)
```

### Bubble Mode
```
□ Bubble appears in correct position
□ Bubble click opens chat panel
□ Chat works inside bubble panel
□ Close button closes panel
□ State persists across page navigation
□ Auto-open triggers work (delay, scroll, exit-intent)
□ Once-per-session setting works
```

### File Uploads
```
□ Attach button appears (if enabled)
□ Can select file
□ File uploads to temp folder (not media library)
□ URL returned to chat
□ Old files cleaned up by cron
```

### System Prompts
```
□ Dynamic tags resolve correctly
□ {site_name} works
□ {current_page_title} works
□ {user_name} works
□ {user_role} works
□ WooCommerce tags work (if WC active)
```

### URL Routing
```
□ Instance loads based on URL rules
□ Priority order respected
□ Wildcard patterns work
□ Post type rules work
□ User role rules work
```

### Security
```
□ Nonces verified on all forms
□ Capabilities checked on admin actions
□ Inputs sanitized
□ Outputs escaped
□ Access control per instance works
□ Rate limiting works (if implemented)
```

### Error Handling
```
□ Connection error shows friendly message
□ Timeout shows friendly message
□ Invalid response handled gracefully
□ Fallback form appears when n8n down
□ Fallback submission works
□ Email notification sent
```

### Templates
```
□ Template browser shows built-in templates
□ Can preview template
□ Can apply template to instance
□ Style presets work
□ Content presets work
```

### Build & Assets
```
□ npm run build succeeds without errors
□ build/frontend/chat.js exists
□ build/frontend/chat.css exists
□ build/admin/admin.js exists
□ build/admin/admin.css exists
□ Assets load correctly on frontend
□ Assets load correctly in admin
□ No console errors
```

### Code Quality
```
□ No PHP warnings or notices
□ No JavaScript console errors
□ All text uses translation functions
□ No hardcoded URLs
□ Follows WordPress coding standards
```

---

## QUICK REFERENCE

### Key Files to Check First
```
flowchat.php          → Does plugin load?
includes/autoload.php → Do classes autoload?
package.json          → Are dependencies listed?
build/                → Are assets compiled?
```

### Most Common Gaps Found
```
1. Missing database indexes (especially session_uuid)
2. Incomplete instance config fields
3. Missing API endpoints (upload, fallback)
4. Context builder not implemented
5. File handler missing
6. Shadow DOM preview not done
7. Missing error boundaries in React
8. No fallback contact form
9. URL routing not implemented
10. System prompt tags not resolving
```

### When Specs Conflict
Use this priority:
1. FINAL-CONSOLIDATED-SPEC.md (highest authority)
2. 16-ADDENDUM-critical-fixes.md 
3. Individual spec documents
4. DEVELOPER-MASTER-PROMPT.md (implementation guide)

---

## SUCCESS CRITERIA

The plugin is complete when:
- [ ] All 16 documents marked ✅ Complete
- [ ] Final verification checklist 100% passed
- [ ] No known bugs or blockers
- [ ] Build succeeds
- [ ] Fresh install from zip works
- [ ] Human has reviewed and approved
