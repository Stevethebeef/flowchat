# FlowChat - Project Overview

> WordPress Plugin for AI Chat powered by n8n and assistant-ui

## Vision Statement

FlowChat is a premium WordPress plugin that brings enterprise-grade AI chat capabilities to any WordPress site. By combining the powerful **assistant-ui** React library with **n8n** automation workflows, FlowChat enables non-technical users to deploy sophisticated AI chatbots without writing code.

## Core Philosophy

1. **Non-Technical First**: Every feature must be configurable via a clean admin UI
2. **Flexible Architecture**: Support multiple chat instances with independent configurations
3. **Premium Foundation**: Build for scalability and monetization from day one
4. **Modern Stack**: Use current best practices (React 18, TypeScript, wp-scripts)
5. **n8n Native**: Deep integration with n8n's Chat Trigger and streaming capabilities

## Key Features

### Chat Capabilities
- Real-time streaming responses via SSE
- Multi-turn conversation memory
- File attachments and image uploads
- Voice input (speech-to-text)
- Markdown rendering with syntax highlighting
- Chat history persistence
- Typing indicators and status feedback

### Deployment Options
- **Inline Chat**: Embedded anywhere via shortcode or Gutenberg block
- **Floating Bubble**: Persistent chat bubble with smart behaviors
- **Fullscreen Mode**: Dedicated chat page experience
- **Elementor Widget**: Native Elementor integration

### Multi-Instance Architecture
- Unlimited chat instances per site
- Each instance: independent n8n endpoint, styling, behavior
- Same page support: multiple inline chats + bubble simultaneously
- Instance switching UI for users

### Admin Experience
- Visual configuration (no code required)
- Simple/Advanced mode toggle
- Live preview of changes
- Pre-built templates and themes
- Import/Export configurations

## Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Frontend | React 18 + TypeScript | Chat UI components |
| UI Library | assistant-ui | Chat primitives and runtime |
| Build | @wordpress/scripts | WordPress-native bundling |
| Backend | PHP 8.0+ | Plugin logic, REST API |
| Database | WordPress Options API | Configuration storage |
| Automation | n8n Chat Trigger | AI workflow execution |
| Streaming | Server-Sent Events | Real-time responses |

## Business Model

### Free Tier
- Single chat instance
- Basic styling options
- Inline chat only
- Community support
- FlowChat branding

### Premium Tier
- Unlimited instances
- Floating bubble + fullscreen
- Advanced styling & templates
- Chat history & analytics
- Priority support
- White-label option
- Elementor widget

### Distribution
- Own platform (primary)
- CodeCanyon marketplace
- GPL-compatible licensing

## Target Audience

1. **Primary**: Non-technical WordPress site owners
2. **Secondary**: Agencies building client sites
3. **Tertiary**: Developers seeking extensible chat solution

## Success Metrics

- 5-minute setup for basic configuration
- Zero code required for standard use cases
- Sub-100ms UI response time
- Support for 10+ concurrent chat sessions
- 99.9% uptime for chat functionality

## Document Index

| Document | Description |
|----------|-------------|
| [01-architecture.md](01-architecture.md) | System architecture and data flow |
| [02-database-schema.md](02-database-schema.md) | Database structure and options |
| [03-admin-ui-spec.md](03-admin-ui-spec.md) | Admin interface design |
| [04-chat-instances-config.md](04-chat-instances-config.md) | Multi-instance configuration |
| [05-frontend-components.md](05-frontend-components.md) | React components |
| [06-n8n-runtime-adapter.md](06-n8n-runtime-adapter.md) | n8n integration |
| [07-api-endpoints.md](07-api-endpoints.md) | REST API specification |
| [08-shortcodes-blocks.md](08-shortcodes-blocks.md) | Shortcodes and Gutenberg |
| [09-bubble-system.md](09-bubble-system.md) | Floating bubble system |
| [10-authentication-security.md](10-authentication-security.md) | Security and auth |
| [11-error-handling.md](11-error-handling.md) | Error management |
| [12-feature-gating.md](12-feature-gating.md) | Free/Premium features |
| [13-templates-system.md](13-templates-system.md) | Templates and themes |
| [14-file-structure.md](14-file-structure.md) | Directory structure |
| [15-build-deployment.md](15-build-deployment.md) | Build and deployment |

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1.0 | TBD | Initial specification |
