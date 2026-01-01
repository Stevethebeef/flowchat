# FlowChat Settings Implementation Specification

## Overview

This document outlines all backend settings that need to be implemented in the frontend chat widget. Each setting is documented with user stories, acceptance criteria, and technical implementation notes.

---

## Display Tab Settings

### US-D01: Top Position Support

**As a** site administrator
**I want to** position the chat bubble at the top of the screen
**So that** I can place it where it works best for my site layout

**Acceptance Criteria:**
- [ ] `top-right` position places bubble at top-right corner
- [ ] `top-left` position places bubble at top-left corner
- [ ] Modal opens downward when bubble is at top
- [ ] Offset X/Y works correctly for top positions

**Technical Notes:**
- Modify `BubbleWidget.tsx` position calculation
- Change modal positioning logic based on bubble position
- Current: only `bottom` is supported

---

### US-D02: Bubble Icon Selection

**As a** site administrator
**I want to** choose from different bubble icons
**So that** the chat bubble matches my brand or use case

**Acceptance Criteria:**
- [ ] Support icon types: `chat`, `message`, `help`, `headphones`, `sparkles`, `camera`
- [ ] Each icon renders correctly in the bubble
- [ ] Icon changes reflect in real-time on preview

**Technical Notes:**
- Add icon components for each type
- Map `bubble.icon` config to appropriate icon
- Current: hardcoded `ChatIcon`

---

### US-D03: Custom Icon URL

**As a** site administrator
**I want to** use my own custom icon image
**So that** I can use my brand mascot or logo

**Acceptance Criteria:**
- [ ] When `customIconUrl` is set, display image instead of SVG icon
- [ ] Image scales correctly within bubble
- [ ] Fallback to default icon if image fails to load

**Technical Notes:**
- Check `bubble.customIconUrl` before rendering default icon
- Add `<img>` element with error handling
- Apply same sizing as SVG icons

---

### US-D04: Bubble Text Label

**As a** site administrator
**I want to** add text next to the chat bubble
**So that** users know what the bubble does

**Acceptance Criteria:**
- [ ] Text appears next to bubble icon when configured
- [ ] Text styling matches bubble color scheme
- [ ] Text hides when chat is open
- [ ] Responsive behavior on mobile

**Technical Notes:**
- Render `bubble.text` if provided
- Position text relative to bubble position (left of bubble for right positions)
- Add animation for text appearance

---

### US-D05: Unread Message Badge

**As a** site administrator
**I want to** show an unread message indicator
**So that** users know there are new messages

**Acceptance Criteria:**
- [ ] Badge shows count of unread messages
- [ ] Badge is hidden when count is 0
- [ ] Badge updates in real-time
- [ ] Badge styling is configurable via primary color

**Technical Notes:**
- Track unread message count in state
- Render badge when `bubble.showUnreadBadge` is true and count > 0
- Position badge at top-right of bubble

---

### US-D06: Configurable Window Size

**As a** site administrator
**I want to** set the chat window dimensions
**So that** it fits my design requirements

**Acceptance Criteria:**
- [ ] Window width respects `window.width` config (default 400px)
- [ ] Window height respects `window.height` config (default 600px)
- [ ] Minimum sizes enforced (300x400)
- [ ] Maximum height constrained by viewport

**Technical Notes:**
- Replace hardcoded `400px`/`550px` with config values
- Add `config.window?.width` and `config.window?.height`
- Current: hardcoded in `modalPosition` style

---

### US-D07: Auto-Open Behavior

**As a** site administrator
**I want to** automatically open the chat
**So that** I can proactively engage visitors

**Acceptance Criteria:**
- [ ] Chat opens after configured delay (seconds)
- [ ] Chat opens on scroll percentage trigger
- [ ] Chat opens on exit intent (mouse leaves viewport)
- [ ] Chat opens on idle time trigger
- [ ] Respects `oncePerSession` condition
- [ ] Respects `oncePerDay` condition
- [ ] Respects `skipIfInteracted` condition
- [ ] Respects `excludeMobile` condition

**Technical Notes:**
- Use existing `useAutoOpen` hook
- Implement all trigger types: `delay`, `scroll`, `exit-intent`, `idle`
- Store session/day flags in localStorage

---

## Messages Tab Settings

### US-M01: Quick Suggestions / Suggested Prompts

**As a** user
**I want to** see clickable suggestion buttons
**So that** I can quickly start a conversation

**Acceptance Criteria:**
- [ ] Up to 4 suggestions displayed in welcome screen
- [ ] Clicking suggestion sends it as a message
- [ ] Suggestions hide after first message is sent
- [ ] Suggestions are styled consistently with theme

**Technical Notes:**
- Render `config.suggestedPrompts` array in Thread component
- Use assistant-ui's suggestion pattern if available
- Add click handler to send message

---

### US-M02: Message Timestamps

**As a** user
**I want to** see when messages were sent
**So that** I can track the conversation timeline

**Acceptance Criteria:**
- [ ] Timestamps shown when `showTimestamp` is true
- [ ] Format: relative time (e.g., "2 min ago") or absolute
- [ ] Timestamps appear below each message
- [ ] Timestamps are subtle and non-intrusive

**Technical Notes:**
- Pass `showTimestamp` to Thread component
- Format timestamp from message `createdAt`
- Use date-fns or similar for formatting

---

### US-M03: Bot Avatar Toggle

**As a** site administrator
**I want to** show/hide the bot avatar
**So that** I can customize the chat appearance

**Acceptance Criteria:**
- [ ] Avatar hidden when `showAvatar` is false
- [ ] Avatar shown when `showAvatar` is true
- [ ] Custom avatar URL used when `avatarUrl` is provided
- [ ] Default bot icon used when no custom URL

**Technical Notes:**
- Pass `showAvatar` and `avatarUrl` to Thread/AssistantMessage
- Conditionally render Avatar component
- Current: always shows avatar

---

### US-M04: Typing Indicator Toggle

**As a** site administrator
**I want to** control the typing indicator visibility
**So that** I can match my brand experience

**Acceptance Criteria:**
- [ ] Typing indicator hidden when `showTypingIndicator` is false
- [ ] Typing indicator shown when `showTypingIndicator` is true
- [ ] Works correctly with streaming responses

**Technical Notes:**
- Pass `features.showTypingIndicator` to Thread
- Conditionally render TypingIndicator in ThreadPrimitive.If

---

### US-M05: File Upload Support

**As a** user
**I want to** upload files and images
**So that** I can share relevant content with the bot

**Acceptance Criteria:**
- [ ] File upload button shown when `features.fileUpload` is true
- [ ] Only allowed file types can be selected
- [ ] File size validation with clear error messages
- [ ] Upload progress indicator
- [ ] Files sent to n8n webhook with message

**Technical Notes:**
- Use existing `FileUploadService`
- Add file input to Composer
- Validate against `features.fileTypes` and `features.maxFileSize`
- Integrate with assistant-ui's file attachment pattern

---

### US-M06: Offline Fallback Form

**As a** user
**I want to** leave a message when chat is unavailable
**So that** I can still get support

**Acceptance Criteria:**
- [ ] Fallback form shown when webhook connection fails
- [ ] Form collects name, email, message
- [ ] Form submission sends to configured email
- [ ] Custom fallback message displayed
- [ ] Form hidden when chat becomes available

**Technical Notes:**
- Monitor connection status in runtime adapter
- Show fallback UI when `fallback.enabled` and connection fails
- Submit form via WordPress REST API

---

## Appearance Tab Settings

### US-A01: Style Presets

**As a** site administrator
**I want to** apply pre-designed style themes
**So that** I can quickly match popular design aesthetics

**Acceptance Criteria:**
- [ ] All 20 style presets apply correctly
- [ ] Preset changes: primary color, background, text color, bubble colors
- [ ] Dark mode presets invert color scheme
- [ ] Gradient presets apply gradient backgrounds

**Style Presets to Support:**
1. Default (blue)
2. ChatGPT Style (green)
3. Claude Style (coral/orange)
4. Assistant UI (neutral)
5. Minimal (gray borders)
6. Dark Mode
7. Midnight Purple
8. Notion Style
9. Linear Style
10. Vercel Style
11. Glassmorphism
12. Purple Gradient
13. Ocean Gradient
14. Corporate
15. Healthcare
16. Playful
17. Nature
18. Sunset
19. Slate
20. Rounded

**Technical Notes:**
- Define preset color schemes in config
- Apply CSS variables based on preset
- Current: only `primaryColor` is used

---

### US-A02: Font Family Configuration

**As a** site administrator
**I want to** choose the chat font
**So that** it matches my website typography

**Acceptance Criteria:**
- [ ] Support fonts: System Default, Inter, Roboto, Open Sans, Lato, Poppins
- [ ] Font applies to all text in chat widget
- [ ] Google Fonts loaded dynamically when needed

**Technical Notes:**
- Add font-family to CSS based on `appearance.font`
- Dynamically import Google Fonts
- Current: hardcoded Inter

---

### US-A03: Font Size Configuration

**As a** site administrator
**I want to** adjust the chat font size
**So that** it's readable for my audience

**Acceptance Criteria:**
- [ ] Small (14px), Medium (16px), Large (18px) options
- [ ] Font size affects all text proportionally
- [ ] Line heights adjust appropriately

**Technical Notes:**
- Apply `appearance.fontSize` to root element
- Use CSS variables for consistent scaling

---

### US-A04: Border Radius Configuration

**As a** site administrator
**I want to** control corner roundness
**So that** I can match my brand style

**Acceptance Criteria:**
- [ ] Border radius applies to: modal, bubbles, buttons, input
- [ ] Range: 0px to 24px
- [ ] Affects all rounded elements consistently

**Technical Notes:**
- Apply `appearance.borderRadius` as CSS variable
- Use variable in all border-radius declarations

---

### US-A05: Custom Bot Avatar

**As a** site administrator
**I want to** use a custom avatar image
**So that** my bot has a branded appearance

**Acceptance Criteria:**
- [ ] Custom image URL replaces default bot icon
- [ ] Image is circular and properly sized
- [ ] Fallback to default if image fails

**Technical Notes:**
- Use `avatarUrl` config in Avatar component
- Add onError handler for fallback

---

### US-A06: Custom CSS Support

**As a** site administrator
**I want to** add custom CSS
**So that** I can make advanced style customizations

**Acceptance Criteria:**
- [ ] Custom CSS is injected into widget
- [ ] CSS scoped to widget container
- [ ] Changes apply without page reload

**Technical Notes:**
- Inject `appearance.customCss` as `<style>` element
- Scope with `.flowchat-widget` prefix

---

## Rules Tab Settings

### US-R01: Device Targeting

**As a** site administrator
**I want to** show/hide chat on specific devices
**So that** I can optimize the mobile experience

**Acceptance Criteria:**
- [ ] Desktop checkbox controls visibility on desktop
- [ ] Tablet checkbox controls visibility on tablet
- [ ] Mobile checkbox controls visibility on mobile
- [ ] Detection uses viewport width breakpoints

**Technical Notes:**
- Check device type on widget initialization
- Hide widget if device is not in allowed list
- Breakpoints: mobile < 768px, tablet 768-1024px, desktop > 1024px

---

### US-R02: Login Requirement

**As a** site administrator
**I want to** require users to be logged in
**So that** I can restrict chat to members

**Acceptance Criteria:**
- [ ] Chat hidden for guests when `requireLogin` is true
- [ ] Login status checked from context
- [ ] Optional: show login prompt instead of hiding

**Technical Notes:**
- Check `context.user.isLoggedIn`
- Conditionally render widget based on rule

---

## Implementation Priority

### Phase 1: Core UX (High Impact)
1. US-D06: Window Size
2. US-M01: Quick Suggestions
3. US-A01: Style Presets (basic)
4. US-D02: Bubble Icon Selection

### Phase 2: Customization
5. US-A02: Font Family
6. US-A03: Font Size
7. US-A04: Border Radius
8. US-M02: Timestamps
9. US-M03: Avatar Toggle

### Phase 3: Advanced Features
10. US-D01: Top Positions
11. US-D03: Custom Icon URL
12. US-D04: Bubble Text
13. US-D05: Unread Badge
14. US-D07: Auto-Open

### Phase 4: Pro Features
15. US-M05: File Upload
16. US-M06: Fallback Form
17. US-R01: Device Targeting
18. US-R02: Login Requirement
19. US-A05: Custom Avatar
20. US-A06: Custom CSS

---

## Technical Architecture

### Config Flow
```
WordPress Admin → PHP API → JSON Config → React Widget
```

### Key Files to Modify
- `src/components/ui/BubbleWidget.tsx` - Main widget
- `src/components/ui/Thread.tsx` - Chat thread
- `src/types/index.ts` - Type definitions
- `src/styles/tailwind.css` - Styling
- `src/hooks/useAutoOpen.ts` - Auto-open logic

### CSS Variable Strategy
```css
.flowchat-widget {
  --fc-primary: var(--primary-color);
  --fc-font-family: var(--font-family);
  --fc-font-size: var(--font-size);
  --fc-border-radius: var(--border-radius);
  --fc-window-width: var(--window-width);
  --fc-window-height: var(--window-height);
}
```

---

## Testing Checklist

- [ ] All settings persist after page reload
- [ ] Preview updates in real-time
- [ ] Mobile responsive behavior
- [ ] Dark mode compatibility
- [ ] RTL language support
- [ ] Accessibility (keyboard nav, screen readers)
- [ ] Performance (no layout shifts)
