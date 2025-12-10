# FlowChat Systematic Development Protocol

## Instructions for Claude Code Agents

This document defines a systematic, document-by-document approach to building FlowChat. Each agent session processes ONE specification document completely before handing off to the next agent.

---

## PHASE 0: Project Setup (First Agent Only)

### Initial Setup Tasks

```bash
# 1. Create project structure
mkdir -p flowchat/{includes,src,build,assets}

# 2. Initialize package managers
cd flowchat
npm init -y
composer init --no-interaction --name="flowchat/flowchat"

# 3. Create the handoff tracking file
touch IMPLEMENTATION-STATUS.md
```

### Create IMPLEMENTATION-STATUS.md

```markdown
# FlowChat Implementation Status

## Overview
- Started: [DATE]
- Current Phase: 0 - Setup
- Last Agent Completed: None

## Document Processing Status

| # | Document | Status | Agent | Notes |
|---|----------|--------|-------|-------|
| 1 | DEVELOPER-MASTER-PROMPT.md | ⏳ Pending | - | - |
| 2 | 01-architecture.md | ⏳ Pending | - | - |
| 3 | 02-database-schema.md | ⏳ Pending | - | - |
| 4 | 03-admin-ui-spec.md | ⏳ Pending | - | - |
| 5 | 04-chat-instances-config.md | ⏳ Pending | - | - |
| 6 | 05-frontend-components.md | ⏳ Pending | - | - |
| 7 | 06-n8n-runtime-adapter.md | ⏳ Pending | - | - |
| 8 | 07-api-endpoints.md | ⏳ Pending | - | - |
| 9 | 08-shortcodes-blocks.md | ⏳ Pending | - | - |
| 10 | 09-bubble-system.md | ⏳ Pending | - | - |
| 11 | 10-authentication-security.md | ⏳ Pending | - | - |
| 12 | 11-error-handling.md | ⏳ Pending | - | - |
| 13 | 12-feature-gating.md | ⏳ Pending | - | - |
| 14 | 13-templates-system.md | ⏳ Pending | - | - |
| 15 | 14-file-structure.md | ⏳ Pending | - | - |
| 16 | 15-build-deployment.md | ⏳ Pending | - | - |
| 17 | 16-ADDENDUM-critical-fixes.md | ⏳ Pending | - | - |
| 18 | FINAL-VERIFICATION | ⏳ Pending | - | - |

## Implementation Checklist

### Core Infrastructure
- [ ] flowchat.php (main plugin file)
- [ ] includes/autoload.php
- [ ] includes/class-plugin.php
- [ ] includes/class-activator.php
- [ ] includes/class-deactivator.php

### Database
- [ ] Database schema creation
- [ ] wp_flowchat_sessions table
- [ ] wp_flowchat_messages table
- [ ] wp_flowchat_fallback_messages table

### Core Classes
- [ ] includes/core/class-instance-manager.php
- [ ] includes/core/class-session-manager.php
- [ ] includes/core/class-context-builder.php
- [ ] includes/core/class-instance-router.php
- [ ] includes/core/class-file-handler.php

### API
- [ ] includes/api/class-public-endpoints.php
- [ ] includes/api/class-admin-endpoints.php

### Frontend PHP
- [ ] includes/frontend/class-frontend.php
- [ ] includes/frontend/class-shortcode.php
- [ ] includes/frontend/class-assets.php
- [ ] includes/frontend/class-widget.php

### Admin PHP
- [ ] includes/admin/class-admin.php
- [ ] includes/admin/class-menu.php
- [ ] includes/admin/class-settings.php

### React Components
- [ ] src/index.ts
- [ ] src/runtime/N8nRuntimeAdapter.ts
- [ ] src/components/chat/ChatWidget.tsx
- [ ] src/components/chat/ChatHeader.tsx
- [ ] src/components/chat/ChatMessages.tsx
- [ ] src/components/chat/ChatMessage.tsx
- [ ] src/components/chat/ChatInput.tsx
- [ ] src/components/chat/TypingIndicator.tsx
- [ ] src/components/bubble/BubbleWidget.tsx
- [ ] src/components/bubble/BubbleTrigger.tsx
- [ ] src/components/bubble/BubblePanel.tsx

### Admin React
- [ ] src/admin-index.ts
- [ ] src/components/admin/App.tsx
- [ ] src/components/admin/InstanceList.tsx
- [ ] src/components/admin/InstanceEditor.tsx
- [ ] src/components/admin/Preview.tsx

### Build & Config
- [ ] package.json
- [ ] composer.json
- [ ] vite.config.ts
- [ ] tsconfig.json
- [ ] src/types/index.ts

### Styles
- [ ] src/styles/chat.css
- [ ] src/styles/admin.css

## Agent Handoff Notes

### Agent 1 Notes:
[To be filled by first agent]

### Agent 2 Notes:
[To be filled by second agent]

[Continue for each agent...]
```

---

## AGENT WORKFLOW PROTOCOL

Every agent MUST follow this exact workflow:

### Step 1: Read Status (ALWAYS DO FIRST)

```
1. Read IMPLEMENTATION-STATUS.md
2. Identify which document to process next
3. Note any warnings from previous agent
```

### Step 2: Audit Current State

Before implementing anything:

```
1. List all files that currently exist
2. For the current spec document, list ALL requirements
3. Check each requirement against existing code
4. Create a checklist: ✅ Done | ❌ Missing | ⚠️ Partial
```

### Step 3: Implement Missing Items

```
1. Work through ❌ Missing items one by one
2. Fix ⚠️ Partial items
3. Test each implementation if possible
4. Commit logical chunks (if git is available)
```

### Step 4: Update Status File

```
1. Update the document status to ✅ Complete
2. Check off completed items in the checklist
3. Add detailed handoff notes for next agent
4. Note any blockers or dependencies
```

### Step 5: Handoff

```
1. Summarize what was done
2. List what the next agent should focus on
3. Note any issues discovered
```

---

## DOCUMENT PROCESSING ORDER

Process documents in this exact order:

### Document 1: DEVELOPER-MASTER-PROMPT.md
**Focus:** Core plugin bootstrap
**Must Create:**
- flowchat.php
- includes/autoload.php
- includes/class-plugin.php
- includes/class-activator.php
- includes/class-deactivator.php
- package.json
- composer.json
- vite.config.ts
- tsconfig.json

**Verification:** Plugin activates without errors in WordPress

---

### Document 2: 02-database-schema.md
**Focus:** Database tables and schema
**Must Create/Update:**
- Database table creation in Activator
- includes/database/class-schema.php
- includes/database/class-tables.php

**Verification:** Tables created on activation, correct structure

---

### Document 3: 04-chat-instances-config.md
**Focus:** Instance configuration system
**Must Create:**
- includes/core/class-instance-manager.php
- Full instance schema with all fields
- Default values

**Verification:** Can create, read, update, delete instances via code

---

### Document 4: 07-api-endpoints.md
**Focus:** REST API endpoints
**Must Create:**
- includes/api/class-public-endpoints.php
- includes/api/class-admin-endpoints.php
- /init endpoint (critical!)
- All CRUD endpoints for instances

**Verification:** Endpoints respond correctly via Postman/curl

---

### Document 5: 08-shortcodes-blocks.md
**Focus:** WordPress integration
**Must Create:**
- includes/frontend/class-shortcode.php
- includes/frontend/class-assets.php
- includes/frontend/class-widget.php

**Verification:** [flowchat] shortcode renders container

---

### Document 6: 06-n8n-runtime-adapter.md
**Focus:** The critical runtime adapter
**Must Create:**
- src/runtime/N8nRuntimeAdapter.ts
- SSE handling
- Error handling
- Abort support

**Verification:** Adapter can connect to n8n webhook and stream responses

---

### Document 7: 05-frontend-components.md
**Focus:** React chat components
**Must Create:**
- src/index.ts
- src/components/chat/ChatWidget.tsx
- src/components/chat/ChatHeader.tsx
- src/components/chat/ChatMessages.tsx
- src/components/chat/ChatMessage.tsx
- src/components/chat/ChatInput.tsx
- src/components/chat/TypingIndicator.tsx
- src/types/index.ts
- src/styles/chat.css

**Verification:** Chat widget renders and can send/receive messages

---

### Document 8: 09-bubble-system.md
**Focus:** Floating bubble widget
**Must Create:**
- src/components/bubble/BubbleWidget.tsx
- src/components/bubble/BubbleTrigger.tsx
- src/components/bubble/BubblePanel.tsx
- src/hooks/useBubble.ts
- Auto-open logic

**Verification:** Bubble appears, opens/closes, remembers state

---

### Document 9: 03-admin-ui-spec.md
**Focus:** Admin interface
**Must Create:**
- includes/admin/class-admin.php
- includes/admin/class-menu.php
- src/admin-index.ts
- src/components/admin/App.tsx
- src/components/admin/InstanceList.tsx
- src/components/admin/InstanceEditor.tsx
- src/components/admin/Preview.tsx (Shadow DOM)
- src/styles/admin.css

**Verification:** Admin pages load, can create/edit instances via UI

---

### Document 10: 10-authentication-security.md
**Focus:** Security implementation
**Must Implement:**
- Nonce verification on all endpoints
- Capability checks
- Input sanitization
- Output escaping
- Access control per instance

**Verification:** Unauthorized requests are rejected

---

### Document 11: 16-ADDENDUM-critical-fixes.md
**Focus:** Critical fixes from review
**Must Implement:**
- Context builder with dynamic tags
- System prompt processing
- File upload handler (temp storage)
- Fallback contact form
- URL-based instance routing

**Verification:** Dynamic tags resolve, files upload to temp folder

---

### Document 12: 11-error-handling.md
**Focus:** Error system
**Must Implement:**
- Error codes and messages
- Frontend error display
- Fallback mode when n8n is down
- Logging

**Verification:** Errors display properly, fallback form works

---

### Document 13: 12-feature-gating.md
**Focus:** Free vs Premium features
**Must Implement:**
- License checking
- Feature flags
- Premium feature restrictions
- Upgrade prompts

**Verification:** Premium features blocked without license

---

### Document 14: 13-templates-system.md
**Focus:** Templates and presets
**Must Implement:**
- Built-in templates (JSON files)
- Style presets
- Template browser UI
- Import/Export

**Verification:** Can apply template to instance

---

### Document 15: 15-build-deployment.md
**Focus:** Build system
**Must Create/Verify:**
- Build scripts work
- Production build creates correct files
- Plugin zip creation

**Verification:** `npm run build` succeeds, creates valid zip

---

### Document 16: FINAL-VERIFICATION
**Focus:** Complete system test
**Must Verify:**
- Fresh install works
- All features functional
- No console errors
- Responsive design
- Cross-browser testing

---

## PROMPT FOR EACH AGENT SESSION

Copy and paste this prompt to start each agent:

```
# FlowChat Development Agent

## Your Mission
You are continuing the systematic development of FlowChat, a WordPress plugin.

## First Steps (DO THESE IMMEDIATELY)

1. Read `IMPLEMENTATION-STATUS.md` to understand:
   - What has been completed
   - What document you should process next
   - Any notes from previous agents

2. Read the next pending specification document from `specs/` folder

3. Audit the current codebase:
   - List all existing files
   - Compare against spec requirements
   - Create checklist: ✅ Done | ❌ Missing | ⚠️ Partial

4. Implement all ❌ Missing and ⚠️ Partial items from the spec

5. Update `IMPLEMENTATION-STATUS.md`:
   - Mark document as complete
   - Check off implemented items
   - Add handoff notes for next agent

## Rules

- Process ONE document completely before stopping
- Always update the status file before ending
- Test your implementations when possible
- Note any blockers or issues discovered
- Be thorough - don't skip requirements

## Current Project Location
The specs are in: `specs/` folder
The plugin code is in: `flowchat/` folder

## Begin
Start by reading IMPLEMENTATION-STATUS.md and tell me:
1. Which document you're processing
2. What's already implemented
3. What's missing
4. Your implementation plan
```

---

## FINAL VERIFICATION CHECKLIST

After all documents are processed, run this final check:

### Functionality Tests

```
□ Plugin activates without errors
□ Plugin deactivates cleanly
□ Database tables created correctly
□ Admin menu appears
□ Can create new instance
□ Can edit instance
□ Can delete instance
□ Shortcode renders chat
□ Chat connects to n8n
□ Messages stream in real-time
□ Typing indicator shows
□ Bubble mode works
□ Bubble opens/closes
□ Bubble remembers state
□ Auto-open triggers work
□ File upload works
□ Files auto-delete after 24h
□ System prompt tags resolve
□ URL-based routing works
□ Access control works
□ Error messages display
□ Fallback form works
□ Templates can be applied
□ Import/Export works
□ Premium features gated
□ Build produces valid output
□ Plugin zip installs correctly
```

### Code Quality Checks

```
□ No PHP errors or warnings
□ No JavaScript console errors
□ All inputs sanitized
□ All outputs escaped
□ Nonces verified
□ Capabilities checked
□ Responsive on mobile
□ Works in Chrome, Firefox, Safari
□ Translations ready (text domain used)
□ No hardcoded URLs
□ Uninstall removes all data
```

### Performance Checks

```
□ Frontend bundle < 150KB gzipped
□ Admin bundle < 300KB gzipped
□ No unnecessary database queries
□ Assets only loaded when needed
```

---

## TROUBLESHOOTING COMMON ISSUES

### "Previous agent didn't complete their document"
→ Continue where they left off, note the gap

### "Spec is unclear or contradictory"
→ Use FINAL-CONSOLIDATED-SPEC.md as source of truth

### "Dependency not yet implemented"
→ Create a stub/placeholder, note it for later agent

### "Build is failing"
→ Check package.json dependencies, run npm install

### "Can't test without n8n"
→ Create a mock response for testing:
```javascript
// Mock n8n response for testing
fetch('/test-webhook', {
  method: 'POST',
  body: JSON.stringify({ message: 'test' })
}).then(r => r.text()).then(console.log);
```

---

## QUICK REFERENCE: Key Files

| Purpose | File |
|---------|------|
| Main plugin | flowchat.php |
| Autoloader | includes/autoload.php |
| Instance CRUD | includes/core/class-instance-manager.php |
| Public API | includes/api/class-public-endpoints.php |
| Shortcode | includes/frontend/class-shortcode.php |
| n8n Adapter | src/runtime/N8nRuntimeAdapter.ts |
| Chat Widget | src/components/chat/ChatWidget.tsx |
| Bubble | src/components/bubble/BubbleWidget.tsx |
| Admin App | src/components/admin/App.tsx |
| Types | src/types/index.ts |
| Status Tracking | IMPLEMENTATION-STATUS.md |

---

## ESTIMATED AGENT SESSIONS

| Session | Documents | Estimated Time |
|---------|-----------|----------------|
| Agent 1 | Setup + Doc 1-2 | 45-60 min |
| Agent 2 | Doc 3-5 | 45-60 min |
| Agent 3 | Doc 6-7 | 60-90 min |
| Agent 4 | Doc 8-9 | 60-90 min |
| Agent 5 | Doc 10-12 | 45-60 min |
| Agent 6 | Doc 13-15 | 45-60 min |
| Agent 7 | Final Verification | 30-45 min |

Total: ~7 agent sessions

---

Ready to start? Give the first agent the prompt above!
