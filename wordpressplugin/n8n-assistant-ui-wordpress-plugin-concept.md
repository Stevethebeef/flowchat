# WordPress Plugin Concept: Assistant-UI for n8n
## Deep Analysis & Development Blueprint

**Version:** 1.0  
**Date:** December 2025  
**Plugin Name Suggestion:** "FlowChat Pro" or "n8n Assistant Chat"

---

## Executive Summary

This document provides a comprehensive analysis for building a WordPress plugin that integrates the **assistant-ui** React library with **n8n workflows**, creating the most feature-rich AI chat solution for WordPress. The plugin will bridge the gap between n8n's powerful automation capabilities and assistant-ui's modern, customizable chat interface.

---

## Part 1: Technology Deep Dive

### 1.1 Assistant-UI Capabilities

**Core Architecture:**
- Built on React with TypeScript
- Composable primitives inspired by Radix UI/shadcn
- Y Combinator-backed with 400k+ monthly npm downloads
- MIT licensed open-source library

**UI Components Available:**

| Component | Description | Customization Level |
|-----------|-------------|---------------------|
| `Thread` | Full chat interface with messages, composer, auto-scroll | Complete |
| `ThreadList` | Multi-conversation management | Complete |
| `AssistantModal` | Floating chat popup (bottom-right typical) | Complete |
| `AssistantSidebar` | Docked sidebar chat | Complete |
| `Composer` | Message input with attachments | Complete |
| `Message` | Individual message rendering | Complete |
| `Attachment` | File/image handling | Complete |
| `Markdown` | Rich text rendering with GFM | Complete |
| `ToolFallback` | AI tool call visualization | Complete |
| `BranchPicker` | Message version navigation | Complete |

**Key Technical Features:**

```
✅ Streaming responses (real-time token display)
✅ Auto-scrolling with smart viewport management
✅ File attachments (images, documents, any file type)
✅ Message editing with branch history
✅ Message copying and export
✅ Suggestions/quick prompts
✅ Custom tool UI rendering
✅ Speech synthesis (text-to-speech) via WebSpeechSynthesisAdapter
✅ Markdown with syntax highlighting
✅ Mermaid diagram support
✅ LaTeX math rendering
✅ Reasoning/thinking display
✅ Error handling UI
✅ Loading states
✅ Empty state (welcome screen)
✅ Keyboard accessibility (WAI-ARIA compliant)
✅ Dark/light mode theming
✅ RTL language support
✅ CSS variables for complete styling control
```

**Runtime Adapters Available:**
- AI SDK by Vercel
- LangGraph Cloud
- Data Stream Protocol
- Local Runtime
- External Store Runtime
- **Custom Backend** (← This is what we need for n8n)

### 1.2 n8n Chat Capabilities

**Chat Trigger Node Features:**

| Feature | Details |
|---------|---------|
| Public/Private Mode | Development vs production |
| Hosted Chat | Built-in n8n interface |
| Embedded Chat | Custom frontend integration |
| Streaming Responses | Real-time token delivery |
| Session Management | From Memory or custom |
| CORS Configuration | Domain whitelisting |
| Authentication | None, Basic Auth, Bearer Token |
| Welcome Messages | Customizable greeting |
| File Uploads | Via webhook binary property |

**n8n Chat Widget (@n8n/chat) Configuration:**

```javascript
createChat({
  webhookUrl: 'https://...',
  webhookConfig: { method: 'POST', headers: {} },
  target: '#n8n-chat',
  mode: 'window' | 'fullscreen',
  chatInputKey: 'chatInput',
  chatSessionKey: 'sessionId',
  loadPreviousSession: true,
  metadata: {},
  showWelcomeScreen: true,
  initialMessages: ['Hi! 👋'],
  allowFileUploads: true,
  allowedFilesMimeTypes: 'image/*,application/pdf',
  enableStreaming: true,
  i18n: { /* translations */ }
});
```

**n8n Response Format:**
```json
{
  "output": "AI response text",
  "sessionId": "session-id"
}
```

**Actions Supported:**
- `sendMessage` - User sends message
- `loadPreviousSession` - Retrieve history

### 1.3 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     WordPress Frontend                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   Shortcode  │  │  Gutenberg   │  │    Elementor         │  │
│  │   [flowchat] │  │    Block     │  │     Widget           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         └─────────────────┼──────────────────────┘              │
│                           ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              React App (assistant-ui)                     │  │
│  │  ┌────────────────────────────────────────────────────┐  │  │
│  │  │  AssistantRuntimeProvider                          │  │  │
│  │  │    ├── Thread (full page) OR                       │  │  │
│  │  │    ├── AssistantModal (popup) OR                   │  │  │
│  │  │    └── AssistantSidebar (docked)                   │  │  │
│  │  │                                                    │  │  │
│  │  │  Custom n8n Runtime Adapter                        │  │  │
│  │  │    ├── Webhook communication                       │  │  │
│  │  │    ├── Streaming handler                           │  │  │
│  │  │    ├── Session management                          │  │  │
│  │  │    └── Attachment handler                          │  │  │
│  │  └────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                      n8n Instance                               │
├─────────────────────────────────────────────────────────────────┤
│  Chat Trigger / Webhook Trigger                                 │
│         │                                                       │
│         ▼                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  AI Agent Node / Custom Workflow                         │  │
│  │    ├── OpenAI / Claude / Gemini / Local LLM             │  │
│  │    ├── Memory Node (PostgreSQL/Redis/etc)               │  │
│  │    ├── Tools (RAG, APIs, Databases)                     │  │
│  │    └── Respond to Webhook (streaming optional)          │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Part 2: Plugin Architecture

### 2.1 File Structure

```
flowchat-pro/
├── flowchat-pro.php                 # Main plugin file
├── uninstall.php                    # Cleanup on uninstall
├── readme.txt                       # WordPress.org readme
│
├── includes/
│   ├── class-flowchat-loader.php    # Plugin bootstrapper
│   ├── class-flowchat-admin.php     # Admin settings
│   ├── class-flowchat-public.php    # Frontend handler
│   ├── class-flowchat-shortcode.php # Shortcode registration
│   ├── class-flowchat-rest-api.php  # REST API endpoints
│   ├── class-flowchat-settings.php  # Settings framework
│   └── class-flowchat-templates.php # Template management
│
├── admin/
│   ├── js/
│   │   └── flowchat-admin.js        # Admin React app
│   ├── css/
│   │   └── flowchat-admin.css
│   └── partials/
│       └── settings-page.php
│
├── public/
│   ├── js/
│   │   ├── flowchat-public.js       # Public React app (built)
│   │   └── flowchat-public.js.map
│   ├── css/
│   │   └── flowchat-public.css
│   └── partials/
│       └── chat-container.php
│
├── blocks/
│   ├── flowchat-block/
│   │   ├── block.json
│   │   ├── edit.js
│   │   ├── save.js
│   │   ├── index.js
│   │   └── style.css
│   └── build/                       # Compiled block
│
├── elementor/
│   ├── class-flowchat-elementor.php
│   └── widgets/
│       └── class-flowchat-widget.php
│
├── src/                             # React source
│   ├── components/
│   │   ├── FlowChat.tsx
│   │   ├── Thread.tsx
│   │   ├── Modal.tsx
│   │   ├── Sidebar.tsx
│   │   └── ...
│   ├── runtime/
│   │   └── n8n-runtime.ts           # Custom n8n adapter
│   ├── hooks/
│   │   └── useN8nChat.ts
│   ├── utils/
│   │   └── streaming.ts
│   ├── styles/
│   │   └── themes/
│   │       ├── default.css
│   │       ├── minimal.css
│   │       └── glassmorphic.css
│   ├── admin-app.tsx
│   └── public-app.tsx
│
├── templates/
│   ├── chat-templates/
│   │   ├── support-bot.json
│   │   ├── lead-gen.json
│   │   └── faq-assistant.json
│   └── style-presets/
│       ├── modern-dark.json
│       └── corporate-light.json
│
├── languages/
│   └── flowchat-pro.pot
│
└── vendor/                          # Composer dependencies
```

### 2.2 Custom n8n Runtime Adapter

```typescript
// src/runtime/n8n-runtime.ts
import {
  AssistantRuntimeCore,
  ThreadMessage,
  ThreadAssistantMessage,
  Attachment,
} from "@assistant-ui/react";

interface N8nConfig {
  webhookUrl: string;
  sessionId?: string;
  streaming: boolean;
  authType: 'none' | 'basic' | 'bearer';
  authCredentials?: string;
  chatInputKey: string;
  chatSessionKey: string;
  metadata: Record<string, any>;
  allowFileUploads: boolean;
  allowedMimeTypes: string[];
}

export class N8nRuntime implements AssistantRuntimeCore {
  private config: N8nConfig;
  private abortController?: AbortController;
  
  constructor(config: N8nConfig) {
    this.config = config;
  }

  async run(messages: ThreadMessage[]): Promise<void> {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role !== 'user') return;

    this.abortController = new AbortController();

    const payload = {
      action: 'sendMessage',
      [this.config.chatInputKey]: this.extractTextContent(lastMessage),
      [this.config.chatSessionKey]: this.config.sessionId,
      metadata: this.config.metadata,
      attachments: await this.processAttachments(lastMessage.attachments),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.authType === 'bearer' && this.config.authCredentials) {
      headers['Authorization'] = `Bearer ${this.config.authCredentials}`;
    } else if (this.config.authType === 'basic' && this.config.authCredentials) {
      headers['Authorization'] = `Basic ${btoa(this.config.authCredentials)}`;
    }

    if (this.config.streaming) {
      await this.handleStreamingResponse(payload, headers);
    } else {
      await this.handleStandardResponse(payload, headers);
    }
  }

  private async handleStreamingResponse(
    payload: any,
    headers: Record<string, string>
  ) {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: this.abortController?.signal,
    });

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      fullText += chunk;

      // Emit partial update
      this.onPartialResponse(fullText);
    }

    this.onCompleteResponse(fullText);
  }

  private async handleStandardResponse(
    payload: any,
    headers: Record<string, string>
  ) {
    const response = await fetch(this.config.webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: this.abortController?.signal,
    });

    const data = await response.json();
    this.onCompleteResponse(data.output || data.text || '');
  }

  async loadPreviousSession(): Promise<ThreadMessage[]> {
    const response = await fetch(
      `${this.config.webhookUrl}?action=loadPreviousSession&${this.config.chatSessionKey}=${this.config.sessionId}`,
      { method: 'GET' }
    );
    
    const data = await response.json();
    return this.convertToThreadMessages(data.messages || []);
  }

  cancel(): void {
    this.abortController?.abort();
  }

  // ... additional methods for attachment handling, message conversion, etc.
}

export function useN8nRuntime(config: N8nConfig) {
  return useMemo(() => new N8nRuntime(config), [config]);
}
```

### 2.3 WordPress Settings Schema

```php
// Settings structure for wp_options
$flowchat_settings = [
    // Connection Settings
    'n8n_webhook_url' => '',
    'n8n_auth_type' => 'none', // none, basic, bearer
    'n8n_auth_credentials' => '', // encrypted
    'n8n_chat_input_key' => 'chatInput',
    'n8n_chat_session_key' => 'sessionId',
    
    // Display Settings
    'chat_mode' => 'modal', // modal, sidebar, inline, fullpage
    'chat_position' => 'bottom-right',
    'chat_width' => '400px',
    'chat_height' => '600px',
    'chat_max_width' => '100%',
    'mobile_breakpoint' => '768px',
    'mobile_fullscreen' => true,
    
    // Feature Toggles
    'enable_streaming' => true,
    'enable_attachments' => true,
    'enable_speech' => false,
    'enable_markdown' => true,
    'enable_code_highlight' => true,
    'enable_message_editing' => true,
    'enable_message_branching' => true,
    'enable_chat_history' => true,
    'enable_suggestions' => true,
    'enable_typing_indicator' => true,
    
    // Attachment Settings
    'allowed_mime_types' => 'image/*,application/pdf,.doc,.docx,.txt',
    'max_file_size' => 10485760, // 10MB
    'max_attachments' => 5,
    
    // Appearance
    'theme_preset' => 'default',
    'custom_css' => '',
    'primary_color' => '#0066cc',
    'background_color' => '#ffffff',
    'text_color' => '#1a1a1a',
    'user_bubble_color' => '#e3f2fd',
    'assistant_bubble_color' => '#f5f5f5',
    'font_family' => 'inherit',
    'border_radius' => '16px',
    'shadow' => '0 4px 24px rgba(0,0,0,0.15)',
    
    // Branding
    'bot_name' => 'Assistant',
    'bot_avatar' => '',
    'show_powered_by' => true, // free only
    'custom_logo' => '', // premium
    
    // Welcome Screen
    'welcome_enabled' => true,
    'welcome_title' => 'Hello! 👋',
    'welcome_subtitle' => 'How can I help you today?',
    'welcome_suggestions' => [
        ['title' => 'Get Help', 'prompt' => 'I need help with...'],
        ['title' => 'Learn More', 'prompt' => 'Tell me about...'],
    ],
    
    // Localization
    'locale' => 'en',
    'i18n_strings' => [
        'placeholder' => 'Type a message...',
        'send' => 'Send',
        'cancel' => 'Cancel',
        'copy' => 'Copy',
        'regenerate' => 'Regenerate',
        'edit' => 'Edit',
    ],
    
    // Metadata (sent with each message)
    'metadata' => [
        'source' => 'wordpress',
        'plugin_version' => '1.0.0',
    ],
    
    // Session Management
    'session_strategy' => 'localStorage', // localStorage, cookie, server
    'session_duration' => 86400, // 24 hours
    
    // Page Display Rules
    'display_rules' => [
        'show_on' => 'all', // all, specific, exclude
        'specific_pages' => [],
        'exclude_pages' => [],
        'show_for_logged_in' => true,
        'show_for_guests' => true,
        'user_roles' => [], // empty = all roles
    ],
    
    // Advanced
    'lazy_load' => true,
    'preload_chat' => false,
    'custom_headers' => [],
    'cors_proxy' => false,
    'debug_mode' => false,
];
```

---

## Part 3: Feature Matrix

### 3.1 Free vs Premium Features

| Feature Category | Feature | Free | Premium |
|------------------|---------|------|---------|
| **Chat Modes** | Popup Modal | ✅ | ✅ |
| | Sidebar | ❌ | ✅ |
| | Inline Embed | ✅ | ✅ |
| | Full Page | ❌ | ✅ |
| **Integration** | Shortcode | ✅ | ✅ |
| | Gutenberg Block | ✅ | ✅ |
| | Elementor Widget | ❌ | ✅ |
| | Beaver Builder | ❌ | ✅ |
| | Divi Module | ❌ | ✅ |
| **Streaming** | Basic Streaming | ✅ | ✅ |
| | Enhanced Streaming | ❌ | ✅ |
| **Attachments** | Image Upload | ✅ | ✅ |
| | Document Upload | ❌ | ✅ |
| | Any File Type | ❌ | ✅ |
| | Drag & Drop | ❌ | ✅ |
| **Voice/Audio** | Text-to-Speech | ❌ | ✅ |
| | Voice Input | ❌ | ✅ |
| **Chat History** | Browser Storage | ✅ | ✅ |
| | Server-side History | ❌ | ✅ |
| | Export History | ❌ | ✅ |
| | Multi-thread | ❌ | ✅ |
| **Customization** | Theme Presets (3) | ✅ | ✅ |
| | All Theme Presets (10+) | ❌ | ✅ |
| | Custom CSS | ❌ | ✅ |
| | Custom Colors | Limited | Full |
| | Bot Avatar | Default | Custom |
| | White Labeling | ❌ | ✅ |
| **Templates** | Basic Templates (2) | ✅ | ✅ |
| | All Templates (10+) | ❌ | ✅ |
| | Template Editor | ❌ | ✅ |
| | Import/Export | ❌ | ✅ |
| **Features** | Welcome Screen | ✅ | ✅ |
| | Suggestions | 2 max | Unlimited |
| | Message Editing | ❌ | ✅ |
| | Message Branching | ❌ | ✅ |
| | Markdown Rendering | Basic | Full + Syntax |
| | Code Highlighting | ❌ | ✅ |
| | Mermaid Diagrams | ❌ | ✅ |
| | LaTeX Math | ❌ | ✅ |
| | Tool Call UI | ❌ | ✅ |
| **Analytics** | Basic Stats | ❌ | ✅ |
| | Conversation Logs | ❌ | ✅ |
| | User Insights | ❌ | ✅ |
| **Display Rules** | All Pages | ✅ | ✅ |
| | Page Targeting | ❌ | ✅ |
| | User Role Rules | ❌ | ✅ |
| | Device Rules | ❌ | ✅ |
| | Schedule Rules | ❌ | ✅ |
| **Authentication** | None | ✅ | ✅ |
| | Basic Auth | ✅ | ✅ |
| | Bearer Token | ❌ | ✅ |
| | OAuth 2.0 | ❌ | ✅ |
| | WordPress Auth | ❌ | ✅ |
| **Support** | Community Forum | ✅ | ✅ |
| | Email Support | ❌ | ✅ |
| | Priority Support | ❌ | ✅ |
| | Onboarding Call | ❌ | Agency |
| **Sites** | Single Site | ✅ | ✅ |
| | Unlimited Sites | ❌ | Agency |
| **Updates** | Bug Fixes | ✅ | ✅ |
| | Feature Updates | ❌ | ✅ |

### 3.2 Pricing Tiers Suggestion

| Tier | Price | Sites | Features |
|------|-------|-------|----------|
| **Free** | $0 | 1 | Basic features, powered-by badge |
| **Pro** | $79/year | 3 | All premium features |
| **Business** | $199/year | 10 | + Analytics, Priority support |
| **Agency** | $399/year | Unlimited | + White label, Reseller rights |

---

## Part 4: Implementation Details

### 4.1 Gutenberg Block Implementation

```javascript
// blocks/flowchat-block/edit.js
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { PanelBody, SelectControl, TextControl, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { FlowChatPreview } from '../../src/components/Preview';

export default function Edit({ attributes, setAttributes }) {
  const blockProps = useBlockProps();
  
  return (
    <>
      <InspectorControls>
        <PanelBody title={__('Chat Settings', 'flowchat-pro')}>
          <SelectControl
            label={__('Display Mode', 'flowchat-pro')}
            value={attributes.mode}
            options={[
              { label: 'Inline', value: 'inline' },
              { label: 'Modal Popup', value: 'modal' },
              { label: 'Sidebar', value: 'sidebar' },
            ]}
            onChange={(mode) => setAttributes({ mode })}
          />
          <TextControl
            label={__('Height', 'flowchat-pro')}
            value={attributes.height}
            onChange={(height) => setAttributes({ height })}
          />
          <ToggleControl
            label={__('Enable Streaming', 'flowchat-pro')}
            checked={attributes.streaming}
            onChange={(streaming) => setAttributes({ streaming })}
          />
          <ToggleControl
            label={__('Enable Attachments', 'flowchat-pro')}
            checked={attributes.attachments}
            onChange={(attachments) => setAttributes({ attachments })}
          />
        </PanelBody>
        
        <PanelBody title={__('Appearance', 'flowchat-pro')}>
          <SelectControl
            label={__('Theme', 'flowchat-pro')}
            value={attributes.theme}
            options={[
              { label: 'Default', value: 'default' },
              { label: 'Minimal', value: 'minimal' },
              { label: 'Dark', value: 'dark' },
            ]}
            onChange={(theme) => setAttributes({ theme })}
          />
        </PanelBody>
      </InspectorControls>
      
      <div {...blockProps}>
        <FlowChatPreview attributes={attributes} />
      </div>
    </>
  );
}
```

### 4.2 Elementor Widget Implementation

```php
<?php
// elementor/widgets/class-flowchat-widget.php

class FlowChat_Elementor_Widget extends \Elementor\Widget_Base {

    public function get_name() {
        return 'flowchat';
    }

    public function get_title() {
        return __('FlowChat AI', 'flowchat-pro');
    }

    public function get_icon() {
        return 'eicon-comments';
    }

    public function get_categories() {
        return ['general'];
    }

    protected function register_controls() {
        // Content Section
        $this->start_controls_section(
            'content_section',
            [
                'label' => __('Chat Settings', 'flowchat-pro'),
                'tab' => \Elementor\Controls_Manager::TAB_CONTENT,
            ]
        );

        $this->add_control(
            'chat_mode',
            [
                'label' => __('Display Mode', 'flowchat-pro'),
                'type' => \Elementor\Controls_Manager::SELECT,
                'default' => 'inline',
                'options' => [
                    'inline' => __('Inline', 'flowchat-pro'),
                    'modal' => __('Modal Popup', 'flowchat-pro'),
                    'sidebar' => __('Sidebar', 'flowchat-pro'),
                ],
            ]
        );

        $this->add_responsive_control(
            'chat_height',
            [
                'label' => __('Height', 'flowchat-pro'),
                'type' => \Elementor\Controls_Manager::SLIDER,
                'size_units' => ['px', 'vh'],
                'range' => [
                    'px' => ['min' => 300, 'max' => 1000],
                    'vh' => ['min' => 30, 'max' => 100],
                ],
                'default' => ['unit' => 'px', 'size' => 500],
                'selectors' => [
                    '{{WRAPPER}} .flowchat-container' => 'height: {{SIZE}}{{UNIT}};',
                ],
            ]
        );

        $this->add_control(
            'enable_streaming',
            [
                'label' => __('Enable Streaming', 'flowchat-pro'),
                'type' => \Elementor\Controls_Manager::SWITCHER,
                'default' => 'yes',
            ]
        );

        $this->end_controls_section();

        // Style Section
        $this->start_controls_section(
            'style_section',
            [
                'label' => __('Style', 'flowchat-pro'),
                'tab' => \Elementor\Controls_Manager::TAB_STYLE,
            ]
        );

        $this->add_control(
            'primary_color',
            [
                'label' => __('Primary Color', 'flowchat-pro'),
                'type' => \Elementor\Controls_Manager::COLOR,
                'default' => '#0066cc',
                'selectors' => [
                    '{{WRAPPER}} .flowchat-container' => '--flowchat-primary: {{VALUE}};',
                ],
            ]
        );

        $this->add_control(
            'border_radius',
            [
                'label' => __('Border Radius', 'flowchat-pro'),
                'type' => \Elementor\Controls_Manager::DIMENSIONS,
                'size_units' => ['px', '%'],
                'selectors' => [
                    '{{WRAPPER}} .flowchat-container' => 'border-radius: {{TOP}}{{UNIT}} {{RIGHT}}{{UNIT}} {{BOTTOM}}{{UNIT}} {{LEFT}}{{UNIT}};',
                ],
            ]
        );

        $this->end_controls_section();
    }

    protected function render() {
        $settings = $this->get_settings_for_display();
        
        echo '<div class="flowchat-container" data-mode="' . esc_attr($settings['chat_mode']) . '" data-streaming="' . esc_attr($settings['enable_streaming']) . '"></div>';
    }
}
```

### 4.3 Shortcode Implementation

```php
<?php
// includes/class-flowchat-shortcode.php

class FlowChat_Shortcode {

    public function __construct() {
        add_shortcode('flowchat', [$this, 'render_shortcode']);
    }

    public function render_shortcode($atts) {
        $atts = shortcode_atts([
            'mode' => 'inline',          // inline, modal, sidebar, fullpage
            'height' => '500px',
            'width' => '100%',
            'theme' => 'default',
            'streaming' => 'true',
            'attachments' => 'true',
            'welcome' => 'true',
            'suggestions' => '',          // comma-separated
            'webhook' => '',              // override global
            'session' => '',              // custom session ID
            'class' => '',
            'id' => '',
        ], $atts, 'flowchat');

        // Generate unique ID if not provided
        $container_id = $atts['id'] ?: 'flowchat-' . uniqid();

        // Build configuration
        $config = [
            'mode' => sanitize_text_field($atts['mode']),
            'height' => sanitize_text_field($atts['height']),
            'width' => sanitize_text_field($atts['width']),
            'theme' => sanitize_text_field($atts['theme']),
            'streaming' => filter_var($atts['streaming'], FILTER_VALIDATE_BOOLEAN),
            'attachments' => filter_var($atts['attachments'], FILTER_VALIDATE_BOOLEAN),
            'welcomeEnabled' => filter_var($atts['welcome'], FILTER_VALIDATE_BOOLEAN),
            'suggestions' => array_filter(array_map('trim', explode(',', $atts['suggestions']))),
        ];

        // Override webhook if specified
        if (!empty($atts['webhook'])) {
            $config['webhookUrl'] = esc_url($atts['webhook']);
        }

        // Custom session
        if (!empty($atts['session'])) {
            $config['sessionId'] = sanitize_text_field($atts['session']);
        }

        // Enqueue scripts
        wp_enqueue_script('flowchat-public');
        wp_enqueue_style('flowchat-public');

        // Localize configuration for this instance
        wp_add_inline_script(
            'flowchat-public',
            sprintf(
                'window.flowchatInstances = window.flowchatInstances || {}; window.flowchatInstances["%s"] = %s;',
                esc_js($container_id),
                wp_json_encode($config)
            ),
            'before'
        );

        // Build container HTML
        $classes = ['flowchat-container', 'flowchat-mode-' . $atts['mode']];
        if (!empty($atts['class'])) {
            $classes[] = sanitize_html_class($atts['class']);
        }

        $styles = [];
        if ($atts['mode'] === 'inline') {
            $styles[] = 'height: ' . esc_attr($atts['height']);
            $styles[] = 'width: ' . esc_attr($atts['width']);
        }

        return sprintf(
            '<div id="%s" class="%s" style="%s" data-flowchat></div>',
            esc_attr($container_id),
            esc_attr(implode(' ', $classes)),
            esc_attr(implode('; ', $styles))
        );
    }
}
```

---

## Part 5: Advanced Features

### 5.1 Streaming Implementation

```typescript
// src/utils/streaming.ts

export async function* streamN8nResponse(
  url: string,
  payload: any,
  headers: Record<string, string>,
  signal?: AbortSignal
): AsyncGenerator<string, void, unknown> {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      ...headers,
      'Accept': 'text/event-stream',
    },
    body: JSON.stringify(payload),
    signal,
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      
      // Process SSE format or raw text
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') return;
          
          try {
            const parsed = JSON.parse(data);
            yield parsed.content || parsed.text || '';
          } catch {
            yield data; // Raw text
          }
        } else if (line.trim()) {
          yield line; // Raw line
        }
      }
    }
    
    // Process any remaining buffer
    if (buffer.trim()) {
      yield buffer;
    }
  } finally {
    reader.releaseLock();
  }
}
```

### 5.2 Speech Integration

```typescript
// src/components/SpeechControls.tsx
import {
  ActionBarPrimitive,
  useAssistantState,
} from "@assistant-ui/react";
import { WebSpeechSynthesisAdapter } from "@assistant-ui/react";

interface SpeechConfig {
  enabled: boolean;
  voice?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  language?: string;
}

export function useSpeechAdapter(config: SpeechConfig) {
  if (!config.enabled || typeof window === 'undefined') {
    return undefined;
  }

  const adapter = new WebSpeechSynthesisAdapter();
  
  // Configure voice settings
  if (config.voice) {
    const voices = window.speechSynthesis.getVoices();
    const selectedVoice = voices.find(v => v.name === config.voice);
    if (selectedVoice) {
      adapter.setVoice(selectedVoice);
    }
  }

  return adapter;
}

export function SpeechControls() {
  const isRunning = useAssistantState(({ thread }) => thread.isRunning);
  
  return (
    <div className="speech-controls">
      <ActionBarPrimitive.Speak asChild>
        <button
          className="speech-button"
          disabled={isRunning}
          aria-label="Read aloud"
        >
          🔊 Read
        </button>
      </ActionBarPrimitive.Speak>
      
      <ActionBarPrimitive.StopSpeaking asChild>
        <button
          className="speech-button-stop"
          aria-label="Stop reading"
        >
          ⏹️ Stop
        </button>
      </ActionBarPrimitive.StopSpeaking>
    </div>
  );
}
```

### 5.3 Chat History & Session Management

```typescript
// src/hooks/useChatHistory.ts
import { useState, useEffect, useCallback } from 'react';
import { ThreadMessage } from '@assistant-ui/react';

interface ChatHistoryConfig {
  storageType: 'localStorage' | 'sessionStorage' | 'server';
  sessionKey: string;
  maxMessages?: number;
  serverEndpoint?: string;
}

export function useChatHistory(config: ChatHistoryConfig) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Initialize session
  useEffect(() => {
    const existingSession = getStoredSession();
    if (existingSession) {
      setSessionId(existingSession.id);
      loadMessages(existingSession.id);
    } else {
      const newSessionId = generateSessionId();
      setSessionId(newSessionId);
      storeSession({ id: newSessionId, createdAt: Date.now() });
    }
  }, []);

  const saveMessage = useCallback(async (message: ThreadMessage) => {
    const updatedMessages = [...messages, message].slice(
      -(config.maxMessages || 100)
    );
    
    setMessages(updatedMessages);

    if (config.storageType === 'server' && config.serverEndpoint) {
      await fetch(config.serverEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          message,
        }),
      });
    } else {
      const storage = config.storageType === 'localStorage' 
        ? localStorage 
        : sessionStorage;
      storage.setItem(
        `${config.sessionKey}_messages`,
        JSON.stringify(updatedMessages)
      );
    }
  }, [messages, sessionId, config]);

  const clearHistory = useCallback(() => {
    setMessages([]);
    const storage = config.storageType === 'localStorage' 
      ? localStorage 
      : sessionStorage;
    storage.removeItem(`${config.sessionKey}_messages`);
  }, [config]);

  const exportHistory = useCallback(() => {
    const data = {
      sessionId,
      messages,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-history-${sessionId}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [sessionId, messages]);

  return {
    messages,
    sessionId,
    saveMessage,
    clearHistory,
    exportHistory,
  };
}

function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
```

### 5.4 Template System

```json
// templates/chat-templates/support-bot.json
{
  "id": "support-bot",
  "name": "Customer Support Bot",
  "description": "Optimized for customer service interactions",
  "version": "1.0.0",
  "settings": {
    "mode": "modal",
    "position": "bottom-right",
    "streaming": true,
    "attachments": true,
    "maxAttachmentSize": 5242880,
    "allowedMimeTypes": ["image/*", "application/pdf"]
  },
  "appearance": {
    "theme": "minimal",
    "primaryColor": "#0066cc",
    "borderRadius": "20px",
    "fontFamily": "system-ui"
  },
  "welcome": {
    "enabled": true,
    "title": "Need Help? 💬",
    "subtitle": "Our AI assistant is here to help you 24/7",
    "avatar": "/assets/support-avatar.svg"
  },
  "suggestions": [
    {
      "title": "Track My Order",
      "prompt": "I want to track my order status",
      "icon": "📦"
    },
    {
      "title": "Return Policy",
      "prompt": "What is your return policy?",
      "icon": "↩️"
    },
    {
      "title": "Contact Human",
      "prompt": "I'd like to speak with a human agent",
      "icon": "👤"
    }
  ],
  "i18n": {
    "placeholder": "Describe your issue...",
    "send": "Send",
    "attachFile": "Attach screenshot"
  },
  "metadata": {
    "department": "support",
    "priority": "normal"
  }
}
```

---

## Part 6: Development Roadmap

### Phase 1: MVP (Weeks 1-4)
- [ ] Basic plugin structure with WordPress hooks
- [ ] n8n runtime adapter implementation
- [ ] Basic Thread component integration
- [ ] Shortcode support with essential options
- [ ] Settings page with n8n webhook configuration
- [ ] Basic styling with CSS variables
- [ ] Free tier features complete

### Phase 2: Enhanced Features (Weeks 5-8)
- [ ] Gutenberg block with visual preview
- [ ] Streaming implementation
- [ ] Attachment support (images)
- [ ] Welcome screen and suggestions
- [ ] Theme presets (3 themes)
- [ ] Session management (localStorage)
- [ ] Mobile responsive design

### Phase 3: Premium Features (Weeks 9-12)
- [ ] Elementor widget
- [ ] All attachment types
- [ ] Speech synthesis
- [ ] Message editing and branching
- [ ] Server-side chat history
- [ ] Advanced authentication options
- [ ] Custom CSS editor
- [ ] Template system

### Phase 4: Advanced (Weeks 13-16)
- [ ] Voice input
- [ ] Analytics dashboard
- [ ] Multi-thread support (ThreadList)
- [ ] White labeling
- [ ] Display rules engine
- [ ] Export/Import settings
- [ ] Additional page builder integrations

### Phase 5: Polish & Launch (Weeks 17-20)
- [ ] Performance optimization
- [ ] Accessibility audit (WCAG 2.1 AA)
- [ ] Security audit
- [ ] Documentation
- [ ] WordPress.org submission
- [ ] Marketing website
- [ ] Demo site

---

## Part 7: Competitive Analysis

### Current WordPress AI Chat Landscape

| Plugin | AI Backend | Streaming | Files | History | Price |
|--------|------------|-----------|-------|---------|-------|
| WPBot | GPT/DialogFlow | ❌ | ❌ | Basic | $99/yr |
| Tidio | Custom | ✅ | ✅ | ✅ | $29/mo |
| ChatBot.com | Custom | ✅ | ❌ | ✅ | $64/mo |
| Chatbase | GPT | ✅ | ✅ | ✅ | $40/mo |
| **FlowChat Pro** | n8n (any LLM) | ✅ | ✅ | ✅ | $79/yr |

### Unique Selling Points

1. **n8n Integration**: Only plugin purpose-built for n8n workflows
2. **assistant-ui Quality**: Enterprise-grade React chat UI
3. **Any LLM Backend**: n8n supports all major AI providers
4. **Workflow Automation**: Chat connected to 400+ n8n integrations
5. **Self-Hosted Option**: Full control over data and infrastructure
6. **One-Time Pricing**: More affordable than SaaS alternatives
7. **Modern Tech Stack**: React 18, TypeScript, Tailwind
8. **Open Architecture**: Extensible and customizable

---

## Part 8: Technical Considerations

### 8.1 WordPress Compatibility
- **Minimum PHP**: 7.4+
- **Minimum WordPress**: 5.8+
- **React Version**: 18.x (matches WordPress core)
- **Browser Support**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+

### 8.2 Performance Guidelines
- Lazy load React bundle (< 150KB gzipped)
- Code split admin vs public bundles
- Use WordPress transients for caching
- Debounce settings updates
- Optimize re-renders with memo/useMemo

### 8.3 Security Requirements
- Sanitize all inputs (sanitize_text_field, wp_kses, etc.)
- Validate nonces for AJAX requests
- Escape all outputs (esc_html, esc_attr, esc_url)
- Capability checks for admin functions
- Encrypt stored credentials (libsodium)
- CORS validation for n8n webhooks
- CSP-compatible (no inline scripts in production)

### 8.4 Accessibility (WCAG 2.1 AA)
- Keyboard navigation for all controls
- Screen reader announcements for new messages
- Focus management in modal/sidebar
- Color contrast ratios (4.5:1 minimum)
- Visible focus indicators
- ARIA labels and roles
- Skip links for chat widget

---

## Conclusion

Building a WordPress plugin that combines assistant-ui with n8n creates a powerful, unique product in the market. The technical foundation is solid - both libraries are well-maintained, modern, and designed for extensibility. The main development challenges will be:

1. **Custom Runtime Adapter**: Bridging assistant-ui's expectations with n8n's webhook format
2. **WordPress React Integration**: Managing React in WordPress's ecosystem
3. **Streaming Consistency**: Ensuring reliable streaming across different n8n configurations
4. **Settings Complexity**: Balancing power-user features with simplicity

The market opportunity is significant, as there's no current plugin that specifically targets n8n users or offers assistant-ui's quality of chat interface in WordPress.

**Recommended Next Steps:**
1. Create a proof-of-concept with basic Thread + n8n webhook
2. Validate streaming implementation
3. Build minimal settings page
4. User testing with n8n community
5. Iterate based on feedback before full development
