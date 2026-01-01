# n8n Chat Widget - AI Chat for Shopify

**Version:** 6.0.0 "App Store Edition"
**Created:** December 2025
**Updated:** December 31, 2025
**Status:** Production-Ready Specification | Shopify App Store Optimized
**Built with:** shadcn/ui + Assistant UI (Y Combinator W25) + n8n Workflows
**Compliance:** GDPR | WCAG 2.2 AA | Built for Shopify Eligible
**Domain:** n8.chat

---

<div align="center">

## *"The only AI chat widget powered by n8n workflow automation"*

**Zero Hosting Fees** | **Unlimited Workflows** | **Award-Winning Design**

</div>

---

## Executive Summary

**n8n Chat** is a **premium AI chat widget** that transforms Shopify stores into intelligent, conversational shopping experiences. Built on **shadcn/ui + Assistant UI** (the Y Combinator-backed chat framework) and powered by **n8n workflows**, it delivers:

- **Sub-300ms Time-to-First-Token** streaming responses
- **shadcn/ui + Tailwind CSS** with glassmorphism design
- **Multi-instance support** for context-aware AI assistants
- **Rich Shopify context** including customer, cart, product, and order data
- **Voice input** with real-time waveform visualization
- **File upload** with AI vision capabilities
- **50+ languages** with RTL and auto-detection
- **Exit-intent, scroll, and idle triggers** for proactive engagement
- **Per-trigger proactive messages** with discount code injection
- **Bot-initiated first messages** for contextual greetings
- **JavaScript API & Events** for developer integrations
- **Analytics integration** (GA4, Meta Pixel, Shopify Analytics)
- **WCAG 2.2 AA accessibility** compliance

**Zero backend required.** Direct n8n webhook integration means **$0 hosting costs**.

---

## Table of Contents

1. [Architecture](#1-architecture)
2. [Award-Winning Design System](#2-award-winning-design-system)
3. [Multi-Instance & AI Personas](#3-multi-instance--ai-personas)
4. [Rich Shopify Context](#4-rich-shopify-context)
5. [Chat Experience](#5-chat-experience)
6. [Voice & File Features](#6-voice--file-features)
7. [Proactive Engagement Triggers](#7-proactive-engagement-triggers)
   - 7.6 [Per-Trigger Proactive Messages with Discounts](#76-per-trigger-proactive-messages-with-discounts)
   - 7.7 [Bot-Initiated First Message](#77-bot-initiated-first-message)
   - 7.8 [JavaScript API & Widget Events (Hooks)](#78-javascript-api--widget-events-hooks)
   - 7.9 [Analytics & Conversion Tracking](#79-analytics--conversion-tracking)
8. [Internationalization](#8-internationalization)
9. [Accessibility](#9-accessibility)
10. [Performance](#10-performance)
11. [n8n Integration](#11-n8n-integration)
12. [Theme Editor Configuration](#12-theme-editor-configuration)
13. [Technical Implementation](#13-technical-implementation)
14. [Shopify Platform Requirements & Compliance](#14-shopify-platform-requirements--compliance)
15. [App Store Optimization & SEO](#15-app-store-optimization--seo)
16. [Appendix](#appendix)

---

## 1. Architecture

### 1.1 Pure Theme App Extension

> **No backend. No database. No hosting costs.**

n8n Chat is a **Theme App Extension (App Embed)** that injects a React widget directly into Shopify storefronts. All configuration happens in the Theme Editor. All AI processing happens in n8n.

```
┌─────────────────────────────────────────────────────────────────────┐
│                       SHOPIFY STOREFRONT                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│   ┌───────────────────────────────────────────────────────────┐    │
│   │        n8n Chat Widget (React + Assistant UI)              │    │
│   │                                                            │    │
│   │   ┌────────────┐  ┌────────────┐  ┌────────────────────┐  │    │
│   │   │  Bubble    │  │   Chat     │  │   Rich Context     │  │    │
│   │   │  Trigger   │  │   Panel    │  │   Builder          │  │    │
│   │   │  + Badge   │  │  + Thread  │  │   (Liquid→JSON)    │  │    │
│   │   └────────────┘  └────────────┘  └────────────────────┘  │    │
│   │                                                            │    │
│   │   ┌───────────────────────────────────────────────────┐   │    │
│   │   │         Assistant UI LocalRuntime                  │   │    │
│   │   │         + n8n ChatModelAdapter                     │   │    │
│   │   └───────────────────────────────────────────────────┘   │    │
│   └───────────────────────────────────────────────────────────┘    │
│                              │                                      │
└──────────────────────────────│──────────────────────────────────────┘
                               │
                               │ Direct HTTPS POST (CORS enabled)
                               │ SSE Streaming Response
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          n8n WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐               │
│  │  Webhook    │──▶│  Memory     │──▶│  AI Agent   │               │
│  │  Trigger    │   │  (Postgres/ │   │  (Claude/   │               │
│  │             │   │   Redis/Zep)│   │   GPT/etc)  │               │
│  │  Receives:  │   │             │   │             │               │
│  │  • sessionId│   │  Stores all │   │  Has full   │               │
│  │  • message  │   │  chat       │   │  Shopify    │               │
│  │  • context  │   │  history    │   │  context    │               │
│  └─────────────┘   └─────────────┘   └──────┬──────┘               │
│                                             │                       │
│                                             ▼                       │
│                                      ┌─────────────┐               │
│                                      │  Respond    │               │
│                                      │  Webhook    │               │
│                                      │  (SSE)      │               │
│                                      └─────────────┘               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Responsibility Matrix

| Component | Responsibility | Technology |
|-----------|---------------|------------|
| **Widget UI** | Chat interface, animations | React + shadcn/ui + Assistant UI |
| **Design System** | Components, theming | shadcn/ui + Tailwind CSS |
| **Session ID** | UUID persistence | localStorage |
| **Shopify Context** | Customer, cart, product data | Liquid templates |
| **Configuration** | All settings | Theme Editor Block Schema |
| **Chat History** | Conversation storage | n8n Memory Node |
| **AI Processing** | Responses, tools | n8n AI Agent |
| **Streaming** | Real-time tokens | SSE via n8n |

### 1.3 Zero-Cost Infrastructure

| Aspect | Cost |
|--------|------|
| Hosting | **$0** (Shopify CDN) |
| Database | **$0** (n8n handles storage) |
| API Gateway | **$0** (direct webhook) |
| CDN | **$0** (Shopify assets) |
| SSL | **$0** (Shopify included) |

---

## 2. Award-Winning Design System

### 2.1 Design Philosophy

n8n Chat uses a **modern glassmorphism design** with subtle gradients, smooth animations, and premium micro-interactions. The design draws inspiration from:

- **Intercom Messenger** - Clean, professional, conversation-first
- **Apple Messages** - Native feel, smooth transitions
- **Linear App** - Glassmorphism, modern aesthetics
- **Vercel Dashboard** - Dark mode excellence

### 2.2 CSS Design Tokens

```css
/* n8n Chat Premium Design System */
:root {
  /* ═══════════════════════════════════════════════════════════════
     CORE COLORS - Carefully crafted for accessibility & aesthetics
     ═══════════════════════════════════════════════════════════════ */

  /* Primary - Blue that works universally */
  --fc-primary: #3b82f6;
  --fc-primary-hover: #2563eb;
  --fc-primary-active: #1d4ed8;
  --fc-primary-foreground: #ffffff;

  /* Semantic Colors */
  --fc-success: #10b981;
  --fc-warning: #f59e0b;
  --fc-error: #ef4444;
  --fc-info: #06b6d4;

  /* ═══════════════════════════════════════════════════════════════
     LIGHT THEME - Clean, airy, professional
     ═══════════════════════════════════════════════════════════════ */
  --fc-background: #ffffff;
  --fc-background-subtle: #f8fafc;
  --fc-foreground: #0f172a;
  --fc-foreground-muted: #64748b;
  --fc-border: #e2e8f0;
  --fc-border-subtle: #f1f5f9;

  /* Message Bubbles - Light */
  --fc-user-bubble: var(--fc-primary);
  --fc-user-bubble-foreground: #ffffff;
  --fc-assistant-bubble: #f1f5f9;
  --fc-assistant-bubble-foreground: #0f172a;

  /* Glassmorphism - Light */
  --fc-glass-background: rgba(255, 255, 255, 0.85);
  --fc-glass-border: rgba(255, 255, 255, 0.2);
  --fc-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  --fc-backdrop-blur: blur(20px);

  /* ═══════════════════════════════════════════════════════════════
     DARK THEME - Premium, immersive
     ═══════════════════════════════════════════════════════════════ */
}

[data-theme="dark"] {
  --fc-background: #0f172a;
  --fc-background-subtle: #1e293b;
  --fc-foreground: #f8fafc;
  --fc-foreground-muted: #94a3b8;
  --fc-border: #334155;
  --fc-border-subtle: #1e293b;

  /* Message Bubbles - Dark */
  --fc-assistant-bubble: #1e293b;
  --fc-assistant-bubble-foreground: #f8fafc;

  /* Glassmorphism - Dark */
  --fc-glass-background: rgba(15, 23, 42, 0.85);
  --fc-glass-border: rgba(255, 255, 255, 0.1);
  --fc-glass-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

:root {
  /* ═══════════════════════════════════════════════════════════════
     TYPOGRAPHY - Optimized for chat readability
     ═══════════════════════════════════════════════════════════════ */
  --fc-font-family:
    'Inter',
    -apple-system,
    BlinkMacSystemFont,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    sans-serif;

  --fc-font-size-xs: 11px;
  --fc-font-size-sm: 13px;
  --fc-font-size-base: 14px;
  --fc-font-size-md: 15px;
  --fc-font-size-lg: 16px;
  --fc-font-size-xl: 18px;
  --fc-font-size-2xl: 20px;

  --fc-line-height-tight: 1.3;
  --fc-line-height-normal: 1.5;
  --fc-line-height-relaxed: 1.65;

  --fc-font-weight-normal: 400;
  --fc-font-weight-medium: 500;
  --fc-font-weight-semibold: 600;
  --fc-font-weight-bold: 700;

  /* ═══════════════════════════════════════════════════════════════
     SPACING - Consistent rhythm
     ═══════════════════════════════════════════════════════════════ */
  --fc-space-1: 4px;
  --fc-space-2: 8px;
  --fc-space-3: 12px;
  --fc-space-4: 16px;
  --fc-space-5: 20px;
  --fc-space-6: 24px;
  --fc-space-8: 32px;
  --fc-space-10: 40px;
  --fc-space-12: 48px;

  /* Message spacing */
  --fc-message-gap: 16px;
  --fc-message-group-gap: 4px;
  --fc-bubble-padding-x: 14px;
  --fc-bubble-padding-y: 10px;

  /* ═══════════════════════════════════════════════════════════════
     DIMENSIONS - Panel sizing
     ═══════════════════════════════════════════════════════════════ */
  --fc-bubble-size: 60px;
  --fc-bubble-size-sm: 52px;
  --fc-bubble-size-lg: 68px;

  --fc-panel-width: 400px;
  --fc-panel-height: 600px;
  --fc-panel-max-height: 80vh;

  --fc-offset-x: 24px;
  --fc-offset-y: 24px;

  /* ═══════════════════════════════════════════════════════════════
     BORDER RADIUS - Soft, modern curves
     ═══════════════════════════════════════════════════════════════ */
  --fc-radius-sm: 8px;
  --fc-radius-md: 12px;
  --fc-radius-lg: 16px;
  --fc-radius-xl: 20px;
  --fc-radius-2xl: 24px;
  --fc-radius-full: 9999px;

  /* Message bubbles - asymmetric for organic feel */
  --fc-bubble-radius-user: 20px 20px 4px 20px;
  --fc-bubble-radius-assistant: 20px 20px 20px 4px;

  /* ═══════════════════════════════════════════════════════════════
     SHADOWS - Layered depth
     ═══════════════════════════════════════════════════════════════ */
  --fc-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.05);
  --fc-shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --fc-shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  --fc-shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  --fc-shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);

  /* Elevated panel shadow */
  --fc-panel-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.05),
    0 4px 6px rgba(0, 0, 0, 0.05),
    0 10px 20px rgba(0, 0, 0, 0.1),
    0 20px 40px rgba(0, 0, 0, 0.15);

  /* Bubble glow on hover */
  --fc-bubble-glow: 0 0 20px rgba(59, 130, 246, 0.4);

  /* ═══════════════════════════════════════════════════════════════
     ANIMATIONS - Smooth, premium feel
     ═══════════════════════════════════════════════════════════════ */
  --fc-duration-instant: 50ms;
  --fc-duration-fast: 150ms;
  --fc-duration-normal: 250ms;
  --fc-duration-slow: 400ms;
  --fc-duration-slower: 600ms;

  /* Easing curves */
  --fc-ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --fc-ease-in: cubic-bezier(0.4, 0, 1, 1);
  --fc-ease-out: cubic-bezier(0, 0, 0.2, 1);
  --fc-ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --fc-ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --fc-ease-spring: cubic-bezier(0.175, 0.885, 0.32, 1.275);

  /* ═══════════════════════════════════════════════════════════════
     Z-INDEX - Layering system
     ═══════════════════════════════════════════════════════════════ */
  --fc-z-bubble: 999998;
  --fc-z-panel: 999999;
  --fc-z-overlay: 1000000;
}
```

### 2.3 Premium Animations

```css
/* ═══════════════════════════════════════════════════════════════
   KEYFRAME ANIMATIONS
   ═══════════════════════════════════════════════════════════════ */

/* Panel entrance - slides up with spring bounce */
@keyframes fc-panel-enter {
  0% {
    opacity: 0;
    transform: translateY(20px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* Panel exit - fades down */
@keyframes fc-panel-exit {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(10px) scale(0.98);
  }
}

/* Message bubble entrance - slides in from side */
@keyframes fc-message-user {
  0% {
    opacity: 0;
    transform: translateX(20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes fc-message-assistant {
  0% {
    opacity: 0;
    transform: translateX(-20px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

/* Typing indicator - elegant dots */
@keyframes fc-typing-dot {
  0%, 60%, 100% {
    opacity: 0.3;
    transform: translateY(0);
  }
  30% {
    opacity: 1;
    transform: translateY(-4px);
  }
}

/* Bubble pulse for attention */
@keyframes fc-bubble-pulse {
  0%, 100% {
    box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.4);
  }
  50% {
    box-shadow: 0 0 0 12px rgba(59, 130, 246, 0);
  }
}

/* Unread badge bounce */
@keyframes fc-badge-bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

/* Shimmer loading effect */
@keyframes fc-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* Voice recording pulse */
@keyframes fc-voice-pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.1);
    opacity: 0.8;
  }
}

/* Success checkmark */
@keyframes fc-check-draw {
  0% {
    stroke-dashoffset: 50;
  }
  100% {
    stroke-dashoffset: 0;
  }
}

/* Smooth scroll reveal */
@keyframes fc-scroll-reveal {
  0% {
    opacity: 0;
    transform: translateY(10px);
  }
  100% {
    opacity: 1;
    transform: translateY(0);
  }
}
```

### 2.4 Component Styles

```css
/* ═══════════════════════════════════════════════════════════════
   BUBBLE TRIGGER
   ═══════════════════════════════════════════════════════════════ */

.fc-bubble-trigger {
  position: fixed;
  z-index: var(--fc-z-bubble);
  width: var(--fc-bubble-size);
  height: var(--fc-bubble-size);
  border-radius: var(--fc-radius-full);
  background: linear-gradient(135deg, var(--fc-primary) 0%, var(--fc-primary-hover) 100%);
  color: var(--fc-primary-foreground);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--fc-shadow-xl), var(--fc-bubble-glow);
  transition:
    transform var(--fc-duration-normal) var(--fc-ease-spring),
    box-shadow var(--fc-duration-normal) var(--fc-ease-default);
}

.fc-bubble-trigger:hover {
  transform: scale(1.08);
  box-shadow: var(--fc-shadow-2xl), 0 0 30px rgba(59, 130, 246, 0.5);
}

.fc-bubble-trigger:active {
  transform: scale(0.95);
}

.fc-bubble-trigger[data-position="bottom-right"] {
  right: var(--fc-offset-x);
  bottom: var(--fc-offset-y);
}

.fc-bubble-trigger[data-position="bottom-left"] {
  left: var(--fc-offset-x);
  bottom: var(--fc-offset-y);
}

.fc-bubble-trigger[data-pulse="true"] {
  animation: fc-bubble-pulse 2s infinite;
}

/* Unread badge */
.fc-unread-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--fc-error);
  color: white;
  border-radius: var(--fc-radius-full);
  font-size: var(--fc-font-size-xs);
  font-weight: var(--fc-font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: fc-badge-bounce 0.3s var(--fc-ease-spring);
}

/* ═══════════════════════════════════════════════════════════════
   CHAT PANEL - Glassmorphism
   ═══════════════════════════════════════════════════════════════ */

.fc-chat-panel {
  position: fixed;
  z-index: var(--fc-z-panel);
  width: var(--fc-panel-width);
  height: var(--fc-panel-height);
  max-height: var(--fc-panel-max-height);
  background: var(--fc-glass-background);
  backdrop-filter: var(--fc-backdrop-blur);
  -webkit-backdrop-filter: var(--fc-backdrop-blur);
  border: 1px solid var(--fc-glass-border);
  border-radius: var(--fc-radius-2xl);
  box-shadow: var(--fc-panel-shadow);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: fc-panel-enter 0.35s var(--fc-ease-spring);
}

.fc-chat-panel[data-closing="true"] {
  animation: fc-panel-exit 0.2s var(--fc-ease-in) forwards;
}

.fc-chat-panel[data-position="bottom-right"] {
  right: var(--fc-offset-x);
  bottom: calc(var(--fc-offset-y) + var(--fc-bubble-size) + 16px);
}

.fc-chat-panel[data-position="bottom-left"] {
  left: var(--fc-offset-x);
  bottom: calc(var(--fc-offset-y) + var(--fc-bubble-size) + 16px);
}

/* ═══════════════════════════════════════════════════════════════
   CHAT HEADER - Gradient & polish
   ═══════════════════════════════════════════════════════════════ */

.fc-chat-header {
  display: flex;
  align-items: center;
  gap: var(--fc-space-3);
  padding: var(--fc-space-4) var(--fc-space-5);
  background: linear-gradient(135deg, var(--fc-primary) 0%, var(--fc-primary-hover) 100%);
  color: var(--fc-primary-foreground);
  flex-shrink: 0;
}

.fc-chat-header-avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--fc-radius-full);
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.fc-chat-header-info {
  flex: 1;
  min-width: 0;
}

.fc-chat-header-title {
  font-size: var(--fc-font-size-md);
  font-weight: var(--fc-font-weight-semibold);
  line-height: var(--fc-line-height-tight);
}

.fc-chat-header-status {
  font-size: var(--fc-font-size-xs);
  opacity: 0.9;
  display: flex;
  align-items: center;
  gap: var(--fc-space-1);
}

.fc-chat-header-status::before {
  content: '';
  width: 6px;
  height: 6px;
  border-radius: var(--fc-radius-full);
  background: #10b981;
}

.fc-chat-header-actions {
  display: flex;
  gap: var(--fc-space-1);
}

.fc-chat-header-btn {
  width: 32px;
  height: 32px;
  border-radius: var(--fc-radius-md);
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: inherit;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-chat-header-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE THREAD
   ═══════════════════════════════════════════════════════════════ */

.fc-thread-viewport {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: var(--fc-space-5);
  scroll-behavior: smooth;

  /* Custom scrollbar */
  scrollbar-width: thin;
  scrollbar-color: var(--fc-border) transparent;
}

.fc-thread-viewport::-webkit-scrollbar {
  width: 6px;
}

.fc-thread-viewport::-webkit-scrollbar-track {
  background: transparent;
}

.fc-thread-viewport::-webkit-scrollbar-thumb {
  background: var(--fc-border);
  border-radius: var(--fc-radius-full);
}

.fc-messages {
  display: flex;
  flex-direction: column;
  gap: var(--fc-message-gap);
}

/* ═══════════════════════════════════════════════════════════════
   MESSAGE BUBBLES
   ═══════════════════════════════════════════════════════════════ */

.fc-message {
  display: flex;
  gap: var(--fc-space-3);
  max-width: 85%;
  animation: fc-scroll-reveal 0.3s var(--fc-ease-out);
}

.fc-message-user {
  align-self: flex-end;
  flex-direction: row-reverse;
  animation-name: fc-message-user;
}

.fc-message-assistant {
  align-self: flex-start;
  animation-name: fc-message-assistant;
}

.fc-message-avatar {
  width: 32px;
  height: 32px;
  border-radius: var(--fc-radius-full);
  background: var(--fc-background-subtle);
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: var(--fc-foreground-muted);
}

.fc-message-content {
  display: flex;
  flex-direction: column;
  gap: var(--fc-space-1);
}

.fc-message-bubble {
  padding: var(--fc-bubble-padding-y) var(--fc-bubble-padding-x);
  font-size: var(--fc-font-size-base);
  line-height: var(--fc-line-height-relaxed);
  word-wrap: break-word;
}

.fc-message-user .fc-message-bubble {
  background: var(--fc-user-bubble);
  color: var(--fc-user-bubble-foreground);
  border-radius: var(--fc-bubble-radius-user);
}

.fc-message-assistant .fc-message-bubble {
  background: var(--fc-assistant-bubble);
  color: var(--fc-assistant-bubble-foreground);
  border-radius: var(--fc-bubble-radius-assistant);
}

/* Streaming cursor */
.fc-message-streaming .fc-message-bubble::after {
  content: '▋';
  animation: fc-blink 1s step-end infinite;
  margin-left: 2px;
  opacity: 0.7;
}

@keyframes fc-blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
}

/* Message timestamp */
.fc-message-time {
  font-size: var(--fc-font-size-xs);
  color: var(--fc-foreground-muted);
  padding: 0 var(--fc-space-2);
}

/* ═══════════════════════════════════════════════════════════════
   TYPING INDICATOR - Elegant dots
   ═══════════════════════════════════════════════════════════════ */

.fc-typing-indicator {
  display: flex;
  align-items: center;
  gap: var(--fc-space-3);
  padding: var(--fc-space-4);
}

.fc-typing-dots {
  display: flex;
  gap: 4px;
  padding: var(--fc-bubble-padding-y) var(--fc-bubble-padding-x);
  background: var(--fc-assistant-bubble);
  border-radius: var(--fc-bubble-radius-assistant);
}

.fc-typing-dot {
  width: 8px;
  height: 8px;
  border-radius: var(--fc-radius-full);
  background: var(--fc-foreground-muted);
  animation: fc-typing-dot 1.4s infinite;
}

.fc-typing-dot:nth-child(2) {
  animation-delay: 0.2s;
}

.fc-typing-dot:nth-child(3) {
  animation-delay: 0.4s;
}

/* ═══════════════════════════════════════════════════════════════
   ACTION BAR - Message actions
   ═══════════════════════════════════════════════════════════════ */

.fc-action-bar {
  display: flex;
  gap: var(--fc-space-1);
  padding: var(--fc-space-1) 0;
  opacity: 0;
  transition: opacity var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-message:hover .fc-action-bar {
  opacity: 1;
}

.fc-action-btn {
  width: 28px;
  height: 28px;
  border-radius: var(--fc-radius-md);
  background: transparent;
  border: none;
  color: var(--fc-foreground-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-action-btn:hover {
  background: var(--fc-background-subtle);
  color: var(--fc-foreground);
}

.fc-action-btn[data-copied="true"] {
  color: var(--fc-success);
}

/* ═══════════════════════════════════════════════════════════════
   WELCOME SCREEN
   ═══════════════════════════════════════════════════════════════ */

.fc-welcome {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: var(--fc-space-8);
  gap: var(--fc-space-6);
}

.fc-welcome-icon {
  width: 64px;
  height: 64px;
  border-radius: var(--fc-radius-xl);
  background: linear-gradient(135deg, var(--fc-primary) 0%, var(--fc-primary-hover) 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.fc-welcome-message {
  font-size: var(--fc-font-size-lg);
  color: var(--fc-foreground);
  line-height: var(--fc-line-height-relaxed);
  max-width: 280px;
}

.fc-welcome-prompts {
  display: flex;
  flex-direction: column;
  gap: var(--fc-space-2);
  width: 100%;
  max-width: 300px;
}

.fc-prompt-btn {
  padding: var(--fc-space-3) var(--fc-space-4);
  background: var(--fc-background);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius-lg);
  color: var(--fc-foreground);
  font-size: var(--fc-font-size-sm);
  cursor: pointer;
  text-align: left;
  transition: all var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-prompt-btn:hover {
  border-color: var(--fc-primary);
  background: var(--fc-background-subtle);
  transform: translateX(4px);
}

/* ═══════════════════════════════════════════════════════════════
   COMPOSER INPUT
   ═══════════════════════════════════════════════════════════════ */

.fc-composer {
  display: flex;
  align-items: flex-end;
  gap: var(--fc-space-2);
  padding: var(--fc-space-4);
  border-top: 1px solid var(--fc-border-subtle);
  background: var(--fc-background);
}

.fc-composer-input-wrapper {
  flex: 1;
  display: flex;
  align-items: flex-end;
  gap: var(--fc-space-2);
  padding: var(--fc-space-3);
  background: var(--fc-background-subtle);
  border: 1px solid var(--fc-border);
  border-radius: var(--fc-radius-xl);
  transition: border-color var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-composer-input-wrapper:focus-within {
  border-color: var(--fc-primary);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.fc-composer-input {
  flex: 1;
  border: none;
  background: transparent;
  font-family: var(--fc-font-family);
  font-size: var(--fc-font-size-base);
  color: var(--fc-foreground);
  resize: none;
  max-height: 120px;
  line-height: var(--fc-line-height-normal);
}

.fc-composer-input::placeholder {
  color: var(--fc-foreground-muted);
}

.fc-composer-input:focus {
  outline: none;
}

.fc-composer-btn {
  width: 40px;
  height: 40px;
  border-radius: var(--fc-radius-full);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-send-btn {
  background: var(--fc-primary);
  color: var(--fc-primary-foreground);
}

.fc-send-btn:hover:not(:disabled) {
  background: var(--fc-primary-hover);
  transform: scale(1.05);
}

.fc-send-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.fc-cancel-btn {
  background: var(--fc-error);
  color: white;
}

/* Attachment & voice buttons */
.fc-attachment-btn,
.fc-voice-btn {
  width: 36px;
  height: 36px;
  background: transparent;
  color: var(--fc-foreground-muted);
}

.fc-attachment-btn:hover,
.fc-voice-btn:hover {
  color: var(--fc-foreground);
  background: var(--fc-background-subtle);
}

.fc-voice-btn[data-recording="true"] {
  color: var(--fc-error);
  animation: fc-voice-pulse 1s infinite;
}

/* ═══════════════════════════════════════════════════════════════
   BRANCH PICKER - Navigate regenerated messages
   ═══════════════════════════════════════════════════════════════ */

.fc-branch-picker {
  display: flex;
  align-items: center;
  gap: var(--fc-space-2);
  padding: var(--fc-space-1) 0;
}

.fc-branch-btn {
  width: 24px;
  height: 24px;
  border-radius: var(--fc-radius-sm);
  background: transparent;
  border: none;
  color: var(--fc-foreground-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.fc-branch-btn:hover:not(:disabled) {
  background: var(--fc-background-subtle);
  color: var(--fc-foreground);
}

.fc-branch-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.fc-branch-info {
  font-size: var(--fc-font-size-xs);
  color: var(--fc-foreground-muted);
}

/* ═══════════════════════════════════════════════════════════════
   MOBILE RESPONSIVE
   ═══════════════════════════════════════════════════════════════ */

@media (max-width: 480px) {
  .fc-chat-panel {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    width: 100%;
    height: 100%;
    max-height: 100%;
    border-radius: 0;
  }

  .fc-bubble-trigger {
    --fc-bubble-size: 56px;
    --fc-offset-x: 16px;
    --fc-offset-y: 16px;
  }

  .fc-chat-header {
    padding: var(--fc-space-4);
  }

  .fc-thread-viewport {
    padding: var(--fc-space-4);
  }

  .fc-message {
    max-width: 90%;
  }
}

/* Safe area padding for notched devices */
@supports (padding: env(safe-area-inset-bottom)) {
  .fc-composer {
    padding-bottom: calc(var(--fc-space-4) + env(safe-area-inset-bottom));
  }
}
```

---

## 3. Multi-Instance & AI Personas

### 3.1 Instance Architecture

n8n Chat supports **multiple AI personas** with different configurations for different contexts:

```typescript
interface ChatInstance {
  id: string;
  name: string;
  webhookUrl: string;

  // AI Persona Configuration
  persona: {
    name: string;           // "Shoppy" or "Support Agent"
    avatar: string;         // URL or emoji
    tone: 'friendly' | 'professional' | 'casual';
    systemPrompt: string;   // Full system prompt for n8n
  };

  // Targeting Rules
  targeting: {
    urlPatterns: string[];  // ["/products/*", "/collections/*"]
    customerSegments: CustomerSegment[];
    priority: number;       // Higher = more specific
  };

  // Context Configuration
  contextConfig: {
    sendCustomer: boolean;
    sendCart: boolean;
    sendProduct: boolean;
    sendOrderHistory: boolean;
    customFields: Record<string, string>;
  };

  // Appearance Overrides
  appearance: Partial<ThemeConfig>;
}

type CustomerSegment =
  | { type: 'all' }
  | { type: 'logged_in' }
  | { type: 'guest' }
  | { type: 'vip'; minOrders: number }
  | { type: 'high_value'; minSpent: number }
  | { type: 'tagged'; tags: string[] }
  | { type: 'new_customer'; maxDays: number };
```

### 3.2 System Prompt Templates

Pre-built templates for common e-commerce scenarios:

#### Sales Assistant
```
You are {{persona.name}}, the AI shopping assistant for {{shop.name}}.

YOUR PERSONALITY:
- Friendly, helpful, and enthusiastic about products
- Expert on all products in the store
- Focused on helping customers find the perfect item

CURRENT CONTEXT:
{{#if customer.logged_in}}
Customer: {{customer.name}} ({{customer.email}})
VIP Status: {{#if customer.tags includes 'vip'}}Yes{{else}}No{{/if}}
Previous Orders: {{customer.orders_count}}
Total Spent: ${{customer.total_spent}}
{{else}}
Guest shopper
{{/if}}

{{#if cart.items.length > 0}}
CURRENT CART (${{cart.total_price}}):
{{#each cart.items}}
- {{quantity}}x {{title}} (${{price}})
{{/each}}
{{/if}}

{{#if product}}
VIEWING: {{product.title}} - ${{product.price}}
{{product.description}}
{{/if}}

INSTRUCTIONS:
1. Help customers find products that match their needs
2. Suggest complementary products when appropriate
3. For VIP customers, mention exclusive benefits
4. If cart total > $100, mention free shipping
5. Be concise but thorough
```

#### Customer Support
```
You are {{persona.name}}, the support specialist for {{shop.name}}.

YOUR ROLE:
- Help with order inquiries, returns, and general questions
- Provide accurate information about policies
- Escalate complex issues to human support when needed

CUSTOMER: {{#if customer.logged_in}}{{customer.name}} ({{customer.orders_count}} orders){{else}}Guest{{/if}}

POLICIES:
- Returns: 30-day return policy on unworn items
- Shipping: Free shipping over $100, standard 5-7 days
- Exchanges: Free exchanges within 60 days

INSTRUCTIONS:
1. Be empathetic and solution-oriented
2. Offer concrete next steps
3. If you can't resolve, offer to connect with human support
4. Protect customer privacy - don't share personal details
```

#### Product Expert
```
You are {{persona.name}}, a product expert for {{shop.name}}.

EXPERTISE:
- Deep knowledge of all products, materials, and specifications
- Can explain technical details in simple terms
- Provides honest, balanced product recommendations

{{#if product}}
CURRENT PRODUCT: {{product.title}}
Price: ${{product.price}}{{#if product.compare_at_price}} (Was ${{product.compare_at_price}}){{/if}}
Description: {{product.description}}
Tags: {{product.tags}}
{{/if}}

INSTRUCTIONS:
1. Answer product questions with detailed, accurate information
2. Compare products when asked
3. Be honest about limitations
4. Suggest alternatives if something isn't a good fit
```

### 3.3 Instance Routing Logic

```typescript
function selectInstance(
  instances: ChatInstance[],
  context: {
    url: string;
    customer: CustomerContext;
    cart: CartContext;
  }
): ChatInstance {
  // Sort by priority (highest first)
  const sorted = [...instances]
    .filter(i => i.enabled)
    .sort((a, b) => b.targeting.priority - a.targeting.priority);

  for (const instance of sorted) {
    // Check URL patterns
    const urlMatch = instance.targeting.urlPatterns.some(pattern =>
      matchUrlPattern(context.url, pattern)
    );

    if (!urlMatch && instance.targeting.urlPatterns.length > 0) continue;

    // Check customer segments
    const segmentMatch = instance.targeting.customerSegments.some(segment =>
      matchCustomerSegment(context.customer, segment)
    );

    if (!segmentMatch && instance.targeting.customerSegments.length > 0) continue;

    return instance;
  }

  // Return default instance
  return instances.find(i => i.isDefault) || instances[0];
}

function matchCustomerSegment(
  customer: CustomerContext,
  segment: CustomerSegment
): boolean {
  switch (segment.type) {
    case 'all':
      return true;
    case 'logged_in':
      return customer.logged_in;
    case 'guest':
      return !customer.logged_in;
    case 'vip':
      return customer.orders_count >= segment.minOrders;
    case 'high_value':
      return parseFloat(customer.total_spent || '0') >= segment.minSpent;
    case 'tagged':
      return segment.tags.some(tag => customer.tags?.includes(tag));
    case 'new_customer':
      const daysSinceFirst = /* calculate */;
      return daysSinceFirst <= segment.maxDays;
    default:
      return false;
  }
}
```

---

## 4. Rich Shopify Context

### 4.1 Complete Context Schema

```typescript
interface N8nChatContext {
  // Shop Information (always available)
  shop: {
    name: string;
    domain: string;
    permanent_domain: string;
    email: string;
    phone: string;
    currency: string;
    money_format: string;
    products_count: number;
    collections_count: number;
  };

  // Customer Information (when logged in)
  customer: {
    logged_in: boolean;
    id?: number;
    email?: string;
    first_name?: string;
    last_name?: string;
    name?: string;
    phone?: string;
    tags?: string[];
    accepts_marketing?: boolean;
    orders_count?: number;
    total_spent?: string;

    // Recent orders (last 5)
    recent_orders?: Array<{
      id: number;
      name: string;
      total_price: string;
      created_at: string;
      fulfillment_status: string | null;
      financial_status: string;
    }>;

    // Default address
    default_address?: {
      city: string;
      province: string;
      country: string;
      zip: string;
    };
  };

  // Current Page
  page: {
    type: 'index' | 'collection' | 'product' | 'cart' | 'page' | 'blog' | 'article' | 'search' | 'account';
    url: string;
    full_url: string;
    title: string;
    referrer?: string;
  };

  // Cart Contents (always available via /cart.js)
  cart: {
    token: string;
    item_count: number;
    total_price: number;
    total_weight: number;
    currency: string;
    requires_shipping: boolean;

    items: Array<{
      id: number;
      quantity: number;
      title: string;
      price: number;
      line_price: number;
      product_title: string;
      variant_title: string | null;
      sku: string;
      vendor: string;
      url: string;
      image: string | null;
      properties: Record<string, string>;
    }>;

    // Discounts
    discounts?: Array<{
      code: string;
      amount: number;
      type: string;
    }>;

    note: string | null;
    attributes: Record<string, string>;
  };

  // Product Details (on product pages)
  product: {
    id: number;
    title: string;
    handle: string;
    description: string;
    vendor: string;
    type: string;
    tags: string[];
    price: string;
    price_min: string;
    price_max: string;
    compare_at_price: string | null;
    available: boolean;
    url: string;
    featured_image: string | null;

    // Variants
    variants: Array<{
      id: number;
      title: string;
      price: string;
      available: boolean;
      sku: string;
    }>;

    // Options
    options: Array<{
      name: string;
      position: number;
      values: string[];
    }>;
  } | null;

  // Collection Details (on collection pages)
  collection: {
    id: number;
    title: string;
    handle: string;
    description: string;
    products_count: number;
    url: string;

    // Active filters
    current_filters?: Array<{
      label: string;
      value: string;
    }>;

    sort_by?: string;
  } | null;

  // Locale & Localization
  locale: {
    language: string;      // "en", "fr", "de"
    country: string;       // "US", "CA", "GB"
    currency: string;      // "USD", "EUR", "GBP"
    timezone?: string;     // "America/New_York"
  };

  // Metadata
  timestamp: string;       // ISO 8601
  sessionId: string;       // UUID
  widgetVersion: string;   // "4.0.0"
}
```

### 4.2 Context Configuration Options

Merchants control what context is sent via Theme Editor toggles:

| Setting | Default | Description |
|---------|---------|-------------|
| `send_customer_info` | `true` | Email, name, tags, order history |
| `send_cart_contents` | `true` | Cart items, totals, discounts |
| `send_product_details` | `true` | Current product on product pages |
| `send_order_history` | `false` | Last 5 orders (privacy-sensitive) |
| `send_page_url` | `true` | Current page URL and type |
| `send_locale_info` | `true` | Language, country, currency |

### 4.3 Dynamic Cart Refresh

Cart data is fetched fresh before each message to ensure accuracy:

```typescript
async function refreshCartContext(): Promise<CartContext> {
  const response = await fetch(`${window.Shopify.routes.root}cart.js`);
  const cart = await response.json();

  return {
    token: cart.token,
    item_count: cart.item_count,
    total_price: cart.total_price / 100,
    total_weight: cart.total_weight,
    currency: cart.currency,
    requires_shipping: cart.requires_shipping,
    items: cart.items.map(item => ({
      id: item.id,
      quantity: item.quantity,
      title: item.title,
      price: item.price / 100,
      line_price: item.line_price / 100,
      product_title: item.product_title,
      variant_title: item.variant_title,
      sku: item.sku,
      vendor: item.vendor,
      url: item.url,
      image: item.image,
      properties: item.properties,
    })),
    note: cart.note,
    attributes: cart.attributes,
  };
}
```

---

## 5. Chat Experience

### 5.1 Assistant UI Integration

n8n Chat uses **Assistant UI's LocalRuntime** for production-grade chat state management:

```typescript
import {
  AssistantRuntimeProvider,
  useLocalRuntime,
  ThreadPrimitive,
  ComposerPrimitive,
  MessagePrimitive,
  ActionBarPrimitive,
  BranchPickerPrimitive,
} from '@assistant-ui/react';

// Custom ChatModelAdapter for n8n
const n8nAdapter: ChatModelAdapter = {
  async *run({ messages, abortSignal }) {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'text/event-stream, application/json',
      },
      body: JSON.stringify({
        action: 'sendMessage',
        sessionId,
        chatInput: extractUserMessage(messages),
        context: await buildContext(),
      }),
      signal: abortSignal,
    });

    if (response.headers.get('Content-Type')?.includes('text/event-stream')) {
      yield* handleSSEStream(response);
    } else {
      const data = await response.json();
      yield { content: [{ type: 'text', text: data.output }] };
    }
  },
};

const runtime = useLocalRuntime(n8nAdapter);
```

### 5.2 Component Hierarchy

```
N8nChatWidget
├── AssistantRuntimeProvider (runtime)
│   └── ChatContainer
│       ├── BubbleTrigger
│       │   ├── BubbleIcon (animated)
│       │   └── UnreadBadge
│       │
│       └── ChatPanel (glassmorphism)
│           ├── ChatHeader
│           │   ├── Avatar
│           │   ├── Title + Status
│           │   └── Actions (minimize, close)
│           │
│           ├── ThreadPrimitive.Root
│           │   ├── ThreadPrimitive.Empty → WelcomeScreen
│           │   │   ├── WelcomeMessage
│           │   │   └── SuggestionButtons
│           │   │
│           │   └── ThreadPrimitive.Viewport
│           │       └── ThreadPrimitive.Messages
│           │           ├── UserMessage
│           │           │   └── MessageBubble
│           │           │
│           │           └── AssistantMessage
│           │               ├── Avatar
│           │               ├── MessageBubble (Markdown)
│           │               ├── ActionBar (copy, regenerate)
│           │               └── BranchPicker
│           │
│           └── ComposerPrimitive.Root
│               ├── AttachmentPreview
│               ├── ComposerInput (auto-resize)
│               ├── VoiceButton
│               ├── AttachmentButton
│               └── SendButton / CancelButton
```

### 5.3 Rich Message Features

#### Markdown Rendering
- **Bold**, *italic*, `code`, [links](/)
- Code blocks with syntax highlighting
- Bullet and numbered lists
- Blockquotes
- Tables

#### Message Actions
- **Copy** - Copy message to clipboard
- **Regenerate** - Request new response
- **Branch Navigation** - View alternative responses

#### Typing Indicator
- Animated three-dot indicator
- Shows during AI processing
- Smooth entrance/exit animations

### 5.4 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line |
| `Escape` | Close panel |
| `Ctrl/Cmd + K` | Open/close chat |
| `↑` | Edit last message |

---

## 6. Voice & File Features

### 6.1 Voice Input

#### User Experience
1. User taps microphone button
2. Browser requests permission (first time only)
3. Recording starts with visual feedback:
   - Pulsing red recording indicator
   - Real-time audio waveform visualization
   - Recording duration display
4. User taps stop or speaks silence
5. Audio sent to n8n for transcription (Whisper)
6. Transcribed text appears in input
7. User can edit before sending

#### Implementation

```typescript
interface VoiceInputState {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;        // 0-1 for visualization
  duration: number;          // seconds
  transcript: string | null;
  error: string | null;
}

function useVoiceInput(config: VoiceConfig) {
  const [state, setState] = useState<VoiceInputState>(initialState);
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const audioChunks = useRef<Blob[]>([]);

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder.current = new MediaRecorder(stream, {
      mimeType: 'audio/webm;codecs=opus'
    });

    // Audio level visualization
    const audioContext = new AudioContext();
    const analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    // Update audio level for waveform
    const updateLevel = () => {
      const data = new Uint8Array(analyser.frequencyBinCount);
      analyser.getByteFrequencyData(data);
      const level = Math.max(...data) / 255;
      setState(s => ({ ...s, audioLevel: level }));
      if (state.isRecording) requestAnimationFrame(updateLevel);
    };
    updateLevel();

    mediaRecorder.current.ondataavailable = (e) => {
      audioChunks.current.push(e.data);
    };

    mediaRecorder.current.onstop = async () => {
      const audioBlob = new Blob(audioChunks.current, { type: 'audio/webm' });
      await sendToN8nForTranscription(audioBlob);
    };

    mediaRecorder.current.start(100); // 100ms chunks
    setState(s => ({ ...s, isRecording: true }));
  };

  const stopRecording = () => {
    mediaRecorder.current?.stop();
    setState(s => ({ ...s, isRecording: false, isProcessing: true }));
  };

  return { state, startRecording, stopRecording };
}
```

#### Voice Waveform Animation

```css
.fc-voice-waveform {
  display: flex;
  align-items: center;
  gap: 2px;
  height: 24px;
}

.fc-voice-bar {
  width: 3px;
  background: var(--fc-primary);
  border-radius: var(--fc-radius-full);
  transition: height 50ms ease;
}

/* Animated based on audio level */
.fc-voice-bar:nth-child(1) { height: calc(8px + var(--level) * 16px); }
.fc-voice-bar:nth-child(2) { height: calc(12px + var(--level) * 12px); }
.fc-voice-bar:nth-child(3) { height: calc(6px + var(--level) * 18px); }
.fc-voice-bar:nth-child(4) { height: calc(10px + var(--level) * 14px); }
.fc-voice-bar:nth-child(5) { height: calc(8px + var(--level) * 16px); }
```

### 6.2 File Upload

#### Supported File Types
- **Images**: JPG, PNG, GIF, WebP (for AI Vision)
- **Documents**: PDF, DOC, DOCX, TXT
- **Maximum Size**: 20MB per file
- **Multiple Files**: Up to 5 files per message

#### User Experience
1. Drag files onto chat panel OR click attachment button
2. Drop zone highlights with animation
3. File preview appears:
   - Images: Thumbnail preview
   - Documents: Icon + filename + size
4. Upload progress bar
5. Files attached to next message
6. Sent to n8n as URLs or base64

#### Drag & Drop Implementation

```typescript
function useFileUpload(config: FileUploadConfig) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({});

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    const validFiles = droppedFiles.filter(file => {
      // Validate type
      if (!config.allowedTypes.includes(file.type)) {
        showError(`${file.name}: File type not supported`);
        return false;
      }
      // Validate size
      if (file.size > config.maxSize) {
        showError(`${file.name}: File too large (max ${formatSize(config.maxSize)})`);
        return false;
      }
      return true;
    });

    // Upload files
    for (const file of validFiles) {
      await uploadFile(file);
    }
  };

  const uploadFile = async (file: File) => {
    const id = generateId();

    // Create preview for images
    const preview = file.type.startsWith('image/')
      ? await createImagePreview(file)
      : null;

    setFiles(f => [...f, {
      id,
      file,
      preview,
      status: 'uploading',
    }]);

    // Convert to base64 for n8n
    const base64 = await fileToBase64(file);

    setFiles(f => f.map(uf =>
      uf.id === id
        ? { ...uf, status: 'ready', base64 }
        : uf
    ));
  };

  return { files, isDragging, uploadProgress, handleDrop, removeFile };
}
```

#### File Preview Styles

```css
.fc-attachment-preview {
  display: flex;
  flex-wrap: wrap;
  gap: var(--fc-space-2);
  padding: var(--fc-space-2);
  border-bottom: 1px solid var(--fc-border-subtle);
}

.fc-attachment-item {
  position: relative;
  border-radius: var(--fc-radius-md);
  overflow: hidden;
  background: var(--fc-background-subtle);
}

.fc-attachment-image {
  width: 80px;
  height: 80px;
  object-fit: cover;
}

.fc-attachment-file {
  display: flex;
  align-items: center;
  gap: var(--fc-space-2);
  padding: var(--fc-space-2) var(--fc-space-3);
  max-width: 200px;
}

.fc-attachment-remove {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: var(--fc-radius-full);
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Upload progress */
.fc-attachment-progress {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--fc-border);
}

.fc-attachment-progress-bar {
  height: 100%;
  background: var(--fc-primary);
  transition: width 150ms ease;
}

/* Drag overlay */
.fc-drop-overlay {
  position: absolute;
  inset: 0;
  background: rgba(59, 130, 246, 0.1);
  border: 2px dashed var(--fc-primary);
  border-radius: var(--fc-radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--fc-duration-fast) var(--fc-ease-default);
}

.fc-drop-overlay[data-active="true"] {
  opacity: 1;
}
```

---

## 7. Proactive Engagement Triggers

### 7.1 Trigger Types

n8n Chat supports multiple auto-open triggers to proactively engage visitors:

```typescript
interface AutoOpenConfig {
  enabled: boolean;

  triggers: {
    // Time-based
    delay?: {
      enabled: boolean;
      seconds: number;      // Open after X seconds
    };

    // Scroll-based
    scroll?: {
      enabled: boolean;
      percentage: number;   // Open at X% scroll depth
    };

    // Exit intent (desktop only)
    exitIntent?: {
      enabled: boolean;
      sensitivity: 'low' | 'medium' | 'high';
    };

    // Idle detection
    idle?: {
      enabled: boolean;
      seconds: number;      // Open after X seconds of inactivity
    };

    // Cart value trigger
    cartValue?: {
      enabled: boolean;
      threshold: number;    // Open when cart > $X
      message?: string;     // Custom message to show
    };

    // Return visitor
    returnVisitor?: {
      enabled: boolean;
      maxHoursAgo: number;  // Visitor returned within X hours
    };
  };

  // Frequency control
  frequency: 'once_per_session' | 'once_per_day' | 'always';

  // Conditions
  conditions: {
    skipIfInteracted: boolean;   // Don't show if user opened chat
    skipOnMobile: boolean;       // Mobile-only skip
    customerSegments?: CustomerSegment[];
    urlPatterns?: string[];
  };

  // Custom message when auto-opening
  autoOpenMessage?: string;
}
```

### 7.2 Exit Intent Detection

```typescript
function useExitIntent(config: ExitIntentConfig) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!config.enabled) return;

    const sensitivity = {
      low: 50,      // Must be 50px from top
      medium: 20,   // 20px from top
      high: 5,      // 5px from top
    }[config.sensitivity];

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when moving up (exiting to tab bar)
      if (e.clientY <= sensitivity && !triggered.current) {
        // Check if cursor moved up (not to sides)
        if (e.relatedTarget === null) {
          triggered.current = true;
          config.onExitIntent();
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [config]);
}
```

### 7.3 Scroll Depth Tracking

```typescript
function useScrollTrigger(config: ScrollTriggerConfig) {
  const triggered = useRef(false);

  useEffect(() => {
    if (!config.enabled) return;

    const handleScroll = () => {
      if (triggered.current) return;

      const scrolled = window.scrollY;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      const percentage = (scrolled / documentHeight) * 100;

      if (percentage >= config.percentage) {
        triggered.current = true;
        config.onScrollThreshold();
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [config]);
}
```

### 7.4 Idle Detection

```typescript
function useIdleTrigger(config: IdleTriggerConfig) {
  const timeout = useRef<NodeJS.Timeout>();
  const triggered = useRef(false);

  useEffect(() => {
    if (!config.enabled) return;

    const resetTimer = () => {
      clearTimeout(timeout.current);

      if (!triggered.current) {
        timeout.current = setTimeout(() => {
          triggered.current = true;
          config.onIdle();
        }, config.seconds * 1000);
      }
    };

    // Reset on any user activity
    const events = ['mousemove', 'keydown', 'scroll', 'click', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));

    resetTimer(); // Start initial timer

    return () => {
      clearTimeout(timeout.current);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [config]);
}
```

### 7.5 Cart Abandonment Detection

```typescript
function useCartTrigger(config: CartTriggerConfig) {
  const lastCartValue = useRef(0);

  useEffect(() => {
    if (!config.enabled) return;

    const checkCart = async () => {
      const cart = await fetch('/cart.js').then(r => r.json());
      const cartValue = cart.total_price / 100;

      // Trigger when cart value exceeds threshold
      if (cartValue >= config.threshold && lastCartValue.current < config.threshold) {
        config.onCartThreshold(cartValue, config.message);
      }

      lastCartValue.current = cartValue;
    };

    // Check on page load
    checkCart();

    // Listen for cart updates
    document.addEventListener('cart:updated', checkCart);

    // Poll every 30 seconds as backup
    const interval = setInterval(checkCart, 30000);

    return () => {
      document.removeEventListener('cart:updated', checkCart);
      clearInterval(interval);
    };
  }, [config]);
}
```

### 7.6 Per-Trigger Proactive Messages with Discounts

> **Award-Winning Feature**: Personalized, trigger-specific messages with discount code injection

```typescript
interface ProactiveMessage {
  trigger: 'exit_intent' | 'scroll' | 'idle' | 'cart_value' | 'time_on_page' | 'return_visitor';
  enabled: boolean;

  // Message template with dynamic variables
  message: string;  // "Wait! Use {discount_code} for {discount_value} off your cart!"

  // Optional discount to offer
  discount?: {
    enabled: boolean;
    code: string;           // "SAVE10"
    type: 'percentage' | 'fixed';
    value: number;          // 10 for 10% or $10
    minCartValue?: number;  // Minimum cart value to show
    expiresIn?: number;     // Hours until expiry
  };

  // Bot sends message automatically when triggered
  botInitiated: boolean;

  // Show as system message vs bot message
  displayAs: 'bot' | 'system' | 'banner';
}

// Configuration example
const proactiveMessages: ProactiveMessage[] = [
  {
    trigger: 'exit_intent',
    enabled: true,
    message: "Wait! 🎁 Before you go, here's {discount_value} off your order! Use code: {discount_code}",
    discount: {
      enabled: true,
      code: 'STAY10',
      type: 'percentage',
      value: 10,
      minCartValue: 50,
      expiresIn: 24
    },
    botInitiated: true,
    displayAs: 'bot'
  },
  {
    trigger: 'cart_value',
    enabled: true,
    message: "🛒 Your cart is worth {cart_value}! Complete your order now and save {discount_value} with code {discount_code}",
    discount: {
      enabled: true,
      code: 'BIGORDER15',
      type: 'percentage',
      value: 15,
      minCartValue: 100
    },
    botInitiated: true,
    displayAs: 'bot'
  },
  {
    trigger: 'idle',
    enabled: true,
    message: "👋 Still there? I'm here if you have any questions about {product_title}!",
    botInitiated: true,
    displayAs: 'bot'
  },
  {
    trigger: 'return_visitor',
    enabled: true,
    message: "Welcome back! 🎉 We saved your cart. Ready to complete your purchase?",
    botInitiated: true,
    displayAs: 'bot'
  }
];
```

#### Dynamic Variable Interpolation

```typescript
interface MessageVariables {
  // Customer
  customer_name: string;
  customer_email: string;
  customer_first_name: string;

  // Cart
  cart_value: string;        // "$125.00"
  cart_count: number;        // 3
  cart_items: string;        // "Blue T-Shirt, Sneakers, Hat"

  // Product (on product pages)
  product_title: string;
  product_price: string;
  product_url: string;

  // Discount
  discount_code: string;
  discount_value: string;    // "10%" or "$10"

  // Time
  current_time: string;
  time_on_page: string;      // "2 minutes"

  // Shop
  shop_name: string;
}

function interpolateMessage(template: string, vars: MessageVariables): string {
  return template.replace(/\{(\w+)\}/g, (_, key) => vars[key] || `{${key}}`);
}

// Usage
const message = interpolateMessage(
  "Hi {customer_first_name}! Use {discount_code} for {discount_value} off!",
  { customer_first_name: 'Sarah', discount_code: 'SAVE10', discount_value: '10%' }
);
// → "Hi Sarah! Use SAVE10 for 10% off!"
```

### 7.7 Bot-Initiated First Message

> **Proactive greeting when chat opens - configurable per trigger**

```typescript
interface BotFirstMessage {
  enabled: boolean;
  delay: number;             // ms after panel opens (default: 500)

  // Different greetings based on context
  messages: {
    default: string;         // "Hi! How can I help you today?"
    product_page: string;    // "Have questions about {product_title}?"
    cart_page: string;       // "Ready to checkout? I can help!"
    returning_customer: string;  // "Welcome back, {customer_first_name}!"
    exit_intent: string;     // "Wait! I can help you find what you're looking for."
  };

  // Include suggested prompts after greeting
  showSuggestionsAfter: boolean;
}
```

---

## 7.8 JavaScript API & Widget Events (Hooks)

> **Full programmatic control for developers and integrations**

### Global API

```typescript
// n8n Chat exposes a global API
declare global {
  interface Window {
    N8nChat: N8nChatAPI;
  }
}

interface N8nChatAPI {
  // ═══════════════════════════════════════════════════════════════
  // CONTROL METHODS
  // ═══════════════════════════════════════════════════════════════

  /** Open the chat panel */
  open(): void;

  /** Close the chat panel */
  close(): void;

  /** Toggle panel open/closed */
  toggle(): void;

  /** Check if panel is open */
  isOpen(): boolean;

  /** Send a message programmatically */
  send(message: string): Promise<void>;

  /** Send a bot message (appears as assistant) */
  sendBotMessage(message: string): void;

  /** Clear conversation history */
  clearHistory(): void;

  /** Update configuration at runtime */
  setConfig(config: Partial<N8nChatConfig>): void;

  /** Destroy widget instance */
  destroy(): void;

  // ═══════════════════════════════════════════════════════════════
  // EVENT LISTENERS
  // ═══════════════════════════════════════════════════════════════

  /** Subscribe to widget events */
  on(event: N8nChatEvent, callback: EventCallback): () => void;

  /** Unsubscribe from events */
  off(event: N8nChatEvent, callback: EventCallback): void;

  /** One-time event listener */
  once(event: N8nChatEvent, callback: EventCallback): void;

  // ═══════════════════════════════════════════════════════════════
  // STATE
  // ═══════════════════════════════════════════════════════════════

  /** Get current session ID */
  getSessionId(): string;

  /** Get message count */
  getMessageCount(): number;

  /** Get widget version */
  version: string;
}
```

### Event Types

```typescript
type N8nChatEvent =
  // Panel events
  | 'panel:open'
  | 'panel:close'
  | 'panel:minimize'

  // Message events
  | 'message:sent'
  | 'message:received'
  | 'message:error'

  // User events
  | 'user:typing'
  | 'user:idle'
  | 'user:interaction'   // First interaction

  // Trigger events
  | 'trigger:exit_intent'
  | 'trigger:scroll'
  | 'trigger:idle'
  | 'trigger:cart_value'

  // File events
  | 'file:upload_start'
  | 'file:upload_complete'
  | 'file:upload_error'

  // Voice events
  | 'voice:start'
  | 'voice:stop'
  | 'voice:transcribed'

  // Session events
  | 'session:start'
  | 'session:end'

  // Conversion events (for analytics)
  | 'conversion:lead'        // User provided email
  | 'conversion:engagement'  // User sent 3+ messages
  | 'conversion:discount'    // User was shown discount

interface EventPayload {
  timestamp: string;
  sessionId: string;
  data?: Record<string, unknown>;
}

type EventCallback = (payload: EventPayload) => void;
```

### Usage Examples

```javascript
// Open chat when user clicks custom button
document.querySelector('#my-chat-button').addEventListener('click', () => {
  N8nChat.open();
});

// Track all messages sent
N8nChat.on('message:sent', (payload) => {
  console.log('User sent:', payload.data.message);

  // Send to your analytics
  gtag('event', 'chat_message', {
    event_category: 'n8n Chat',
    event_label: 'message_sent'
  });
});

// Track conversions (user provided email)
N8nChat.on('conversion:lead', (payload) => {
  fbq('track', 'Lead', {
    content_name: 'n8n Chat Lead',
    content_category: 'chat'
  });
});

// Send proactive message after 30 seconds
setTimeout(() => {
  if (!N8nChat.isOpen()) {
    N8nChat.open();
    N8nChat.sendBotMessage("Hi! Looking for something specific?");
  }
}, 30000);

// React to exit intent
N8nChat.on('trigger:exit_intent', () => {
  N8nChat.sendBotMessage("Wait! Use code STAY10 for 10% off! 🎁");
});

// Integrate with Shopify cart
document.addEventListener('cart:updated', async () => {
  const cart = await fetch('/cart.js').then(r => r.json());
  if (cart.total_price > 10000) {  // $100+
    N8nChat.sendBotMessage(
      `Your cart is worth $${cart.total_price / 100}! ` +
      `Use BIGORDER for free shipping!`
    );
  }
});
```

---

## 7.9 Analytics & Conversion Tracking

> **Built-in analytics with Shopify, GA4, and Meta Pixel integration**

### Analytics Configuration

```typescript
interface AnalyticsConfig {
  enabled: boolean;

  // Built-in tracking
  trackEvents: {
    panelOpen: boolean;
    panelClose: boolean;
    messageSent: boolean;
    messageReceived: boolean;
    fileUploaded: boolean;
    voiceUsed: boolean;
    triggerFired: boolean;
    discountShown: boolean;
    discountCopied: boolean;
  };

  // Integrations
  integrations: {
    // Shopify Analytics (automatic)
    shopify: boolean;

    // Google Analytics 4
    ga4: {
      enabled: boolean;
      measurementId?: string;  // Falls back to store's GA
    };

    // Meta Pixel
    metaPixel: {
      enabled: boolean;
      pixelId?: string;        // Falls back to store's Pixel
    };

    // Custom webhook for your own analytics
    customWebhook: {
      enabled: boolean;
      url: string;
      headers?: Record<string, string>;
    };
  };

  // Conversion goals
  goals: {
    lead: {
      enabled: boolean;
      condition: 'email_captured' | 'phone_captured' | 'custom';
    };
    engagement: {
      enabled: boolean;
      minMessages: number;     // Default: 3
    };
    conversion: {
      enabled: boolean;
      trackAddToCart: boolean;
      trackCheckout: boolean;
    };
  };
}
```

### Automatic Event Tracking

```typescript
// Events automatically tracked
const analyticsEvents = {
  // Chat events
  'flowchat_open': { category: 'engagement', action: 'open' },
  'flowchat_close': { category: 'engagement', action: 'close' },
  'flowchat_message_sent': { category: 'engagement', action: 'message' },
  'flowchat_first_interaction': { category: 'engagement', action: 'first_message' },

  // Trigger events
  'flowchat_exit_intent_triggered': { category: 'proactive', action: 'exit_intent' },
  'flowchat_scroll_triggered': { category: 'proactive', action: 'scroll' },
  'flowchat_idle_triggered': { category: 'proactive', action: 'idle' },

  // Conversion events
  'flowchat_lead_captured': { category: 'conversion', action: 'lead' },
  'flowchat_discount_shown': { category: 'conversion', action: 'discount_shown' },
  'flowchat_discount_copied': { category: 'conversion', action: 'discount_copied' },

  // Feature usage
  'flowchat_voice_used': { category: 'feature', action: 'voice' },
  'flowchat_file_uploaded': { category: 'feature', action: 'file' },
};

// GA4 integration
function trackGA4(event: string, params: Record<string, unknown>) {
  if (typeof gtag !== 'undefined') {
    gtag('event', event, {
      event_category: params.category,
      event_label: params.action,
      ...params.data
    });
  }
}

// Meta Pixel integration
function trackMetaPixel(event: string, params: Record<string, unknown>) {
  if (typeof fbq !== 'undefined') {
    if (event === 'flowchat_lead_captured') {
      fbq('track', 'Lead', { content_name: 'n8n Chat' });
    } else if (event === 'flowchat_first_interaction') {
      fbq('track', 'Contact', { content_name: 'n8n Chat' });
    } else {
      fbq('trackCustom', event, params);
    }
  }
}

// Shopify Analytics integration
function trackShopifyAnalytics(event: string, params: Record<string, unknown>) {
  if (typeof window.ShopifyAnalytics !== 'undefined') {
    window.ShopifyAnalytics.lib.track(event, params);
  }
}
```

---

## 8. Internationalization

### 8.1 Language Support

n8n Chat supports **50+ languages** with:

- **UI string translations** - All interface text
- **RTL layout support** - Arabic, Hebrew, Persian, Urdu
- **Auto-detection** - From Shopify locale
- **Manual override** - Per-instance configuration

### 8.2 Translation Structure

```typescript
interface Translations {
  // Widget UI
  widget: {
    openChat: string;      // "Chat with us"
    closeChat: string;     // "Close"
    minimize: string;      // "Minimize"
  };

  // Composer
  composer: {
    placeholder: string;   // "Type a message..."
    send: string;          // "Send"
    cancel: string;        // "Stop generating"
    voiceInput: string;    // "Voice input"
    attachFile: string;    // "Attach file"
  };

  // Messages
  messages: {
    copy: string;          // "Copy"
    copied: string;        // "Copied!"
    regenerate: string;    // "Regenerate"
    thumbsUp: string;      // "Helpful"
    thumbsDown: string;    // "Not helpful"
  };

  // Status
  status: {
    typing: string;        // "Typing..."
    online: string;        // "Online"
    offline: string;       // "Offline"
    connecting: string;    // "Connecting..."
  };

  // Errors
  errors: {
    connectionFailed: string;
    messageFailed: string;
    fileTooLarge: string;
    fileTypeNotSupported: string;
    microphonePermission: string;
    networkError: string;
    retry: string;
  };

  // Accessibility
  a11y: {
    chatDialog: string;    // "Chat dialog"
    newMessage: string;    // "New message"
    messageFrom: string;   // "Message from"
    pressEnterToSend: string;
  };
}

// Example translations
const translations: Record<string, Translations> = {
  en: {
    widget: {
      openChat: 'Chat with us',
      closeChat: 'Close',
      minimize: 'Minimize',
    },
    // ...
  },
  es: {
    widget: {
      openChat: 'Chatea con nosotros',
      closeChat: 'Cerrar',
      minimize: 'Minimizar',
    },
    // ...
  },
  ar: {
    widget: {
      openChat: 'تحدث معنا',
      closeChat: 'إغلاق',
      minimize: 'تصغير',
    },
    // ...
  },
  // 47+ more languages...
};
```

### 8.3 RTL Support

```css
/* RTL Layout */
[dir="rtl"] .fc-message-user {
  flex-direction: row;
}

[dir="rtl"] .fc-message-assistant {
  flex-direction: row-reverse;
}

[dir="rtl"] .fc-bubble-trigger[data-position="bottom-right"] {
  right: auto;
  left: var(--fc-offset-x);
}

[dir="rtl"] .fc-bubble-trigger[data-position="bottom-left"] {
  left: auto;
  right: var(--fc-offset-x);
}

[dir="rtl"] .fc-composer {
  flex-direction: row-reverse;
}

[dir="rtl"] .fc-message-bubble {
  text-align: right;
}

[dir="rtl"] .fc-message-user .fc-message-bubble {
  border-radius: 20px 20px 20px 4px;
}

[dir="rtl"] .fc-message-assistant .fc-message-bubble {
  border-radius: 20px 20px 4px 20px;
}
```

### 8.4 Language Auto-Detection

```typescript
function detectLanguage(): string {
  // 1. Check Shopify locale
  const shopifyLocale = window.Shopify?.locale;
  if (shopifyLocale) return shopifyLocale;

  // 2. Check HTML lang attribute
  const htmlLang = document.documentElement.lang;
  if (htmlLang) return htmlLang.split('-')[0];

  // 3. Check browser preference
  const browserLang = navigator.language;
  if (browserLang) return browserLang.split('-')[0];

  // 4. Default to English
  return 'en';
}

// Determine if RTL
function isRTL(language: string): boolean {
  const rtlLanguages = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi'];
  return rtlLanguages.includes(language);
}
```

---

## 9. Accessibility

### 9.1 WCAG 2.2 AA Compliance

n8n Chat achieves **100% WCAG 2.2 AA compliance**:

| Criteria | Implementation |
|----------|---------------|
| **Color Contrast** | 4.5:1 minimum for text, 3:1 for large text |
| **Focus Visible** | Custom focus rings, never `outline: none` |
| **Keyboard Navigation** | Full Tab navigation, Escape closes |
| **Screen Reader** | ARIA labels, live regions, landmarks |
| **Touch Targets** | 44x44px minimum on mobile |
| **Reduced Motion** | Respects `prefers-reduced-motion` |
| **Text Scaling** | Supports up to 200% zoom |

### 9.2 ARIA Implementation

```tsx
// Chat Panel
<div
  role="dialog"
  aria-modal="true"
  aria-label={t('a11y.chatDialog')}
  aria-describedby="fc-welcome-message"
>
  {/* Header */}
  <header role="banner">
    <h2 id="fc-chat-title">{title}</h2>
    <button
      aria-label={t('widget.closeChat')}
      onClick={onClose}
    >
      <XIcon aria-hidden="true" />
    </button>
  </header>

  {/* Messages */}
  <main
    role="log"
    aria-live="polite"
    aria-atomic="false"
    aria-relevant="additions"
  >
    {messages.map(msg => (
      <article
        key={msg.id}
        aria-label={`${t('a11y.messageFrom')} ${msg.role}`}
      >
        <p>{msg.content}</p>
        <time dateTime={msg.timestamp}>
          {formatTime(msg.timestamp)}
        </time>
      </article>
    ))}
  </main>

  {/* Composer */}
  <footer>
    <label htmlFor="fc-input" className="sr-only">
      {t('composer.placeholder')}
    </label>
    <textarea
      id="fc-input"
      aria-label={t('composer.placeholder')}
      aria-describedby="fc-input-hint"
    />
    <span id="fc-input-hint" className="sr-only">
      {t('a11y.pressEnterToSend')}
    </span>
    <button
      type="submit"
      aria-label={t('composer.send')}
    >
      <SendIcon aria-hidden="true" />
    </button>
  </footer>
</div>
```

### 9.3 Keyboard Navigation

```typescript
function useKeyboardNavigation() {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Global shortcuts
      if (e.key === 'Escape') {
        closePanel();
        return;
      }

      // Ctrl/Cmd + K to toggle chat
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        togglePanel();
        return;
      }

      // Tab trapping when panel is open
      if (e.key === 'Tab' && isPanelOpen) {
        trapFocus(e);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
}

function trapFocus(e: KeyboardEvent) {
  const focusableElements = panel.querySelectorAll(
    'button, [href], input, textarea, [tabindex]:not([tabindex="-1"])'
  );

  const first = focusableElements[0] as HTMLElement;
  const last = focusableElements[focusableElements.length - 1] as HTMLElement;

  if (e.shiftKey && document.activeElement === first) {
    e.preventDefault();
    last.focus();
  } else if (!e.shiftKey && document.activeElement === last) {
    e.preventDefault();
    first.focus();
  }
}
```

### 9.4 Reduced Motion

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }

  .fc-bubble-trigger {
    animation: none;
  }

  .fc-chat-panel {
    animation: none;
    opacity: 1;
    transform: none;
  }

  .fc-message {
    animation: none;
  }
}
```

---

## 10. Performance

### 10.1 Performance Targets

| Metric | Target | Maximum |
|--------|--------|---------|
| **Widget Load (LCP)** | <400ms | <600ms |
| **Time to Interactive** | <800ms | <1200ms |
| **Bundle Size (gzip)** | <50KB | <80KB |
| **TTFT** | <300ms | <500ms |
| **Lighthouse Impact** | <1 point | <2 points |
| **Memory Usage** | <25MB | <40MB |
| **CPU (idle)** | <1% | <2% |

### 10.2 Optimization Strategies

#### Code Splitting
```typescript
// Lazy load full widget on first interaction
const ChatPanel = lazy(() => import('./ChatPanel'));

function N8nChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <BubbleTrigger onClick={() => setIsOpen(true)} />

      {isOpen && (
        <Suspense fallback={<LoadingPanel />}>
          <ChatPanel />
        </Suspense>
      )}
    </>
  );
}
```

#### Bundle Analysis
```
flowchat-widget.js (gzipped)
├── react + react-dom: ~42KB
├── @assistant-ui/react: ~25KB
├── lucide-react (tree-shaken): ~8KB
├── n8n Chat components: ~12KB
└── Total: ~87KB
```

#### Runtime Optimizations
- **Intersection Observer** for visibility detection
- **requestIdleCallback** for non-critical updates
- **Event delegation** for message interactions
- **Virtual scrolling** for long conversations (>100 messages)
- **Debounced resize handling**

### 10.3 Loading Strategy

```typescript
// 1. Critical: Bubble trigger loads immediately
<script async src="flowchat-bubble.js"></script>

// 2. Deferred: Full widget loads on interaction
function onBubbleClick() {
  import('./flowchat-widget.js').then(({ init }) => {
    init(config);
  });
}

// 3. Prefetch hint for faster subsequent loads
<link rel="prefetch" href="flowchat-widget.js" />
```

---

## 11. n8n Integration

### 11.1 Request Format

```typescript
interface N8nChatRequest {
  // Required
  action: 'sendMessage' | 'loadPreviousSession';
  sessionId: string;

  // Message content
  chatInput?: string;

  // Attachments
  attachments?: Array<{
    type: 'image' | 'file';
    filename: string;
    mimeType: string;
    data: string;  // Base64 encoded
  }>;

  // Full Shopify context
  context: N8nChatContext;

  // Widget metadata
  metadata: {
    widgetVersion: string;
    instanceId: string;
    locale: string;
    userAgent: string;
    referrer: string;
  };
}
```

### 11.2 Response Formats

#### Streaming (SSE) - Recommended
```
HTTP/1.1 200 OK
Content-Type: text/event-stream
Cache-Control: no-cache
Connection: keep-alive

data: {"output":"Hello"}
data: {"output":"Hello there"}
data: {"output":"Hello there! How"}
data: {"output":"Hello there! How can I help"}
data: {"output":"Hello there! How can I help you today?"}
data: [DONE]
```

#### Non-Streaming (JSON)
```json
{
  "output": "Hello there! How can I help you today?",
  "sessionId": "optional-new-session-id"
}
```

#### Load Previous Session
```json
{
  "messages": [
    { "role": "user", "content": "What's in my cart?" },
    { "role": "assistant", "content": "You have 2 items in your cart..." }
  ]
}
```

### 11.3 n8n Workflow Template

```json
{
  "name": "n8n Chat AI Assistant",
  "nodes": [
    {
      "name": "Webhook",
      "type": "n8n-nodes-base.webhook",
      "position": [100, 300],
      "parameters": {
        "path": "flowchat",
        "httpMethod": "POST",
        "responseMode": "responseNode",
        "options": {
          "responseHeaders": {
            "entries": [
              { "name": "Access-Control-Allow-Origin", "value": "*" },
              { "name": "Access-Control-Allow-Headers", "value": "Content-Type, Accept" }
            ]
          }
        }
      }
    },
    {
      "name": "Route by Action",
      "type": "n8n-nodes-base.switch",
      "position": [300, 300],
      "parameters": {
        "dataType": "string",
        "value1": "={{ $json.action }}",
        "rules": [
          { "operation": "equals", "value2": "sendMessage", "output": 0 },
          { "operation": "equals", "value2": "loadPreviousSession", "output": 1 }
        ]
      }
    },
    {
      "name": "Postgres Memory",
      "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat",
      "position": [500, 250],
      "parameters": {
        "sessionId": "={{ $json.sessionId }}",
        "tableName": "flowchat_messages"
      }
    },
    {
      "name": "AI Agent",
      "type": "@n8n/n8n-nodes-langchain.agent",
      "position": [700, 250],
      "parameters": {
        "agent": "conversationalAgent",
        "text": "={{ $json.chatInput }}",
        "options": {
          "systemMessage": "={{ $json.systemPrompt || 'You are a helpful shopping assistant.' }}"
        }
      }
    },
    {
      "name": "Respond SSE",
      "type": "n8n-nodes-base.respondToWebhook",
      "position": [900, 250],
      "parameters": {
        "respondWith": "text",
        "options": {
          "responseHeaders": {
            "entries": [
              { "name": "Content-Type", "value": "text/event-stream" }
            ]
          }
        }
      }
    }
  ],
  "connections": {
    "Webhook": { "main": [[{ "node": "Route by Action", "index": 0 }]] },
    "Route by Action": {
      "main": [
        [{ "node": "Postgres Memory", "index": 0 }],
        [{ "node": "Load History", "index": 0 }]
      ]
    },
    "Postgres Memory": { "main": [[{ "node": "AI Agent", "index": 0 }]] },
    "AI Agent": { "main": [[{ "node": "Respond SSE", "index": 0 }]] }
  }
}
```

### 11.4 CORS Configuration

Enable CORS in n8n webhook node:

```javascript
// n8n Webhook response headers
{
  "Access-Control-Allow-Origin": "*",  // Or specific domain
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Accept",
  "Access-Control-Max-Age": "86400"
}
```

---

## 12. Theme Editor Configuration

### 12.1 Block Schema

```liquid
{% schema %}
{
  "name": "n8n Chat Widget",
  "target": "body",
  "stylesheet": "flowchat-widget.css",
  "javascript": "flowchat-widget.js",
  "settings": [
    {
      "type": "header",
      "content": "🔗 Connection"
    },
    {
      "type": "text",
      "id": "webhook_url",
      "label": "n8n Webhook URL",
      "info": "Your n8n chat webhook endpoint (e.g., https://n8n.example.com/webhook/chat)"
    },
    {
      "type": "checkbox",
      "id": "enabled",
      "label": "Enable chat widget",
      "default": true
    },
    {
      "type": "header",
      "content": "💬 Chat Content"
    },
    {
      "type": "text",
      "id": "chat_title",
      "label": "Chat title",
      "default": "Chat with us"
    },
    {
      "type": "textarea",
      "id": "welcome_message",
      "label": "Welcome message",
      "default": "👋 Hi there! How can I help you today?"
    },
    {
      "type": "text",
      "id": "placeholder_text",
      "label": "Input placeholder",
      "default": "Type a message..."
    },
    {
      "type": "textarea",
      "id": "suggested_prompts",
      "label": "Suggested prompts (one per line)",
      "default": "What products do you recommend?\nHelp me find the right size\nTrack my order\nReturns and exchanges",
      "info": "Up to 4 prompts shown to new visitors"
    },
    {
      "type": "header",
      "content": "🎨 Appearance"
    },
    {
      "type": "select",
      "id": "position",
      "label": "Widget position",
      "options": [
        { "value": "bottom-right", "label": "Bottom Right" },
        { "value": "bottom-left", "label": "Bottom Left" }
      ],
      "default": "bottom-right"
    },
    {
      "type": "color",
      "id": "primary_color",
      "label": "Primary color",
      "default": "#3b82f6"
    },
    {
      "type": "select",
      "id": "theme",
      "label": "Color theme",
      "options": [
        { "value": "light", "label": "Light" },
        { "value": "dark", "label": "Dark" },
        { "value": "auto", "label": "Auto (follows system)" }
      ],
      "default": "auto"
    },
    {
      "type": "range",
      "id": "bubble_size",
      "label": "Bubble size",
      "min": 48,
      "max": 72,
      "step": 4,
      "default": 60,
      "unit": "px"
    },
    {
      "type": "select",
      "id": "bubble_icon",
      "label": "Bubble icon",
      "options": [
        { "value": "chat", "label": "💬 Chat bubble" },
        { "value": "message", "label": "✉️ Message" },
        { "value": "help", "label": "❓ Help" },
        { "value": "sparkle", "label": "✨ Sparkle (AI)" }
      ],
      "default": "sparkle"
    },
    {
      "type": "checkbox",
      "id": "bubble_pulse",
      "label": "Pulse animation on bubble",
      "default": true,
      "info": "Subtle animation to attract attention"
    },
    {
      "type": "header",
      "content": "📊 Context Settings"
    },
    {
      "type": "checkbox",
      "id": "send_customer_info",
      "label": "Send customer information",
      "info": "Include email, name, tags, order count (logged in only)",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "send_cart_contents",
      "label": "Send cart contents",
      "info": "Include items in cart, totals, and discounts",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "send_product_details",
      "label": "Send product details",
      "info": "Include current product on product pages",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "send_order_history",
      "label": "Send recent orders",
      "info": "Include customer's last 5 orders (logged in only)",
      "default": false
    },
    {
      "type": "header",
      "content": "⚡ Auto-Open Triggers"
    },
    {
      "type": "checkbox",
      "id": "auto_open_delay",
      "label": "Open after delay",
      "default": false
    },
    {
      "type": "range",
      "id": "auto_open_delay_seconds",
      "label": "Delay (seconds)",
      "min": 5,
      "max": 120,
      "step": 5,
      "default": 30,
      "unit": "sec"
    },
    {
      "type": "checkbox",
      "id": "auto_open_exit_intent",
      "label": "Open on exit intent",
      "info": "Shows when visitor moves to leave (desktop only)",
      "default": false
    },
    {
      "type": "checkbox",
      "id": "auto_open_scroll",
      "label": "Open on scroll",
      "default": false
    },
    {
      "type": "range",
      "id": "auto_open_scroll_percent",
      "label": "Scroll percentage",
      "min": 25,
      "max": 100,
      "step": 25,
      "default": 50,
      "unit": "%"
    },
    {
      "type": "select",
      "id": "auto_open_frequency",
      "label": "Auto-open frequency",
      "options": [
        { "value": "once_per_session", "label": "Once per session" },
        { "value": "once_per_day", "label": "Once per day" },
        { "value": "always", "label": "Every page" }
      ],
      "default": "once_per_session"
    },
    {
      "type": "header",
      "content": "🔧 Advanced"
    },
    {
      "type": "checkbox",
      "id": "show_on_mobile",
      "label": "Show on mobile devices",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "enable_voice",
      "label": "Enable voice input",
      "info": "Allow speech-to-text (requires n8n Whisper integration)",
      "default": true
    },
    {
      "type": "checkbox",
      "id": "enable_file_upload",
      "label": "Enable file upload",
      "info": "Allow image and document uploads",
      "default": true
    },
    {
      "type": "select",
      "id": "language",
      "label": "Widget language",
      "options": [
        { "value": "auto", "label": "Auto-detect" },
        { "value": "en", "label": "English" },
        { "value": "es", "label": "Español" },
        { "value": "fr", "label": "Français" },
        { "value": "de", "label": "Deutsch" },
        { "value": "it", "label": "Italiano" },
        { "value": "pt", "label": "Português" },
        { "value": "nl", "label": "Nederlands" },
        { "value": "ja", "label": "日本語" },
        { "value": "zh", "label": "中文" },
        { "value": "ko", "label": "한국어" },
        { "value": "ar", "label": "العربية" }
      ],
      "default": "auto"
    }
  ]
}
{% endschema %}
```

### 12.2 Liquid Context Injection

```liquid
{% comment %}
  n8n Chat Widget - Theme App Extension
  Injects rich Shopify context into the widget
{% endcomment %}

{% if block.settings.enabled and block.settings.webhook_url != blank %}
  <div
    id="flowchat-widget"
    data-config='{{ block.settings | json | escape }}'
    data-context='{
      "shop": {
        "name": {{ shop.name | json }},
        "domain": {{ shop.domain | json }},
        "permanent_domain": {{ shop.permanent_domain | json }},
        "email": {{ shop.email | json }},
        "currency": {{ shop.currency | json }},
        "money_format": {{ shop.money_format | json }}
      },
      "customer": {% if customer %}
        {
          "logged_in": true,
          "id": {{ customer.id | json }},
          "email": {{ customer.email | json }},
          "first_name": {{ customer.first_name | json }},
          "last_name": {{ customer.last_name | json }},
          "name": {{ customer.name | json }},
          "phone": {{ customer.phone | json }},
          "tags": {{ customer.tags | json }},
          "accepts_marketing": {{ customer.accepts_marketing | json }},
          "orders_count": {{ customer.orders_count | json }},
          "total_spent": {{ customer.total_spent | money_without_currency | json }}
          {% if block.settings.send_order_history %}
          ,"recent_orders": [
            {% for order in customer.orders limit: 5 %}
              {
                "id": {{ order.id | json }},
                "name": {{ order.name | json }},
                "total_price": {{ order.total_price | money_without_currency | json }},
                "created_at": {{ order.created_at | date: "%Y-%m-%dT%H:%M:%SZ" | json }},
                "fulfillment_status": {{ order.fulfillment_status | json }},
                "financial_status": {{ order.financial_status | json }}
              }{% unless forloop.last %},{% endunless %}
            {% endfor %}
          ]
          {% endif %}
          {% if customer.default_address %}
          ,"default_address": {
            "city": {{ customer.default_address.city | json }},
            "province": {{ customer.default_address.province | json }},
            "country": {{ customer.default_address.country | json }},
            "zip": {{ customer.default_address.zip | json }}
          }
          {% endif %}
        }
      {% else %}
        { "logged_in": false }
      {% endif %},
      "page": {
        "type": {{ template.name | json }},
        "url": {{ request.path | json }},
        "full_url": {{ request.origin | append: request.path | json }},
        "title": {{ page_title | json }}
      },
      {% if product and block.settings.send_product_details %}
      "product": {
        "id": {{ product.id | json }},
        "title": {{ product.title | json }},
        "handle": {{ product.handle | json }},
        "description": {{ product.description | strip_html | truncate: 500 | json }},
        "vendor": {{ product.vendor | json }},
        "type": {{ product.type | json }},
        "tags": {{ product.tags | json }},
        "price": {{ product.price | money_without_currency | json }},
        "price_min": {{ product.price_min | money_without_currency | json }},
        "price_max": {{ product.price_max | money_without_currency | json }},
        "compare_at_price": {{ product.compare_at_price | money_without_currency | json }},
        "available": {{ product.available | json }},
        "url": {{ product.url | json }},
        "featured_image": {{ product.featured_image | image_url: width: 400 | json }},
        "variants_count": {{ product.variants.size | json }},
        "options": {{ product.options_with_values | json }}
      },
      {% else %}
      "product": null,
      {% endif %}
      {% if collection %}
      "collection": {
        "id": {{ collection.id | json }},
        "title": {{ collection.title | json }},
        "handle": {{ collection.handle | json }},
        "description": {{ collection.description | strip_html | truncate: 300 | json }},
        "products_count": {{ collection.products_count | json }},
        "url": {{ collection.url | json }}
      },
      {% else %}
      "collection": null,
      {% endif %}
      "locale": {
        "language": {{ request.locale.iso_code | json }},
        "country": {{ localization.country.iso_code | json }},
        "currency": {{ cart.currency.iso_code | json }}
      }
    }'
  ></div>

  {{ 'flowchat-widget.css' | asset_url | stylesheet_tag }}
  <script src="{{ 'flowchat-widget.js' | asset_url }}" defer></script>
{% endif %}
```

---

## 13. Technical Implementation

### 13.1 shadcn/ui + Assistant UI Architecture

> **Premium UI powered by shadcn/ui and the official Assistant UI integration**

n8n Chat uses the **official shadcn/ui + Assistant UI integration**, providing:

- **Pre-built, polished components** - Production-ready chat UI
- **Radix UI primitives** - Accessible, unstyled components
- **Tailwind CSS** - Utility-first styling
- **CSS variables theming** - Easy customization
- **Dark mode built-in** - Automatic theme switching
- **Framer Motion animations** - Smooth micro-interactions

```
┌─────────────────────────────────────────────────────────────────┐
│                    COMPONENT ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   shadcn/ui (Radix + Tailwind)                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  Button, Tooltip, Dialog, Avatar, Card, ScrollArea, etc  │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│   @assistant-ui/react (Y Combinator W25)                        │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  ThreadPrimitive, MessagePrimitive, ComposerPrimitive    │  │
│   │  ActionBarPrimitive, BranchPickerPrimitive               │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│   shadcn-assistant-ui (Official Integration)                    │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  Thread, AssistantMessage, UserMessage, Composer         │  │
│   │  ThreadWelcome, AssistantActionBar, BranchPicker         │  │
│   └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│   n8n Chat Custom Components                                    │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │  N8nChatWidget, BubbleTrigger, ChatPanel, VoiceInput    │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 13.2 Project Structure

```
flowchat-shopify/
├── extensions/
│   └── flowchat-widget/
│       ├── assets/
│       │   ├── flowchat-widget.js     # Built React bundle
│       │   └── flowchat-widget.css    # Built Tailwind styles
│       ├── blocks/
│       │   └── flowchat-embed.liquid  # App Embed template
│       └── shopify.extension.toml
├── src/
│   ├── components/
│   │   │
│   │   │  # ═══════════════════════════════════════════════════
│   │   │  # shadcn/ui Base Components
│   │   │  # ═══════════════════════════════════════════════════
│   │   ├── ui/
│   │   │   ├── avatar.tsx             # Radix Avatar
│   │   │   ├── button.tsx             # Radix Button + variants
│   │   │   ├── card.tsx               # Card container
│   │   │   ├── dialog.tsx             # Radix Dialog
│   │   │   ├── scroll-area.tsx        # Radix ScrollArea
│   │   │   ├── separator.tsx          # Visual separator
│   │   │   ├── textarea.tsx           # Auto-resize textarea
│   │   │   ├── tooltip.tsx            # Radix Tooltip
│   │   │   └── progress.tsx           # Progress bar
│   │   │
│   │   │  # ═══════════════════════════════════════════════════
│   │   │  # shadcn + Assistant UI Integration
│   │   │  # ═══════════════════════════════════════════════════
│   │   ├── assistant-ui/
│   │   │   ├── thread.tsx             # Thread container + viewport
│   │   │   ├── thread-welcome.tsx     # Welcome screen + suggestions
│   │   │   ├── user-message.tsx       # User message bubble
│   │   │   ├── assistant-message.tsx  # AI message + actions
│   │   │   ├── composer.tsx           # Input + send/cancel/voice
│   │   │   ├── assistant-action-bar.tsx  # Copy, regenerate, etc
│   │   │   ├── branch-picker.tsx      # Navigate regenerations
│   │   │   └── markdown-text.tsx      # Rich text rendering
│   │   │
│   │   │  # ═══════════════════════════════════════════════════
│   │   │  # n8n Chat Custom Components
│   │   │  # ═══════════════════════════════════════════════════
│   │   ├── flowchat/
│   │   │   ├── N8nChatWidget.tsx     # Main widget + runtime
│   │   │   ├── BubbleTrigger.tsx      # Floating button + badge
│   │   │   ├── ChatPanel.tsx          # Panel container
│   │   │   ├── ChatHeader.tsx         # Header with close
│   │   │   ├── VoiceInput.tsx         # Voice recording + waveform
│   │   │   ├── FileUpload.tsx         # Drag-drop + preview
│   │   │   └── TypingIndicator.tsx    # Animated dots
│   │   │
│   │   └── index.ts                   # Component exports
│   │
│   ├── lib/
│   │   ├── n8nChatModelAdapter.ts     # ChatModelAdapter for n8n
│   │   ├── contextBuilder.ts          # Shopify context builder
│   │   ├── sessionManager.ts          # localStorage session
│   │   ├── autoOpenTriggers.ts        # Proactive engagement
│   │   ├── utils.ts                   # cn() helper, etc
│   │   └── index.ts
│   │
│   ├── hooks/
│   │   ├── useVoiceInput.ts           # Web Speech API
│   │   ├── useFileUpload.ts           # Drag-drop + validation
│   │   ├── useAutoOpen.ts             # Trigger logic
│   │   └── useI18n.ts                 # Translations
│   │
│   ├── i18n/
│   │   ├── en.json
│   │   ├── es.json
│   │   └── ... (50+ languages)
│   │
│   ├── styles/
│   │   └── globals.css                # Tailwind + CSS variables
│   │
│   ├── types/
│   │   └── index.ts
│   │
│   └── index.tsx                      # Entry point
│
├── components.json                     # shadcn/ui configuration
├── tailwind.config.ts                  # Tailwind configuration
├── postcss.config.js                   # PostCSS for Tailwind
├── package.json
├── shopify.app.toml
├── tsconfig.json
├── vite.config.ts
└── README.md
```

### 13.3 Package Dependencies

```json
{
  "name": "flowchat-shopify",
  "version": "5.0.0",
  "private": true,
  "scripts": {
    "dev": "vite",
    "build:widget": "vite build",
    "deploy": "shopify app deploy",
    "typecheck": "tsc --noEmit",
    "lint": "eslint src"
  },
  "dependencies": {
    "@assistant-ui/react": "^0.11.0",
    "@radix-ui/react-avatar": "^1.1.0",
    "@radix-ui/react-dialog": "^1.1.0",
    "@radix-ui/react-progress": "^1.1.0",
    "@radix-ui/react-scroll-area": "^1.2.0",
    "@radix-ui/react-separator": "^1.1.0",
    "@radix-ui/react-slot": "^1.1.0",
    "@radix-ui/react-tooltip": "^1.1.0",
    "class-variance-authority": "^0.7.0",
    "clsx": "^2.1.0",
    "lucide-react": "^0.468.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-markdown": "^9.0.0",
    "remark-gfm": "^4.0.0",
    "tailwind-merge": "^2.5.0",
    "uuid": "^10.0.0"
  },
  "devDependencies": {
    "@shopify/cli": "^3.70.0",
    "@types/node": "^22.0.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^9.0.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "tailwindcss-animate": "^1.0.7",
    "typescript": "^5.6.0",
    "vite": "^5.4.0"
  }
}
```

### 13.4 shadcn/ui Configuration

```json
// components.json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.ts",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": "fc-"
  },
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  },
  "iconLibrary": "lucide"
}
```

### 13.5 Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: ['./src/**/*.{ts,tsx}'],
  prefix: 'fc-',  // Prefix all classes to avoid conflicts
  theme: {
    extend: {
      colors: {
        // Map to CSS variables for dynamic theming
        border: 'hsl(var(--fc-border))',
        background: 'hsl(var(--fc-background))',
        foreground: 'hsl(var(--fc-foreground))',
        primary: {
          DEFAULT: 'hsl(var(--fc-primary))',
          foreground: 'hsl(var(--fc-primary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--fc-muted))',
          foreground: 'hsl(var(--fc-muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--fc-accent))',
          foreground: 'hsl(var(--fc-accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--fc-destructive))',
          foreground: 'hsl(var(--fc-destructive-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--fc-radius)',
        md: 'calc(var(--fc-radius) - 2px)',
        sm: 'calc(var(--fc-radius) - 4px)',
      },
      keyframes: {
        'fc-slide-up': {
          from: { opacity: '0', transform: 'translateY(20px) scale(0.95)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'fc-slide-down': {
          from: { opacity: '1', transform: 'translateY(0) scale(1)' },
          to: { opacity: '0', transform: 'translateY(10px) scale(0.98)' },
        },
        'fc-pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.4' },
          '100%': { transform: 'scale(1.5)', opacity: '0' },
        },
        'fc-typing-dot': {
          '0%, 60%, 100%': { opacity: '0.3', transform: 'translateY(0)' },
          '30%': { opacity: '1', transform: 'translateY(-4px)' },
        },
        'fc-voice-pulse': {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.1)', opacity: '0.8' },
        },
      },
      animation: {
        'fc-slide-up': 'fc-slide-up 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'fc-slide-down': 'fc-slide-down 0.2s ease-in forwards',
        'fc-pulse-ring': 'fc-pulse-ring 2s ease-out infinite',
        'fc-typing-dot': 'fc-typing-dot 1.4s infinite',
        'fc-voice-pulse': 'fc-voice-pulse 1s infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;
```

### 13.6 Global CSS Variables

```css
/* src/styles/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    /* ═══════════════════════════════════════════════════════════════
       n8n Chat Design Tokens - Light Theme
       ═══════════════════════════════════════════════════════════════ */
    --fc-background: 0 0% 100%;
    --fc-foreground: 222.2 84% 4.9%;

    --fc-muted: 210 40% 96.1%;
    --fc-muted-foreground: 215.4 16.3% 46.9%;

    --fc-border: 214.3 31.8% 91.4%;
    --fc-input: 214.3 31.8% 91.4%;

    --fc-primary: 221.2 83.2% 53.3%;
    --fc-primary-foreground: 210 40% 98%;

    --fc-accent: 210 40% 96.1%;
    --fc-accent-foreground: 222.2 84% 4.9%;

    --fc-destructive: 0 84.2% 60.2%;
    --fc-destructive-foreground: 210 40% 98%;

    --fc-ring: 221.2 83.2% 53.3%;
    --fc-radius: 0.75rem;

    /* Message bubbles */
    --fc-user-bubble: var(--fc-primary);
    --fc-user-bubble-foreground: var(--fc-primary-foreground);
    --fc-assistant-bubble: var(--fc-muted);
    --fc-assistant-bubble-foreground: var(--fc-foreground);

    /* Glassmorphism */
    --fc-glass-background: rgba(255, 255, 255, 0.85);
    --fc-glass-border: rgba(255, 255, 255, 0.2);
    --fc-backdrop-blur: blur(20px);
  }

  [data-theme="dark"] {
    --fc-background: 222.2 84% 4.9%;
    --fc-foreground: 210 40% 98%;

    --fc-muted: 217.2 32.6% 17.5%;
    --fc-muted-foreground: 215 20.2% 65.1%;

    --fc-border: 217.2 32.6% 17.5%;
    --fc-input: 217.2 32.6% 17.5%;

    --fc-primary: 217.2 91.2% 59.8%;
    --fc-primary-foreground: 222.2 84% 4.9%;

    --fc-accent: 217.2 32.6% 17.5%;
    --fc-accent-foreground: 210 40% 98%;

    --fc-destructive: 0 62.8% 30.6%;
    --fc-destructive-foreground: 210 40% 98%;

    /* Glassmorphism - Dark */
    --fc-glass-background: rgba(15, 23, 42, 0.85);
    --fc-glass-border: rgba(255, 255, 255, 0.1);
  }
}

@layer base {
  * {
    @apply fc-border-border;
  }

  body {
    @apply fc-bg-background fc-text-foreground;
  }
}
```

### 13.7 Vite Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'extensions/flowchat-widget/assets',
    emptyOutDir: true,
    lib: {
      entry: resolve(__dirname, 'src/index.tsx'),
      name: 'n8n Chat',
      formats: ['iife'],
      fileName: () => 'flowchat-widget.js',
    },
    rollupOptions: {
      output: {
        assetFileNames: 'flowchat-widget.[ext]',
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,  // Bundle all CSS together
    minify: 'esbuild',
    sourcemap: false,
    target: 'es2020',
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
});
```

### 13.8 shadcn + Assistant UI Component Examples

#### Thread Component (shadcn integration)

```tsx
// src/components/assistant-ui/thread.tsx
import { forwardRef } from 'react';
import { ThreadPrimitive } from '@assistant-ui/react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ThreadWelcome } from './thread-welcome';
import { UserMessage } from './user-message';
import { AssistantMessage } from './assistant-message';
import { Composer } from './composer';

export const Thread = forwardRef<HTMLDivElement, { className?: string }>(
  ({ className }, ref) => {
    return (
      <ThreadPrimitive.Root
        ref={ref}
        className={cn(
          'fc-flex fc-flex-col fc-h-full fc-bg-background',
          className
        )}
      >
        {/* Empty state */}
        <ThreadPrimitive.Empty>
          <ThreadWelcome />
        </ThreadPrimitive.Empty>

        {/* Messages viewport with auto-scroll */}
        <ThreadPrimitive.Viewport asChild>
          <ScrollArea className="fc-flex-1">
            <ThreadPrimitive.Messages
              components={{
                UserMessage,
                AssistantMessage,
              }}
            />
          </ScrollArea>
        </ThreadPrimitive.Viewport>

        {/* Composer */}
        <Composer />
      </ThreadPrimitive.Root>
    );
  }
);
Thread.displayName = 'Thread';
```

#### User Message Component

```tsx
// src/components/assistant-ui/user-message.tsx
import { MessagePrimitive } from '@assistant-ui/react';
import { cn } from '@/lib/utils';

export function UserMessage() {
  return (
    <MessagePrimitive.Root className="fc-flex fc-flex-row-reverse fc-gap-3 fc-max-w-[85%] fc-ml-auto fc-mb-4">
      <div className="fc-flex fc-flex-col fc-items-end fc-gap-1">
        <div
          className={cn(
            'fc-px-4 fc-py-2.5 fc-rounded-2xl fc-rounded-br-sm',
            'fc-bg-primary fc-text-primary-foreground',
            'fc-text-sm fc-leading-relaxed'
          )}
        >
          <MessagePrimitive.Content />
        </div>
      </div>
    </MessagePrimitive.Root>
  );
}
```

#### Assistant Message Component

```tsx
// src/components/assistant-ui/assistant-message.tsx
import { MessagePrimitive } from '@assistant-ui/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AssistantActionBar } from './assistant-action-bar';
import { BranchPicker } from './branch-picker';
import { MarkdownText } from './markdown-text';
import { cn } from '@/lib/utils';
import { Sparkles } from 'lucide-react';

export function AssistantMessage() {
  return (
    <MessagePrimitive.Root className="fc-flex fc-gap-3 fc-max-w-[85%] fc-mr-auto fc-mb-4">
      {/* Avatar */}
      <Avatar className="fc-h-8 fc-w-8 fc-flex-shrink-0">
        <AvatarFallback className="fc-bg-primary/10 fc-text-primary">
          <Sparkles className="fc-h-4 fc-w-4" />
        </AvatarFallback>
      </Avatar>

      {/* Content */}
      <div className="fc-flex fc-flex-col fc-gap-1">
        <div
          className={cn(
            'fc-px-4 fc-py-2.5 fc-rounded-2xl fc-rounded-bl-sm',
            'fc-bg-muted fc-text-foreground',
            'fc-text-sm fc-leading-relaxed'
          )}
        >
          <MessagePrimitive.Content
            components={{
              Text: MarkdownText,
            }}
          />
        </div>

        {/* Actions */}
        <AssistantActionBar />
        <BranchPicker />
      </div>
    </MessagePrimitive.Root>
  );
}
```

#### Composer Component

```tsx
// src/components/assistant-ui/composer.tsx
import { ComposerPrimitive, ThreadPrimitive } from '@assistant-ui/react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Send, X, Mic } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Composer() {
  return (
    <ComposerPrimitive.Root className="fc-flex fc-items-end fc-gap-2 fc-p-4 fc-border-t fc-border-border">
      {/* Input */}
      <ComposerPrimitive.Input asChild>
        <Textarea
          autoFocus
          placeholder="Type a message..."
          className={cn(
            'fc-flex-1 fc-min-h-[40px] fc-max-h-[120px] fc-resize-none',
            'fc-rounded-2xl fc-bg-muted fc-border-border',
            'fc-px-4 fc-py-2 fc-text-sm',
            'focus-visible:fc-ring-1 focus-visible:fc-ring-primary'
          )}
          rows={1}
        />
      </ComposerPrimitive.Input>

      {/* Send / Cancel buttons */}
      <ThreadPrimitive.If running={false}>
        <Tooltip>
          <ComposerPrimitive.Send asChild>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                className="fc-h-10 fc-w-10 fc-rounded-full fc-bg-primary hover:fc-bg-primary/90"
              >
                <Send className="fc-h-4 fc-w-4" />
                <span className="fc-sr-only">Send message</span>
              </Button>
            </TooltipTrigger>
          </ComposerPrimitive.Send>
          <TooltipContent>Send message</TooltipContent>
        </Tooltip>
      </ThreadPrimitive.If>

      <ThreadPrimitive.If running>
        <Tooltip>
          <ComposerPrimitive.Cancel asChild>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="destructive"
                className="fc-h-10 fc-w-10 fc-rounded-full"
              >
                <X className="fc-h-4 fc-w-4" />
                <span className="fc-sr-only">Stop generating</span>
              </Button>
            </TooltipTrigger>
          </ComposerPrimitive.Cancel>
          <TooltipContent>Stop generating</TooltipContent>
        </Tooltip>
      </ThreadPrimitive.If>
    </ComposerPrimitive.Root>
  );
}
```

#### Utility Function (cn)

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

---

## 14. Shopify Platform Requirements & Compliance

This section documents all Shopify platform requirements, policies, and compliance considerations verified against official Shopify documentation as of December 2025.

### 14.1 Compliance Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Exit Intent Popups | ✅ Allowed | Fully supported, increases conversions 4-11% |
| Scroll-Triggered Engagement | ✅ Allowed | Best at 50-60% scroll depth |
| Idle/Inactivity Triggers | ✅ Allowed | Recommended 20-30 seconds |
| Auto-Opening Chat | ✅ Allowed | Merchant-controlled via Theme Settings |
| Floating Elements | ✅ Allowed | Via App Embed Blocks |
| localStorage/sessionStorage | ✅ Allowed | For session tracking |
| Keyboard Listeners | ✅ Required | For WCAG accessibility |
| SSE Streaming | ✅ Allowed | Recommended for real-time responses |
| External Webhooks | ✅ Allowed | Direct fetch or App Proxy |
| Customer Data Access | ⚠️ Requires Approval | Must request protected scopes |
| GDPR Webhooks | 🔴 Mandatory | 3 webhooks required for App Store |
| Privacy Policy | 🔴 Mandatory | Required for App Store listing |
| Checkout Pages | ❌ Not Allowed | Theme extensions cannot render |

### 14.2 Theme App Extension Architecture

n8n Chat uses Shopify's **App Embed Block** architecture:

```
┌────────────────────────────────────────────────────────────┐
│  Theme App Extension (App Embed Block)                     │
│  ├─ Rendered before </body> closing tag                    │
│  ├─ Works with ALL themes (vintage + Online Store 2.0)     │
│  ├─ Deactivated by default after installation              │
│  ├─ Merchant activates in Theme Settings > App embeds      │
│  └─ Full DOM manipulation access on storefront             │
└────────────────────────────────────────────────────────────┘
```

**Key Architectural Points:**
- **One extension per app** - Can only have one theme app extension
- **No checkout access** - Cannot render on checkout pages (Contact, Shipping, Payment, Order Status)
- **Global Liquid scope** - Access to `cart`, `customer`, `shop`, `product` objects
- **CDN-hosted assets** - All JS/CSS served from Shopify CDN

### 14.3 File Size & Performance Limits

| Resource | Limit | Type |
|----------|-------|------|
| Total Liquid files | 100KB | Hard limit |
| Settings per block | 25 | Hard limit |
| Locale files | 15KB per file | Hard limit |
| Individual Liquid | 256KB | Hard limit |
| JavaScript (compressed) | 10KB | Recommended threshold |
| CSS files | 100KB | Default threshold |
| Lighthouse impact | <10 points | App Store requirement |

**Performance Requirements:**
```typescript
// Core Web Vitals thresholds
const PERFORMANCE_TARGETS = {
  LCP: 2500,      // Largest Contentful Paint < 2.5s
  INP: 200,       // Interaction to Next Paint < 200ms
  CLS: 0.1,       // Cumulative Layout Shift < 0.1
};
```

### 14.4 Customer Data Access & Privacy

#### 14.4.1 Protected Customer Data

**By default, apps have NO access to protected customer data.** Must request approval via Partner Dashboard.

**Protected Fields Requiring Individual Approval:**
- Name
- Email
- Phone number
- Address (billing, shipping, geolocation)
- Order history

```typescript
// Theme extension Liquid access
interface LiquidCustomerAccess {
  // Only available when customer is logged in
  customer: {
    email: string;        // Requires 'email' scope approval
    first_name: string;   // Requires 'name' scope approval
    last_name: string;    // Requires 'name' scope approval
    phone: string;        // Requires 'phone' scope approval
    default_address: Address; // Requires 'address' scope approval
    tags: string[];
    total_spent: string;
  } | null;  // Returns null if not logged in
}
```

#### 14.4.2 GDPR Compliance Strategy (Path B+)

n8n Chat uses a **"Privacy by Default"** approach that minimizes GDPR complexity:

```
┌─────────────────────────────────────────────────────────────────┐
│  Path B+: Optional PII with Merchant Responsibility             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DEFAULT (PII OFF):                                             │
│  • Anonymous sessionId (UUID)                                   │
│  • No customer name/email collected                             │
│  • Chat history not linked to customer identity                 │
│  • GDPR webhooks return "no personal data stored"               │
│                                                                 │
│  OPTIONAL (PII ON):                                             │
│  • Merchant enables "Collect Customer Name" in Theme Editor     │
│  • Merchant provides their n8n GDPR webhook URL                 │
│  • Merchant is responsible for handling GDPR in their n8n       │
│  • We document the required n8n workflow                        │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why This Works:**
- n8n Chat does NOT store customer PII on our servers
- Chat data lives in merchant's OWN n8n instance (their system, their responsibility)
- We provide webhooks as required, but respond appropriately based on data collected

#### 14.4.3 GDPR Webhook Implementation

**All apps MUST implement these 3 webhooks for App Store distribution:**

```typescript
// shopify.app.toml
[[webhooks.subscriptions]]
compliance_topics = [
  "customers/data_request",
  "customers/redact",
  "shop/redact"
]
uri = "/webhooks/compliance"
```

**n8n Chat Response Strategy:**

| Webhook | Default (PII OFF) | With PII ON |
|---------|-------------------|-------------|
| `customers/data_request` | "No personal customer data stored by N8nChat. Chat history is stored in merchant's n8n instance." | Same + "Contact merchant for data in their n8n" |
| `customers/redact` | "No customer-linked data to delete. Sessions are anonymous." | Same + notify merchant |
| `shop/redact` | Acknowledge. Document: "Merchant should delete n8n workflow data." | Same |

**Minimal Webhook Handler (Cloudflare Worker or n8n):**

```typescript
// Simple GDPR compliance endpoint
export async function handleGDPRWebhook(request: Request) {
  const { topic, shop_domain } = await request.json();

  switch (topic) {
    case 'customers/data_request':
      // n8n Chat stores no PII on our servers
      // Chat history is in merchant's own n8n instance
      return new Response(JSON.stringify({
        message: 'n8n Chat does not store personal customer data. ' +
                 'Chat conversations are stored in the merchant\'s n8n instance. ' +
                 'Contact the merchant directly for chat history data.'
      }), { status: 200 });

    case 'customers/redact':
      // No customer-linked data to delete
      // Sessions use anonymous UUIDs
      return new Response(JSON.stringify({
        message: 'No customer-linked data to delete. ' +
                 'n8n Chat uses anonymous session IDs.'
      }), { status: 200 });

    case 'shop/redact':
      // Log for our records, merchant handles their n8n
      console.log(`Shop uninstalled: ${shop_domain}`);
      return new Response(JSON.stringify({
        message: 'Acknowledged. Merchant is responsible for ' +
                 'deleting chat data from their n8n instance.'
      }), { status: 200 });
  }
}
```

#### 14.4.4 Optional Customer Name Collection

```typescript
// Theme Editor Privacy Settings
interface PrivacySettings {
  // Privacy Mode
  collectCustomerName: boolean;  // Default: false

  // Only shown if collectCustomerName = true
  privacyNotice: string;         // Shown to customers before chat
  gdprWebhookUrl?: string;       // Merchant's n8n GDPR workflow (optional)
}

// Context sent to n8n based on privacy settings
function buildContext(settings: PrivacySettings, customer: Customer | null) {
  const context: N8nChatContext = {
    // Always included (non-PII)
    cart: getCart(),
    product: getProduct(),
    shop: getShop(),
    page: getPageInfo(),
    sessionId: getSessionId(),  // Anonymous UUID

    // Only if enabled AND customer logged in
    ...(settings.collectCustomerName && customer ? {
      customer: {
        firstName: customer.first_name,  // Requires scope approval
        // Note: We only request 'name' scope, not email/phone
      }
    } : {})
  };

  return context;
}
```

#### 14.4.5 Privacy Policy Requirements

**Mandatory disclosures in privacy policy:**
- What information collected through Shopify APIs
- Whether customer name is collected (optional feature)
- Chat data stored in merchant's n8n instance, not n8n Chat servers
- How long data is retained (recommend 2 years max)
- Data sent to merchant-configured n8n webhooks
- Security measures (HTTPS, encryption)
- Customer rights (access, deletion, portability)

**n8n Chat Privacy Policy Template (provided to merchants):**

```markdown
## n8n Chat Data Collection

This store uses n8n Chat, an AI chat assistant powered by n8n workflows.

**Data Collected:**
- Chat messages you send
- Shopping cart contents (for contextual assistance)
- Current product being viewed (for recommendations)
[IF ENABLED] - Your first name (for personalized greetings)

**Data Storage:**
- Chat history is stored in our private n8n workflow system
- n8n Chat (the app provider) does not store your personal data
- Session data uses anonymous identifiers

**Your Rights:**
- Request access to your chat history
- Request deletion of your data
- Contact us at [merchant email]
```

#### 14.4.6 AI/ML Data Usage

If using customer data for AI:
- Must get explicit consent in GDPR regions
- Must provide opt-out mechanism
- Cannot collect "extra" data for potential future AI use
- Must disclose AI usage in privacy policy

**n8n Chat Disclosure:** "This chat uses AI to assist with your shopping experience. Your messages are processed by an AI system to provide helpful responses."

### 14.5 External API & Webhook Integration

#### 14.5.1 Direct Fetch to n8n (Recommended for n8n Chat)

Theme app extension JavaScript can make direct fetch requests to external APIs:

```typescript
// Direct webhook call - works from storefront JavaScript
const response = await fetch(webhookUrl, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    action: 'sendMessage',
    sessionId,
    chatInput: message,
    context: shopifyContext
  })
});
```

**CORS Requirements on n8n:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

#### 14.5.2 App Proxy Alternative (Optional)

For authenticated requests or additional security:

```typescript
// App Proxy route (optional)
const response = await fetch('/apps/flowchat/api/chat', {
  method: 'POST',
  credentials: 'include',
  body: JSON.stringify({ message })
});
```

**App Proxy Benefits:**
- Shopify adds authentication parameters
- No CORS issues
- Request signature verification

**n8n Chat Decision:** Direct fetch to n8n is sufficient for our use case since:
- Session ID provides user identification
- No sensitive Shopify data modified
- n8n handles all AI processing server-side

#### 14.5.3 SSE Streaming Requirements

✅ **Fully supported** - Shopify recommends SSE for real-time data:

```typescript
// SSE streaming - works perfectly
const eventSource = new EventSource(webhookUrl);
eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  // Handle streaming token
};
```

**Timeout Specifications:**
- 1 second connection timeout
- 5 second total request timeout for webhooks
- SSE connections stay open for streaming

### 14.6 App Store Requirements

#### 14.6.1 Technical Requirements (April 2025+)

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| GraphQL Admin API | N/A | Widget is storefront-only |
| Session Tokens | N/A | Not using App Bridge |
| GDPR Webhooks | Required | Must implement 3 webhooks |
| HTTPS Only | Required | All assets via Shopify CDN |
| Performance | Required | <10 point Lighthouse impact |

#### 14.6.2 Branding Requirements (November 2025)

**App Name Branding is LIMITED to 24x24 pixels** unless:
1. Customers directly interact with branded elements as core experience, OR
2. Removing branding would cause confusion

**n8n Chat Implementation:**
```typescript
// Chat bubble branding options
interface BrandingConfig {
  showLogo: boolean;        // Optional logo in bubble
  maxLogoSize: '24x24';     // Shopify limit
  poweredByText: boolean;   // "Powered by n8n Chat" (24x24 max)
}
```

**Cannot use in theme extensions:**
- Requests for app reviews/ratings
- Promotion of other apps
- Shopify's Sidekick icon or magic purple color for AI

#### 14.6.3 Accessibility Requirements (June 2025)

**European Accessibility Act (EAA) now enforceable.**

**Required Keyboard Support:**
```typescript
// Escape key - REQUIRED
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeChat();           // Must close modals
    returnFocusToBubble(); // Must return focus
  }
});

// Required keyboard interactions
const REQUIRED_KEYS = {
  'Escape': 'Close modals, drawers, overlays',
  'Enter/Space': 'Activate buttons, links',
  'Tab': 'Navigate between elements',
  'Arrow keys': 'Navigate within components',
};
```

**WCAG 2.2 Level AA Requirements:**
- All interactive elements keyboard accessible
- Proper contrast ratios (4.5:1 for text)
- ARIA landmarks for screen readers
- Focus indicators visible
- Alt text for all images

**Critical Statistic:** Popup & announcement bar apps have a **78% fail rate** for WCAG 2.1 AA compliance.

#### 14.6.4 Common Rejection Reasons

| Rejection Reason | How n8n Chat Avoids |
|-----------------|---------------------|
| Missing GDPR webhooks | ✅ Implements all 3 mandatory webhooks |
| Security header issues | ✅ Served via Shopify CDN |
| Performance impact | ✅ <10KB JS, lazy loading |
| Third-party cookies | ✅ Uses localStorage, not cookies |
| Poor accessibility | ✅ WCAG 2.2 AA compliant |
| Missing privacy policy | ✅ Required during setup |

### 14.7 Authentication Architecture

**n8n Chat uses NO App Bridge** - it's a storefront-only widget.

```
┌──────────────────────────────────────────────────────────────┐
│  Authentication Flow                                          │
├──────────────────────────────────────────────────────────────┤
│                                                               │
│  ❌ App Bridge - NOT USED (admin apps only)                  │
│                                                               │
│  ✅ Session ID Authentication:                               │
│     1. Generate UUID on first visit                          │
│     2. Store in localStorage (STORAGE_KEY_SESSION)           │
│     3. Send with every webhook request                       │
│     4. n8n uses sessionId for conversation memory            │
│                                                               │
│  ✅ Liquid Context (Read-Only):                              │
│     1. Access cart, customer, product via Liquid objects     │
│     2. Pass to JavaScript on page load                       │
│     3. Refresh cart dynamically via /cart.js                 │
│                                                               │
└──────────────────────────────────────────────────────────────┘
```

### 14.8 Checkout Limitations

**Theme app extensions CANNOT render on checkout pages.**

| Page | Access |
|------|--------|
| Homepage | ✅ Full |
| Product pages | ✅ Full |
| Collection pages | ✅ Full |
| Cart page | ✅ Full |
| Contact information | ❌ None |
| Shipping method | ❌ None |
| Payment method | ❌ None |
| Order status | ❌ None |
| Thank you page | ❌ None |

**August 28, 2025 Deadline:**
- checkout.liquid sunset complete
- Additional scripts deprecated
- Only Checkout UI Extensions allowed (Shopify Plus)

**n8n Chat Approach:**
- Widget available on all pre-checkout pages
- Exit intent triggers before checkout
- Post-purchase follow-up via n8n (email/SMS)

### 14.9 Mandatory Implementation Checklist

```markdown
## Pre-Submission Checklist

### Privacy & Compliance
- [ ] Privacy policy created and linked
- [ ] customers/data_request webhook implemented
- [ ] customers/redact webhook implemented
- [ ] shop/redact webhook implemented
- [ ] Data retention policy defined (max 2 years)
- [ ] AI data usage disclosed (if applicable)

### Technical Requirements
- [ ] JavaScript bundle < 10KB compressed
- [ ] Lighthouse impact < 10 points
- [ ] HTTPS for all external requests
- [ ] CORS configured on n8n webhook
- [ ] localStorage for session (not cookies)
- [ ] Tested on multiple themes

### Accessibility
- [ ] Escape key closes chat panel
- [ ] All elements keyboard navigable
- [ ] Focus returns to trigger after close
- [ ] Contrast ratios meet WCAG AA (4.5:1)
- [ ] ARIA labels on all interactive elements
- [ ] Screen reader tested

### Branding
- [ ] Logo/branding ≤ 24x24 pixels
- [ ] No review/rating requests in widget
- [ ] No competitor mentions in listing
- [ ] No Shopify AI branding mimicry
```

### 14.10 API Timeline & Deprecations

| Date | Change | Impact on n8n Chat |
|------|--------|-------------------|
| March 2024 | Latest App Bridge required | N/A (no App Bridge) |
| October 2024 | REST Admin API legacy | N/A (storefront only) |
| April 2025 | GraphQL Admin API mandatory | N/A (storefront only) |
| June 2025 | EAA accessibility enforceable | ✅ WCAG 2.2 AA compliant |
| July 2025 | Built for Shopify deadline | ✅ Meets all requirements |
| August 2025 | checkout.liquid sunset | ✅ No checkout dependency |

### 14.11 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Complete Data Flow (Shopify Compliant)                         │
└─────────────────────────────────────────────────────────────────┘

  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
  │   Shopify    │     │   n8n Chat   │     │     n8n      │
  │   Storefront │     │    Widget    │     │   Workflow   │
  └──────┬───────┘     └──────┬───────┘     └──────┬───────┘
         │                    │                    │
         │  1. Page Load      │                    │
         │  Liquid renders:   │                    │
         │  - cart object     │                    │
         │  - customer object │                    │
         │  - product object  │                    │
         ├───────────────────>│                    │
         │                    │                    │
         │                    │  2. User sends     │
         │                    │     message        │
         │                    │                    │
         │                    │  3. POST to        │
         │                    │     webhook        │
         │                    ├───────────────────>│
         │                    │                    │
         │                    │  4. SSE stream     │
         │                    │<───────────────────│
         │                    │                    │
         │  5. /cart.js       │                    │
         │     (refresh)      │                    │
         │<───────────────────│                    │
         │                    │                    │
         │                    │  6. Updated        │
         │                    │     context        │
         │                    ├───────────────────>│
         │                    │                    │

  ═══════════════════════════════════════════════════════════════
  Data Types & Compliance:

  ✅ cart         - Always available, no approval needed
  ✅ shop         - Always available, no approval needed
  ⚠️ customer    - Requires protected scope approval
                   Only available when logged in
  ✅ product      - Always available on product pages
  ✅ sessionId    - Generated client-side, localStorage
  ✅ chatHistory  - Stored in n8n, not on client
  ═══════════════════════════════════════════════════════════════
```

---

## 15. App Store Optimization & SEO

This section provides SEO-optimized content for the Shopify App Store listing, based on competitive research and best practices.

### 15.1 Branding & Naming

| Element | Value |
|---------|-------|
| **Domain** | n8.chat |
| **App Name** | n8n Chat - AI Widget |
| **Full Name** | n8n Chat Widget for Shopify |
| **Developer** | n8.chat |
| **Slug** | n8n-chat-ai-widget |

**Character Limits:**
- App Name: 30 characters max → "n8n Chat - AI Widget" (20 chars) ✅
- Subtitle: 100 characters max
- Description: No limit (recommend 250-400 words)

### 15.2 App Store Listing Content

#### App Name (30 chars)
```
n8n Chat - AI Widget
```

#### Tagline/Subtitle (100 chars)
```
AI chatbot with n8n workflow automation. 24/7 support, zero hosting fees. Connect 1000+ apps.
```

#### Short Description (For cards/previews)
```
The only AI chat widget powered by n8n workflows. Automate customer support,
connect unlimited integrations, zero monthly hosting fees.
```

#### Full Description (SEO-Optimized)

```markdown
## Transform Your Shopify Store with AI-Powered Chat

n8n Chat is the **only AI chatbot** that connects directly to your n8n workflows,
giving you unlimited automation power with zero hosting fees.

### Why Merchants Choose n8n Chat

**🤖 AI That Actually Understands Your Store**
- Answers product questions using your catalog data
- Tracks orders and provides real-time status updates
- Makes personalized product recommendations
- Handles 70% of support inquiries automatically

**⚡ Powered by n8n Workflow Automation**
- Connect to 1,000+ apps and services
- Build custom workflows triggered by customer conversations
- Automate inventory checks, CRM updates, email sequences
- No per-workflow or per-task fees

**💰 Zero Hosting Costs**
- Runs on YOUR n8n instance - no monthly platform fees
- No per-conversation charges
- No per-agent pricing
- Scale unlimited without scaling costs

**🎨 Award-Winning Design**
- Glassmorphism UI with light/dark themes
- Fully customizable to match your brand
- Mobile-responsive and accessible (WCAG 2.2 AA)
- Voice input and file upload support

### Perfect For

✅ Stores already using n8n for automation
✅ High-volume stores tired of per-conversation pricing
✅ Developers who want full customization control
✅ Privacy-focused brands requiring self-hosted solutions

### Features

- 24/7 AI-powered customer support
- Real-time Shopify context (cart, products, customer)
- Exit-intent popups with discount triggers
- Multi-language support (50+ languages)
- Streaming responses (sub-300ms TTFT)
- JavaScript API for custom integrations
- Analytics integration (GA4, Meta Pixel)

### How It Works

1. Install the app and add to your theme
2. Connect your n8n webhook URL
3. Customize appearance in Theme Editor
4. AI starts helping customers instantly

**No coding required. Setup in under 10 minutes.**

---

Built with ❤️ by n8.chat | Powered by Assistant UI (Y Combinator W25)
```

### 15.3 Keywords Strategy

#### Primary Keywords (5 keyword slots)
```
1. AI chatbot
2. live chat
3. n8n integration
4. workflow automation
5. customer support
```

#### Secondary Keywords (for description)
- chat widget
- AI assistant
- automated support
- order tracking
- product recommendations
- 24/7 support
- self-hosted chat
- no-code chatbot

#### Long-tail Keywords (for content)
- "n8n Shopify chatbot"
- "AI chat with workflow automation"
- "free hosting chat widget"
- "self-hosted AI customer support"
- "Shopify chat without monthly fees"

### 15.4 Category & Tags

**Primary Category:**
```
Store Management > Support > Chat
```

**Tags (10 max):**
```
1. AI chatbot
2. Live chat
3. Customer support
4. Workflow automation
5. n8n integration
6. Chat widget
7. AI assistant
8. Order tracking
9. 24/7 support
10. Self-hosted
```

### 15.5 Competitive Positioning

#### Competitor Analysis

| App | Pricing | Differentiator | Our Advantage |
|-----|---------|----------------|---------------|
| **Tidio** | $29-35/agent/mo | All-in-one chat | No per-agent fees |
| **Gorgias** | Premium enterprise | Deep Shopify integration | No vendor lock-in |
| **Re:amaze** | $29-899/mo | Multi-channel inbox | Self-hosted option |
| **Shopify Inbox** | Free | Native integration | Unlimited workflows |
| **n8n Chat** | **$0 hosting** | **n8n workflows** | **Unique positioning** |

#### Unique Selling Propositions

1. **"The only AI chat widget powered by n8n workflows"**
   - No competitor offers n8n integration
   - 1,000+ service connections
   - Unlimited automation without per-task fees

2. **"Zero hosting fees - runs on YOUR n8n"**
   - Unlike SaaS competitors charging $29-899/month
   - Merchants control their own infrastructure
   - No surprise bills as you scale

3. **"Built for developers and power users"**
   - Full JavaScript API
   - Custom webhook integration
   - Open, extensible architecture

### 15.6 Screenshot Requirements

**Technical Specs:**
- Size: 1600 × 900 pixels (16:9)
- Format: PNG or JPEG
- Quantity: 5-7 screenshots

**Screenshot Strategy:**

| # | Content | Headline Overlay |
|---|---------|-----------------|
| 1 | Chat widget on beautiful Shopify store | "AI Support That Never Sleeps" |
| 2 | n8n workflow diagram connected to chat | "Unlimited Workflow Automation" |
| 3 | Theme Editor customization panel | "Customize Everything, No Code" |
| 4 | Mobile responsive view | "Perfect on Every Device" |
| 5 | Proactive popup with discount | "Convert Visitors Before They Leave" |
| 6 | Multi-language conversation | "50+ Languages Built-In" |
| 7 | Analytics dashboard | "Track Every Conversation" |

**Alt Text (for accessibility & SEO):**
```
Screenshot 1: "n8n Chat AI chatbot widget on Shopify store homepage"
Screenshot 2: "n8n workflow automation connected to chat widget"
Screenshot 3: "Theme Editor settings for customizing chat appearance"
Screenshot 4: "Mobile responsive AI chat widget on smartphone"
Screenshot 5: "Exit intent popup with discount code offer"
Screenshot 6: "Multi-language chat conversation in Spanish"
Screenshot 7: "Chat analytics dashboard showing conversion metrics"
```

### 15.7 Video Requirements

**Promotional Video (30-60 seconds):**

```
0:00-0:05  Problem: Merchant overwhelmed with support messages
0:05-0:15  Solution: Install n8n Chat, quick setup montage
0:15-0:30  Feature: Show n8n workflow automation in action
0:30-0:45  Results: Happy customers, sales increasing
0:45-0:60  CTA: "Start free today at n8.chat"
```

**Demo Video (2-3 minutes):**
- Installation walkthrough
- Theme Editor configuration
- n8n webhook setup
- Live chat demonstration
- Workflow trigger example

### 15.8 Pricing Strategy

**Recommended Tiers:**

| Plan | Price | Conversations | Features |
|------|-------|---------------|----------|
| **Free** | $0 | 100/month | Basic AI, 1 workflow, standard styling |
| **Pro** | $19/mo | 2,000/month | Advanced AI, unlimited workflows, full customization |
| **Business** | $49/mo | 10,000/month | All Pro + analytics, priority support, multi-instance |
| **Enterprise** | Custom | Unlimited | White-label, SLA, dedicated support |

**Key Messaging:**
- "No per-agent fees ever"
- "No per-conversation charges on paid plans"
- "Your n8n, your costs, your control"

### 15.9 Review Strategy

**Launch Goals:**
- 20+ reviews in first 30 days
- Maintain 4.5+ star average
- Respond to ALL reviews within 24 hours

**Review Request Triggers:**
- After successful first AI conversation
- After 100 conversations handled
- After merchant configures first workflow

**Response Templates:**

5-Star Review:
```
Thank you for the amazing review! We're thrilled n8n Chat is helping
your store. If you ever need anything, we're here at support@n8.chat 🚀
```

Critical Review:
```
Thank you for your feedback. We're sorry you experienced [issue].
Our team is looking into this right now. Please reach out to
support@n8.chat so we can make this right for you.
```

### 15.10 App Store Checklist

```markdown
## Pre-Submission Checklist

### Listing Content
- [ ] App name under 30 characters
- [ ] Tagline under 100 characters
- [ ] Full description (250-400 words)
- [ ] 5 keywords selected
- [ ] 10 tags configured
- [ ] Category selected (Support > Chat)

### Visual Assets
- [ ] App icon (1200 × 1200px)
- [ ] 5-7 screenshots (1600 × 900px)
- [ ] Alt text for all images
- [ ] Promotional video (30-60s)
- [ ] Demo video (2-3 min)

### Pricing
- [ ] Free plan configured
- [ ] Paid plans in Shopify Billing API
- [ ] Pricing clearly displayed

### Support
- [ ] Support email configured
- [ ] FAQ page created
- [ ] Documentation/help center
- [ ] Privacy policy URL
- [ ] Terms of service URL

### Technical
- [ ] App tested on multiple themes
- [ ] Performance < 10 point Lighthouse impact
- [ ] GDPR webhooks implemented
- [ ] No bugs or errors
- [ ] Mobile responsive verified
```

### 15.11 SEO Meta Tags

```html
<!-- For n8.chat website -->
<title>n8n Chat - AI Chat Widget for Shopify | n8.chat</title>
<meta name="description" content="The only AI chatbot powered by n8n workflow automation. Zero hosting fees, unlimited integrations, 24/7 customer support for Shopify stores.">
<meta name="keywords" content="n8n chat, Shopify chatbot, AI customer support, workflow automation, live chat widget">

<!-- Open Graph -->
<meta property="og:title" content="n8n Chat - AI Chat Widget for Shopify">
<meta property="og:description" content="AI chatbot with n8n workflow automation. Zero hosting fees.">
<meta property="og:image" content="https://n8.chat/og-image.png">
<meta property="og:url" content="https://n8.chat">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="n8n Chat - AI Chat Widget for Shopify">
<meta name="twitter:description" content="The only AI chatbot powered by n8n workflows.">
```

---

## Appendix

### A. Glossary

| Term | Definition |
|------|------------|
| **App Embed** | Theme App Extension that floats over storefront |
| **App Proxy** | Shopify feature for secure backend communication |
| **Assistant UI** | Y Combinator-backed React library for AI chat |
| **Built for Shopify** | Certification badge for high-quality apps |
| **ChatModelAdapter** | Interface for connecting to AI backends |
| **CVA** | Class Variance Authority - utility for component variants |
| **cn()** | Utility function combining clsx + tailwind-merge |
| **CORS** | Cross-Origin Resource Sharing for webhook access |
| **EAA** | European Accessibility Act (effective June 2025) |
| **GDPR** | General Data Protection Regulation (EU privacy law) |
| **Glassmorphism** | UI design with frosted glass effect |
| **INP** | Interaction to Next Paint (Core Web Vital) |
| **LCP** | Largest Contentful Paint (Core Web Vital) |
| **Liquid** | Shopify's template language |
| **LocalRuntime** | Assistant UI's client-side state management |
| **n8n** | Open-source workflow automation platform |
| **Online Store 2.0** | Shopify's modern theme architecture |
| **Primitives** | Low-level components (ThreadPrimitive, MessagePrimitive) |
| **Protected Customer Data** | PII requiring Shopify approval to access |
| **Radix UI** | Unstyled, accessible React primitives |
| **shadcn/ui** | Component library built on Radix UI + Tailwind CSS |
| **SSE** | Server-Sent Events for streaming responses |
| **Tailwind CSS** | Utility-first CSS framework |
| **Theme App Extension** | Shopify extension for storefront customization |
| **TTFT** | Time to First Token |
| **WCAG** | Web Content Accessibility Guidelines |

### B. Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Full |
| Safari | 14+ | ✅ Full |
| Firefox | 90+ | ✅ Full |
| Edge | 90+ | ✅ Full |
| iOS Safari | 14+ | ✅ Full |
| Chrome Android | 90+ | ✅ Full |
| Samsung Internet | 15+ | ✅ Full |

### C. Security Considerations

- **No credentials stored client-side** - All sensitive data in n8n
- **HTTPS only** - TLS 1.2+ required
- **XSS prevention** - All user input sanitized
- **CORS validation** - Webhook validates origin
- **Rate limiting** - Implemented in n8n workflow
- **Session isolation** - UUID-based, no cross-session access

### D. References

**Core Technologies:**
- [shadcn/ui Documentation](https://ui.shadcn.com/docs)
- [shadcn/ui + Assistant UI Integration](https://www.assistant-ui.com/docs/getting-started/shadcn)
- [Assistant UI Documentation](https://www.assistant-ui.com/docs)
- [Radix UI Primitives](https://www.radix-ui.com/primitives)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [n8n Webhook Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/)

**Shopify Platform:**
- [Theme App Extensions Overview](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions)
- [Configure Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration)
- [Build Theme App Extensions](https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/build)
- [App Store Requirements](https://shopify.dev/docs/apps/launch/shopify-app-store/app-store-requirements)
- [Built for Shopify Requirements](https://shopify.dev/docs/apps/launch/built-for-shopify/requirements)
- [Common App Rejections](https://shopify.dev/docs/apps/store/common-rejections)

**Privacy & Compliance:**
- [Privacy Law Compliance](https://shopify.dev/docs/apps/build/compliance/privacy-law-compliance)
- [Protected Customer Data](https://shopify.dev/docs/apps/launch/protected-customer-data)
- [Mandatory GDPR Webhooks](https://shopify.dev/docs/apps/webhooks/configuration/mandatory-webhooks)
- [Privacy Requirements](https://shopify.dev/docs/apps/launch/privacy-requirements)

**APIs & Integration:**
- [Liquid Objects Reference](https://shopify.dev/docs/api/liquid/objects)
- [Storefront API](https://shopify.dev/docs/api/storefront)
- [Shopify API Limits](https://shopify.dev/docs/api/usage/limits)
- [Webhooks Overview](https://shopify.dev/docs/apps/build/webhooks)

**Accessibility:**
- [WCAG 2.2 Guidelines](https://www.w3.org/TR/WCAG22/)
- [Shopify Accessibility Best Practices](https://shopify.dev/docs/apps/build/accessibility)
- [Keyboard Accessibility Guide](https://www.shopify.com/partners/blog/keyboard-accessibility)

**Performance:**
- [App Performance Guidelines](https://shopify.dev/docs/apps/build/performance)
- [Storefront Performance](https://shopify.dev/docs/apps/best-practices/performance/storefront)
- [Core Web Vitals](https://web.dev/vitals/)

**Design:**
- [Glassmorphism Design](https://glassmorphism.com/)
- [Updated Branding Requirements (Nov 2025)](https://shopify.dev/changelog/updated-online-store-promotion-app-store-requirement)

---

<div align="center">

**n8n Chat v6.0.0 "App Store Edition"**

*The only AI chat widget powered by n8n workflow automation*

**n8.chat** | Built with shadcn/ui + Assistant UI + n8n

✅ Shopify App Store Optimized | ✅ GDPR Compliant | ✅ WCAG 2.2 AA | ✅ Built for Shopify Eligible

</div>
