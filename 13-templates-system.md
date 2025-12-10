# FlowChat Templates System Specification

## Overview

The templates system provides pre-built chat configurations, style presets, and import/export functionality to accelerate setup and enable sharing of configurations between sites.

## Template Types

### 1. Template Categories

```typescript
// src/types/templates.ts

export enum TemplateType {
  FULL = 'full',           // Complete instance configuration
  STYLE = 'style',         // Visual styling only
  BEHAVIOR = 'behavior',   // Behavior settings only
  CONTENT = 'content',     // Messages and prompts only
  N8N = 'n8n'              // n8n workflow templates
}

export enum TemplateCategory {
  CUSTOMER_SUPPORT = 'customer-support',
  SALES = 'sales',
  LEAD_GENERATION = 'lead-generation',
  FAQ = 'faq',
  BOOKING = 'booking',
  ECOMMERCE = 'ecommerce',
  EDUCATION = 'education',
  HEALTHCARE = 'healthcare',
  REAL_ESTATE = 'real-estate',
  GENERAL = 'general',
  CUSTOM = 'custom'
}

export interface Template {
  id: string;
  name: string;
  description: string;
  type: TemplateType;
  category: TemplateCategory;
  version: string;
  author?: string;
  thumbnail?: string;
  tags: string[];
  isPremium: boolean;
  isBuiltIn: boolean;
  
  // Template data
  config: Partial<InstanceConfig>;
  styles?: StylePreset;
  content?: ContentPreset;
  n8nWorkflow?: N8nWorkflowTemplate;
  
  // Metadata
  createdAt: string;
  updatedAt: string;
  usageCount?: number;
}

export interface InstanceConfig {
  // Core settings
  name: string;
  webhookUrl?: string;
  isEnabled: boolean;
  
  // Appearance
  theme: 'light' | 'dark' | 'auto';
  primaryColor: string;
  position: 'bottom-right' | 'bottom-left';
  
  // Content
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  
  // Behavior
  showHeader: boolean;
  showTimestamp: boolean;
  showAvatar: boolean;
  
  // Bubble settings
  bubbleEnabled: boolean;
  bubbleIcon: string;
  bubbleText?: string;
  bubblePosition: BubblePosition;
  
  // Auto-open
  autoOpen: AutoOpenConfig;
  
  // Access control
  requireLogin: boolean;
  allowedRoles: string[];
  pageRestrictions: PageRestrictions;
}
```

### 2. Style Presets

```typescript
// src/types/style-presets.ts

export interface StylePreset {
  id: string;
  name: string;
  description?: string;
  
  // Colors
  colors: {
    primary: string;
    primaryHover: string;
    secondary: string;
    background: string;
    surface: string;
    text: string;
    textMuted: string;
    border: string;
    userMessage: string;
    userMessageText: string;
    assistantMessage: string;
    assistantMessageText: string;
    error: string;
    success: string;
  };
  
  // Typography
  typography: {
    fontFamily: string;
    fontSize: {
      small: string;
      base: string;
      large: string;
    };
    fontWeight: {
      normal: number;
      medium: number;
      bold: number;
    };
    lineHeight: number;
  };
  
  // Spacing
  spacing: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
  };
  
  // Border radius
  borderRadius: {
    small: string;
    medium: string;
    large: string;
    full: string;
  };
  
  // Shadows
  shadows: {
    small: string;
    medium: string;
    large: string;
  };
  
  // Component-specific
  header: {
    height: string;
    background: string;
    borderBottom: string;
  };
  
  messages: {
    maxWidth: string;
    padding: string;
    gap: string;
    userAlignment: 'left' | 'right';
  };
  
  input: {
    background: string;
    border: string;
    borderFocus: string;
    padding: string;
  };
  
  bubble: {
    size: string;
    shadow: string;
    badgeColor: string;
  };
  
  // Custom CSS
  customCss?: string;
}

// Built-in style presets
export const stylePresets: Record<string, StylePreset> = {
  default: {
    id: 'default',
    name: 'Default',
    description: 'Clean and professional default style',
    colors: {
      primary: '#3b82f6',
      primaryHover: '#2563eb',
      secondary: '#64748b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: '#1e293b',
      textMuted: '#64748b',
      border: '#e2e8f0',
      userMessage: '#3b82f6',
      userMessageText: '#ffffff',
      assistantMessage: '#f1f5f9',
      assistantMessageText: '#1e293b',
      error: '#ef4444',
      success: '#22c55e'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: { small: '12px', base: '14px', large: '16px' },
      fontWeight: { normal: 400, medium: 500, bold: 600 },
      lineHeight: 1.5
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    borderRadius: { small: '4px', medium: '8px', large: '12px', full: '9999px' },
    shadows: {
      small: '0 1px 2px rgba(0,0,0,0.05)',
      medium: '0 4px 6px rgba(0,0,0,0.1)',
      large: '0 10px 15px rgba(0,0,0,0.1)'
    },
    header: { height: '56px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' },
    messages: { maxWidth: '80%', padding: '12px 16px', gap: '16px', userAlignment: 'right' },
    input: { background: '#ffffff', border: '1px solid #e2e8f0', borderFocus: '1px solid #3b82f6', padding: '12px' },
    bubble: { size: '56px', shadow: '0 4px 12px rgba(0,0,0,0.15)', badgeColor: '#ef4444' }
  },
  
  modern: {
    id: 'modern',
    name: 'Modern',
    description: 'Contemporary design with rounded elements',
    colors: {
      primary: '#8b5cf6',
      primaryHover: '#7c3aed',
      secondary: '#a78bfa',
      background: '#fafafa',
      surface: '#ffffff',
      text: '#18181b',
      textMuted: '#71717a',
      border: '#e4e4e7',
      userMessage: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
      userMessageText: '#ffffff',
      assistantMessage: '#ffffff',
      assistantMessageText: '#18181b',
      error: '#f43f5e',
      success: '#10b981'
    },
    typography: {
      fontFamily: '"Inter", -apple-system, sans-serif',
      fontSize: { small: '13px', base: '15px', large: '17px' },
      fontWeight: { normal: 400, medium: 500, bold: 600 },
      lineHeight: 1.6
    },
    spacing: { xs: '6px', sm: '12px', md: '20px', lg: '28px', xl: '40px' },
    borderRadius: { small: '8px', medium: '16px', large: '24px', full: '9999px' },
    shadows: {
      small: '0 2px 4px rgba(139,92,246,0.1)',
      medium: '0 8px 16px rgba(139,92,246,0.15)',
      large: '0 16px 32px rgba(139,92,246,0.2)'
    },
    header: { height: '64px', background: '#ffffff', borderBottom: 'none' },
    messages: { maxWidth: '75%', padding: '14px 18px', gap: '20px', userAlignment: 'right' },
    input: { background: '#f4f4f5', border: 'none', borderFocus: '2px solid #8b5cf6', padding: '14px 18px' },
    bubble: { size: '60px', shadow: '0 8px 24px rgba(139,92,246,0.3)', badgeColor: '#f43f5e' }
  },
  
  minimal: {
    id: 'minimal',
    name: 'Minimal',
    description: 'Clean, distraction-free interface',
    colors: {
      primary: '#171717',
      primaryHover: '#404040',
      secondary: '#737373',
      background: '#ffffff',
      surface: '#fafafa',
      text: '#171717',
      textMuted: '#a3a3a3',
      border: '#f5f5f5',
      userMessage: '#171717',
      userMessageText: '#ffffff',
      assistantMessage: '#fafafa',
      assistantMessageText: '#171717',
      error: '#dc2626',
      success: '#16a34a'
    },
    typography: {
      fontFamily: '"SF Pro Text", -apple-system, sans-serif',
      fontSize: { small: '12px', base: '14px', large: '16px' },
      fontWeight: { normal: 400, medium: 500, bold: 500 },
      lineHeight: 1.5
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    borderRadius: { small: '2px', medium: '4px', large: '8px', full: '9999px' },
    shadows: {
      small: 'none',
      medium: '0 1px 3px rgba(0,0,0,0.08)',
      large: '0 4px 12px rgba(0,0,0,0.1)'
    },
    header: { height: '48px', background: '#ffffff', borderBottom: '1px solid #f5f5f5' },
    messages: { maxWidth: '85%', padding: '10px 14px', gap: '12px', userAlignment: 'right' },
    input: { background: '#fafafa', border: '1px solid #f5f5f5', borderFocus: '1px solid #171717', padding: '10px 14px' },
    bubble: { size: '48px', shadow: '0 2px 8px rgba(0,0,0,0.1)', badgeColor: '#dc2626' }
  },
  
  dark: {
    id: 'dark',
    name: 'Dark',
    description: 'Dark mode theme',
    colors: {
      primary: '#60a5fa',
      primaryHover: '#3b82f6',
      secondary: '#94a3b8',
      background: '#0f172a',
      surface: '#1e293b',
      text: '#f1f5f9',
      textMuted: '#94a3b8',
      border: '#334155',
      userMessage: '#3b82f6',
      userMessageText: '#ffffff',
      assistantMessage: '#1e293b',
      assistantMessageText: '#f1f5f9',
      error: '#f87171',
      success: '#4ade80'
    },
    typography: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: { small: '12px', base: '14px', large: '16px' },
      fontWeight: { normal: 400, medium: 500, bold: 600 },
      lineHeight: 1.5
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    borderRadius: { small: '4px', medium: '8px', large: '12px', full: '9999px' },
    shadows: {
      small: '0 1px 2px rgba(0,0,0,0.3)',
      medium: '0 4px 6px rgba(0,0,0,0.4)',
      large: '0 10px 15px rgba(0,0,0,0.5)'
    },
    header: { height: '56px', background: '#1e293b', borderBottom: '1px solid #334155' },
    messages: { maxWidth: '80%', padding: '12px 16px', gap: '16px', userAlignment: 'right' },
    input: { background: '#1e293b', border: '1px solid #334155', borderFocus: '1px solid #60a5fa', padding: '12px' },
    bubble: { size: '56px', shadow: '0 4px 12px rgba(0,0,0,0.4)', badgeColor: '#f87171' }
  },
  
  corporate: {
    id: 'corporate',
    name: 'Corporate',
    description: 'Professional business style',
    colors: {
      primary: '#0066cc',
      primaryHover: '#0052a3',
      secondary: '#6b7280',
      background: '#f9fafb',
      surface: '#ffffff',
      text: '#111827',
      textMuted: '#6b7280',
      border: '#d1d5db',
      userMessage: '#0066cc',
      userMessageText: '#ffffff',
      assistantMessage: '#ffffff',
      assistantMessageText: '#111827',
      error: '#dc2626',
      success: '#059669'
    },
    typography: {
      fontFamily: '"Helvetica Neue", Arial, sans-serif',
      fontSize: { small: '12px', base: '14px', large: '16px' },
      fontWeight: { normal: 400, medium: 500, bold: 700 },
      lineHeight: 1.5
    },
    spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
    borderRadius: { small: '2px', medium: '4px', large: '6px', full: '9999px' },
    shadows: {
      small: '0 1px 2px rgba(0,0,0,0.05)',
      medium: '0 2px 4px rgba(0,0,0,0.1)',
      large: '0 4px 8px rgba(0,0,0,0.15)'
    },
    header: { height: '52px', background: '#0066cc', borderBottom: 'none' },
    messages: { maxWidth: '80%', padding: '12px 16px', gap: '14px', userAlignment: 'right' },
    input: { background: '#ffffff', border: '1px solid #d1d5db', borderFocus: '2px solid #0066cc', padding: '12px' },
    bubble: { size: '54px', shadow: '0 2px 8px rgba(0,102,204,0.3)', badgeColor: '#dc2626' }
  },
  
  friendly: {
    id: 'friendly',
    name: 'Friendly',
    description: 'Warm and approachable design',
    colors: {
      primary: '#f97316',
      primaryHover: '#ea580c',
      secondary: '#fb923c',
      background: '#fffbeb',
      surface: '#ffffff',
      text: '#422006',
      textMuted: '#92400e',
      border: '#fde68a',
      userMessage: '#f97316',
      userMessageText: '#ffffff',
      assistantMessage: '#fef3c7',
      assistantMessageText: '#422006',
      error: '#ef4444',
      success: '#22c55e'
    },
    typography: {
      fontFamily: '"Nunito", "Comic Sans MS", sans-serif',
      fontSize: { small: '13px', base: '15px', large: '17px' },
      fontWeight: { normal: 400, medium: 600, bold: 700 },
      lineHeight: 1.6
    },
    spacing: { xs: '6px', sm: '10px', md: '18px', lg: '26px', xl: '36px' },
    borderRadius: { small: '8px', medium: '16px', large: '24px', full: '9999px' },
    shadows: {
      small: '0 2px 4px rgba(249,115,22,0.1)',
      medium: '0 4px 8px rgba(249,115,22,0.15)',
      large: '0 8px 16px rgba(249,115,22,0.2)'
    },
    header: { height: '60px', background: '#ffffff', borderBottom: '2px solid #fde68a' },
    messages: { maxWidth: '78%', padding: '14px 18px', gap: '18px', userAlignment: 'right' },
    input: { background: '#ffffff', border: '2px solid #fde68a', borderFocus: '2px solid #f97316', padding: '14px' },
    bubble: { size: '60px', shadow: '0 4px 16px rgba(249,115,22,0.25)', badgeColor: '#ef4444' }
  }
};
```

### 3. Content Presets

```typescript
// src/types/content-presets.ts

export interface ContentPreset {
  id: string;
  name: string;
  description?: string;
  category: TemplateCategory;
  language: string;
  
  // Messages
  welcomeMessage: string;
  placeholderText: string;
  chatTitle: string;
  
  // Suggested questions/prompts
  suggestedPrompts?: string[];
  
  // Quick replies
  quickReplies?: QuickReply[];
  
  // System context (for n8n)
  systemContext?: string;
}

export interface QuickReply {
  id: string;
  label: string;
  value: string;
  icon?: string;
}

// Built-in content presets
export const contentPresets: Record<string, ContentPreset> = {
  'customer-support-en': {
    id: 'customer-support-en',
    name: 'Customer Support (English)',
    description: 'Standard customer support chat content',
    category: TemplateCategory.CUSTOMER_SUPPORT,
    language: 'en',
    welcomeMessage: 'Hi! 👋 How can I help you today?',
    placeholderText: 'Type your question here...',
    chatTitle: 'Support Chat',
    suggestedPrompts: [
      'I need help with my order',
      'What are your business hours?',
      'How do I return a product?',
      'Track my shipment'
    ],
    quickReplies: [
      { id: 'orders', label: 'Orders', value: 'I have a question about my order' },
      { id: 'shipping', label: 'Shipping', value: 'I need help with shipping' },
      { id: 'returns', label: 'Returns', value: 'I want to make a return' },
      { id: 'other', label: 'Other', value: 'I have another question' }
    ],
    systemContext: 'You are a helpful customer support agent. Be friendly, professional, and solution-oriented.'
  },
  
  'customer-support-de': {
    id: 'customer-support-de',
    name: 'Kundensupport (Deutsch)',
    description: 'Standard Kundensupport Chat auf Deutsch',
    category: TemplateCategory.CUSTOMER_SUPPORT,
    language: 'de',
    welcomeMessage: 'Hallo! 👋 Wie kann ich Ihnen heute helfen?',
    placeholderText: 'Schreiben Sie Ihre Frage hier...',
    chatTitle: 'Support Chat',
    suggestedPrompts: [
      'Ich brauche Hilfe bei meiner Bestellung',
      'Was sind Ihre Öffnungszeiten?',
      'Wie kann ich ein Produkt zurückgeben?',
      'Sendung verfolgen'
    ],
    quickReplies: [
      { id: 'orders', label: 'Bestellungen', value: 'Ich habe eine Frage zu meiner Bestellung' },
      { id: 'shipping', label: 'Versand', value: 'Ich brauche Hilfe beim Versand' },
      { id: 'returns', label: 'Rückgabe', value: 'Ich möchte eine Rückgabe machen' },
      { id: 'other', label: 'Sonstiges', value: 'Ich habe eine andere Frage' }
    ],
    systemContext: 'Du bist ein hilfsbereiter Kundenservice-Mitarbeiter. Sei freundlich, professionell und lösungsorientiert. Antworte auf Deutsch.'
  },
  
  'sales-en': {
    id: 'sales-en',
    name: 'Sales Assistant (English)',
    description: 'Sales-focused chat content',
    category: TemplateCategory.SALES,
    language: 'en',
    welcomeMessage: 'Welcome! 🎉 Looking for something special today? I\'m here to help you find exactly what you need.',
    placeholderText: 'Ask me anything about our products...',
    chatTitle: 'Sales Assistant',
    suggestedPrompts: [
      'Show me your best sellers',
      'What\'s on sale?',
      'Compare products',
      'Do you have recommendations?'
    ],
    quickReplies: [
      { id: 'products', label: 'Products', value: 'Show me your products' },
      { id: 'pricing', label: 'Pricing', value: 'What are your prices?' },
      { id: 'deals', label: 'Deals', value: 'Any current deals or promotions?' },
      { id: 'help', label: 'Help Decide', value: 'Help me choose the right product' }
    ],
    systemContext: 'You are a knowledgeable sales assistant. Help customers find products, answer questions about features and pricing, and guide them toward a purchase decision. Be enthusiastic but not pushy.'
  },
  
  'lead-gen-en': {
    id: 'lead-gen-en',
    name: 'Lead Generation (English)',
    description: 'Lead capture focused chat',
    category: TemplateCategory.LEAD_GENERATION,
    language: 'en',
    welcomeMessage: 'Hello! 👋 I\'d love to learn more about what you\'re looking for. How can I help you today?',
    placeholderText: 'Tell me about your needs...',
    chatTitle: 'Get in Touch',
    suggestedPrompts: [
      'I\'d like a demo',
      'Get pricing information',
      'Schedule a consultation',
      'Learn more about your services'
    ],
    quickReplies: [
      { id: 'demo', label: 'Request Demo', value: 'I\'d like to schedule a demo' },
      { id: 'pricing', label: 'Get Pricing', value: 'Can you send me pricing information?' },
      { id: 'call', label: 'Schedule Call', value: 'I\'d like to schedule a call' },
      { id: 'info', label: 'More Info', value: 'Tell me more about your services' }
    ],
    systemContext: 'You are a friendly business development representative. Your goal is to understand visitor needs, answer initial questions, and collect contact information for follow-up. Be helpful and not overly salesy.'
  },
  
  'faq-en': {
    id: 'faq-en',
    name: 'FAQ Bot (English)',
    description: 'Frequently asked questions assistant',
    category: TemplateCategory.FAQ,
    language: 'en',
    welcomeMessage: 'Hi there! I can help answer your questions. What would you like to know?',
    placeholderText: 'Ask a question...',
    chatTitle: 'FAQ Assistant',
    suggestedPrompts: [
      'What services do you offer?',
      'How does pricing work?',
      'What are your hours?',
      'How do I get started?'
    ],
    quickReplies: [
      { id: 'services', label: 'Services', value: 'What services do you offer?' },
      { id: 'pricing', label: 'Pricing', value: 'How does pricing work?' },
      { id: 'contact', label: 'Contact', value: 'How can I contact you?' },
      { id: 'started', label: 'Get Started', value: 'How do I get started?' }
    ],
    systemContext: 'You are a helpful FAQ assistant. Answer questions clearly and concisely. If you don\'t know the answer, offer to connect the user with a human representative.'
  },
  
  'booking-en': {
    id: 'booking-en',
    name: 'Booking Assistant (English)',
    description: 'Appointment and reservation assistant',
    category: TemplateCategory.BOOKING,
    language: 'en',
    welcomeMessage: 'Hello! 📅 I can help you schedule an appointment or make a reservation. What can I book for you today?',
    placeholderText: 'Tell me what you\'d like to book...',
    chatTitle: 'Book Now',
    suggestedPrompts: [
      'Check availability',
      'Book an appointment',
      'Reschedule my booking',
      'Cancel reservation'
    ],
    quickReplies: [
      { id: 'new', label: 'New Booking', value: 'I\'d like to make a new booking' },
      { id: 'check', label: 'Availability', value: 'Check available times' },
      { id: 'reschedule', label: 'Reschedule', value: 'I need to reschedule' },
      { id: 'cancel', label: 'Cancel', value: 'I need to cancel my booking' }
    ],
    systemContext: 'You are a booking assistant. Help users check availability, make reservations, reschedule, or cancel appointments. Collect necessary information like date, time, and contact details.'
  }
};
```

## Full Templates

### 4. Complete Instance Templates

```typescript
// src/templates/full-templates.ts

import { Template, TemplateType, TemplateCategory } from '../types/templates';

export const fullTemplates: Template[] = [
  {
    id: 'customer-support-standard',
    name: 'Customer Support - Standard',
    description: 'Complete customer support chat setup with professional styling and common support features.',
    type: TemplateType.FULL,
    category: TemplateCategory.CUSTOMER_SUPPORT,
    version: '1.0.0',
    author: 'FlowChat',
    thumbnail: '/assets/templates/customer-support.png',
    tags: ['support', 'customer service', 'help desk'],
    isPremium: false,
    isBuiltIn: true,
    config: {
      name: 'Customer Support',
      isEnabled: true,
      theme: 'light',
      primaryColor: '#3b82f6',
      position: 'bottom-right',
      welcomeMessage: 'Hi! 👋 How can I help you today?',
      placeholderText: 'Type your question here...',
      chatTitle: 'Support',
      showHeader: true,
      showTimestamp: true,
      showAvatar: true,
      bubbleEnabled: true,
      bubbleIcon: 'chat',
      bubbleText: 'Need help?',
      bubblePosition: { bottom: '24px', right: '24px' },
      autoOpen: {
        enabled: true,
        trigger: 'delay',
        delay: 30000,
        conditions: { skipIfInteracted: true }
      },
      requireLogin: false,
      allowedRoles: [],
      pageRestrictions: { mode: 'all' }
    },
    styles: {
      id: 'default',
      name: 'Default',
      colors: {
        primary: '#3b82f6',
        primaryHover: '#2563eb',
        secondary: '#64748b',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#1e293b',
        textMuted: '#64748b',
        border: '#e2e8f0',
        userMessage: '#3b82f6',
        userMessageText: '#ffffff',
        assistantMessage: '#f1f5f9',
        assistantMessageText: '#1e293b',
        error: '#ef4444',
        success: '#22c55e'
      },
      typography: {
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fontSize: { small: '12px', base: '14px', large: '16px' },
        fontWeight: { normal: 400, medium: 500, bold: 600 },
        lineHeight: 1.5
      },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
      borderRadius: { small: '4px', medium: '8px', large: '12px', full: '9999px' },
      shadows: {
        small: '0 1px 2px rgba(0,0,0,0.05)',
        medium: '0 4px 6px rgba(0,0,0,0.1)',
        large: '0 10px 15px rgba(0,0,0,0.1)'
      },
      header: { height: '56px', background: '#ffffff', borderBottom: '1px solid #e2e8f0' },
      messages: { maxWidth: '80%', padding: '12px 16px', gap: '16px', userAlignment: 'right' },
      input: { background: '#ffffff', border: '1px solid #e2e8f0', borderFocus: '1px solid #3b82f6', padding: '12px' },
      bubble: { size: '56px', shadow: '0 4px 12px rgba(0,0,0,0.15)', badgeColor: '#ef4444' }
    },
    content: {
      id: 'customer-support-en',
      name: 'Customer Support (English)',
      category: TemplateCategory.CUSTOMER_SUPPORT,
      language: 'en',
      welcomeMessage: 'Hi! 👋 How can I help you today?',
      placeholderText: 'Type your question here...',
      chatTitle: 'Support',
      suggestedPrompts: [
        'I need help with my order',
        'What are your business hours?',
        'How do I return a product?',
        'Track my shipment'
      ],
      quickReplies: [
        { id: 'orders', label: 'Orders', value: 'I have a question about my order' },
        { id: 'shipping', label: 'Shipping', value: 'I need help with shipping' },
        { id: 'returns', label: 'Returns', value: 'I want to make a return' },
        { id: 'other', label: 'Other', value: 'I have another question' }
      ]
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  
  {
    id: 'sales-assistant',
    name: 'Sales Assistant',
    description: 'Engage visitors and convert them into customers with this sales-focused chat template.',
    type: TemplateType.FULL,
    category: TemplateCategory.SALES,
    version: '1.0.0',
    author: 'FlowChat',
    thumbnail: '/assets/templates/sales.png',
    tags: ['sales', 'conversion', 'ecommerce'],
    isPremium: false,
    isBuiltIn: true,
    config: {
      name: 'Sales Assistant',
      isEnabled: true,
      theme: 'light',
      primaryColor: '#8b5cf6',
      position: 'bottom-right',
      welcomeMessage: 'Welcome! 🎉 Looking for something special today?',
      placeholderText: 'Ask me anything about our products...',
      chatTitle: 'Sales',
      showHeader: true,
      showTimestamp: false,
      showAvatar: true,
      bubbleEnabled: true,
      bubbleIcon: 'sparkle',
      bubbleText: 'Can I help?',
      bubblePosition: { bottom: '24px', right: '24px' },
      autoOpen: {
        enabled: true,
        trigger: 'scroll',
        scrollPercentage: 50,
        conditions: { skipIfInteracted: true }
      },
      requireLogin: false,
      allowedRoles: [],
      pageRestrictions: { mode: 'all' }
    },
    styles: {
      id: 'modern',
      name: 'Modern',
      colors: {
        primary: '#8b5cf6',
        primaryHover: '#7c3aed',
        secondary: '#a78bfa',
        background: '#fafafa',
        surface: '#ffffff',
        text: '#18181b',
        textMuted: '#71717a',
        border: '#e4e4e7',
        userMessage: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)',
        userMessageText: '#ffffff',
        assistantMessage: '#ffffff',
        assistantMessageText: '#18181b',
        error: '#f43f5e',
        success: '#10b981'
      },
      typography: {
        fontFamily: '"Inter", -apple-system, sans-serif',
        fontSize: { small: '13px', base: '15px', large: '17px' },
        fontWeight: { normal: 400, medium: 500, bold: 600 },
        lineHeight: 1.6
      },
      spacing: { xs: '6px', sm: '12px', md: '20px', lg: '28px', xl: '40px' },
      borderRadius: { small: '8px', medium: '16px', large: '24px', full: '9999px' },
      shadows: {
        small: '0 2px 4px rgba(139,92,246,0.1)',
        medium: '0 8px 16px rgba(139,92,246,0.15)',
        large: '0 16px 32px rgba(139,92,246,0.2)'
      },
      header: { height: '64px', background: '#ffffff', borderBottom: 'none' },
      messages: { maxWidth: '75%', padding: '14px 18px', gap: '20px', userAlignment: 'right' },
      input: { background: '#f4f4f5', border: 'none', borderFocus: '2px solid #8b5cf6', padding: '14px 18px' },
      bubble: { size: '60px', shadow: '0 8px 24px rgba(139,92,246,0.3)', badgeColor: '#f43f5e' }
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  
  {
    id: 'lead-generation-pro',
    name: 'Lead Generation Pro',
    description: 'Capture leads effectively with qualification questions and contact collection.',
    type: TemplateType.FULL,
    category: TemplateCategory.LEAD_GENERATION,
    version: '1.0.0',
    author: 'FlowChat',
    thumbnail: '/assets/templates/lead-gen.png',
    tags: ['leads', 'qualification', 'b2b', 'contact'],
    isPremium: true,
    isBuiltIn: true,
    config: {
      name: 'Lead Capture',
      isEnabled: true,
      theme: 'light',
      primaryColor: '#0066cc',
      position: 'bottom-right',
      welcomeMessage: 'Hello! 👋 I\'d love to learn more about what you\'re looking for.',
      placeholderText: 'Tell me about your needs...',
      chatTitle: 'Get in Touch',
      showHeader: true,
      showTimestamp: false,
      showAvatar: true,
      bubbleEnabled: true,
      bubbleIcon: 'message',
      bubbleText: 'Chat with us',
      bubblePosition: { bottom: '24px', right: '24px' },
      autoOpen: {
        enabled: true,
        trigger: 'exit-intent',
        conditions: { 
          skipIfInteracted: true,
          guestsOnly: false
        }
      },
      requireLogin: false,
      allowedRoles: [],
      pageRestrictions: { mode: 'all' }
    },
    styles: {
      id: 'corporate',
      name: 'Corporate',
      colors: {
        primary: '#0066cc',
        primaryHover: '#0052a3',
        secondary: '#6b7280',
        background: '#f9fafb',
        surface: '#ffffff',
        text: '#111827',
        textMuted: '#6b7280',
        border: '#d1d5db',
        userMessage: '#0066cc',
        userMessageText: '#ffffff',
        assistantMessage: '#ffffff',
        assistantMessageText: '#111827',
        error: '#dc2626',
        success: '#059669'
      },
      typography: {
        fontFamily: '"Helvetica Neue", Arial, sans-serif',
        fontSize: { small: '12px', base: '14px', large: '16px' },
        fontWeight: { normal: 400, medium: 500, bold: 700 },
        lineHeight: 1.5
      },
      spacing: { xs: '4px', sm: '8px', md: '16px', lg: '24px', xl: '32px' },
      borderRadius: { small: '2px', medium: '4px', large: '6px', full: '9999px' },
      shadows: {
        small: '0 1px 2px rgba(0,0,0,0.05)',
        medium: '0 2px 4px rgba(0,0,0,0.1)',
        large: '0 4px 8px rgba(0,0,0,0.15)'
      },
      header: { height: '52px', background: '#0066cc', borderBottom: 'none' },
      messages: { maxWidth: '80%', padding: '12px 16px', gap: '14px', userAlignment: 'right' },
      input: { background: '#ffffff', border: '1px solid #d1d5db', borderFocus: '2px solid #0066cc', padding: '12px' },
      bubble: { size: '54px', shadow: '0 2px 8px rgba(0,102,204,0.3)', badgeColor: '#dc2626' }
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];
```

## n8n Workflow Templates

### 5. n8n Workflow Templates

```typescript
// src/templates/n8n-templates.ts

export interface N8nWorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  isPremium: boolean;
  
  // The workflow JSON (n8n export format)
  workflow: {
    name: string;
    nodes: N8nNode[];
    connections: Record<string, any>;
    settings?: Record<string, any>;
  };
  
  // Variables that need to be configured
  variables: WorkflowVariable[];
  
  // Setup instructions
  instructions: string;
}

export interface N8nNode {
  id: string;
  name: string;
  type: string;
  position: [number, number];
  parameters: Record<string, any>;
}

export interface WorkflowVariable {
  key: string;
  label: string;
  description: string;
  type: 'string' | 'number' | 'boolean' | 'select';
  required: boolean;
  default?: any;
  options?: { label: string; value: any }[];
  placeholder?: string;
}

export const n8nWorkflowTemplates: N8nWorkflowTemplate[] = [
  {
    id: 'basic-ai-chat',
    name: 'Basic AI Chat',
    description: 'Simple AI chat using OpenAI with conversation memory',
    category: TemplateCategory.GENERAL,
    tags: ['ai', 'openai', 'basic'],
    isPremium: false,
    workflow: {
      name: 'FlowChat - Basic AI',
      nodes: [
        {
          id: 'chat-trigger',
          name: 'Chat Trigger',
          type: 'n8n-nodes-base.chatTrigger',
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'flowchat-basic',
            responseMode: 'responseNode'
          }
        },
        {
          id: 'ai-agent',
          name: 'AI Agent',
          type: '@n8n/n8n-nodes-langchain.agent',
          position: [500, 300],
          parameters: {
            agent: 'conversationalAgent',
            systemMessage: '={{$vars.system_prompt}}',
            options: {
              returnIntermediateSteps: false
            }
          }
        },
        {
          id: 'openai-model',
          name: 'OpenAI Chat Model',
          type: '@n8n/n8n-nodes-langchain.lmChatOpenAi',
          position: [500, 500],
          parameters: {
            model: '={{$vars.model}}',
            options: {
              temperature: 0.7
            }
          }
        },
        {
          id: 'memory',
          name: 'Window Buffer Memory',
          type: '@n8n/n8n-nodes-langchain.memoryBufferWindow',
          position: [700, 500],
          parameters: {
            sessionKey: '={{$json.sessionId}}',
            contextWindowLength: 10
          }
        }
      ],
      connections: {
        'Chat Trigger': {
          main: [[{ node: 'AI Agent', type: 'main', index: 0 }]]
        },
        'OpenAI Chat Model': {
          ai_languageModel: [[{ node: 'AI Agent', type: 'ai_languageModel', index: 0 }]]
        },
        'Window Buffer Memory': {
          ai_memory: [[{ node: 'AI Agent', type: 'ai_memory', index: 0 }]]
        }
      }
    },
    variables: [
      {
        key: 'system_prompt',
        label: 'System Prompt',
        description: 'Instructions for the AI assistant',
        type: 'string',
        required: true,
        default: 'You are a helpful assistant. Answer questions accurately and helpfully.',
        placeholder: 'Enter system prompt...'
      },
      {
        key: 'model',
        label: 'OpenAI Model',
        description: 'Which OpenAI model to use',
        type: 'select',
        required: true,
        default: 'gpt-4o-mini',
        options: [
          { label: 'GPT-4o Mini', value: 'gpt-4o-mini' },
          { label: 'GPT-4o', value: 'gpt-4o' },
          { label: 'GPT-4 Turbo', value: 'gpt-4-turbo' }
        ]
      }
    ],
    instructions: `
## Setup Instructions

1. **OpenAI Credentials**: Add your OpenAI API credentials in n8n
2. **Activate Workflow**: Enable the workflow after importing
3. **Copy Webhook URL**: Use the production webhook URL in FlowChat

## Customization

- Modify the system prompt to match your use case
- Adjust temperature for more/less creative responses
- Change memory window size for longer/shorter context
    `
  },
  
  {
    id: 'customer-support-kb',
    name: 'Customer Support with Knowledge Base',
    description: 'AI support agent with vector database for product knowledge',
    category: TemplateCategory.CUSTOMER_SUPPORT,
    tags: ['support', 'rag', 'knowledge-base', 'pinecone'],
    isPremium: true,
    workflow: {
      name: 'FlowChat - Support KB',
      nodes: [
        {
          id: 'chat-trigger',
          name: 'Chat Trigger',
          type: 'n8n-nodes-base.chatTrigger',
          position: [250, 300],
          parameters: {
            httpMethod: 'POST',
            path: 'flowchat-support-kb',
            responseMode: 'responseNode'
          }
        },
        {
          id: 'ai-agent',
          name: 'Support Agent',
          type: '@n8n/n8n-nodes-langchain.agent',
          position: [500, 300],
          parameters: {
            agent: 'toolsAgent',
            systemMessage: '={{$vars.system_prompt}}',
            options: {
              returnIntermediateSteps: false
            }
          }
        },
        {
          id: 'vector-store',
          name: 'Vector Store Tool',
          type: '@n8n/n8n-nodes-langchain.toolVectorStore',
          position: [700, 500],
          parameters: {
            name: 'knowledge_base',
            description: 'Search the knowledge base for product information and support answers'
          }
        },
        {
          id: 'pinecone',
          name: 'Pinecone Vector Store',
          type: '@n8n/n8n-nodes-langchain.vectorStorePinecone',
          position: [900, 500],
          parameters: {
            indexName: '={{$vars.pinecone_index}}',
            options: {
              topK: 5
            }
          }
        },
        {
          id: 'embeddings',
          name: 'OpenAI Embeddings',
          type: '@n8n/n8n-nodes-langchain.embeddingsOpenAi',
          position: [900, 700],
          parameters: {
            model: 'text-embedding-3-small'
          }
        }
      ],
      connections: {}
    },
    variables: [
      {
        key: 'system_prompt',
        label: 'System Prompt',
        description: 'Instructions for the support agent',
        type: 'string',
        required: true,
        default: 'You are a helpful customer support agent. Use the knowledge base to answer questions about our products and services. Be friendly and professional.',
        placeholder: 'Enter system prompt...'
      },
      {
        key: 'pinecone_index',
        label: 'Pinecone Index',
        description: 'Name of your Pinecone index',
        type: 'string',
        required: true,
        placeholder: 'my-support-index'
      }
    ],
    instructions: `
## Setup Instructions

1. **Pinecone Setup**: Create a Pinecone index and add your support content
2. **Add Credentials**: Configure OpenAI and Pinecone credentials in n8n
3. **Index Your Content**: Use a separate workflow to embed and index your support docs
4. **Activate & Test**: Enable workflow and test with sample questions

## Best Practices

- Keep your knowledge base updated
- Monitor which questions aren't being answered well
- Add fallback to human support for complex issues
    `
  }
];
```

## Template Management

### 6. PHP Template Manager

```php
<?php
// includes/class-template-manager.php

namespace FlowChat;

class Template_Manager {
    
    private $built_in_templates = [];
    private $custom_templates = [];
    
    public function __construct() {
        $this->load_built_in_templates();
        $this->load_custom_templates();
    }
    
    /**
     * Load built-in templates from JSON files
     */
    private function load_built_in_templates(): void {
        $template_dir = FLOWCHAT_PLUGIN_DIR . 'assets/templates/';
        
        if (!is_dir($template_dir)) {
            return;
        }
        
        foreach (glob($template_dir . '*.json') as $file) {
            $data = json_decode(file_get_contents($file), true);
            if ($data && isset($data['id'])) {
                $data['isBuiltIn'] = true;
                $this->built_in_templates[$data['id']] = $data;
            }
        }
    }
    
    /**
     * Load custom templates from database
     */
    private function load_custom_templates(): void {
        $this->custom_templates = get_option('flowchat_custom_templates', []);
    }
    
    /**
     * Get all templates
     */
    public function get_all_templates(): array {
        return array_merge(
            array_values($this->built_in_templates),
            array_values($this->custom_templates)
        );
    }
    
    /**
     * Get templates by type
     */
    public function get_templates_by_type(string $type): array {
        return array_filter(
            $this->get_all_templates(),
            fn($t) => $t['type'] === $type
        );
    }
    
    /**
     * Get templates by category
     */
    public function get_templates_by_category(string $category): array {
        return array_filter(
            $this->get_all_templates(),
            fn($t) => $t['category'] === $category
        );
    }
    
    /**
     * Get single template
     */
    public function get_template(string $id): ?array {
        if (isset($this->built_in_templates[$id])) {
            return $this->built_in_templates[$id];
        }
        
        if (isset($this->custom_templates[$id])) {
            return $this->custom_templates[$id];
        }
        
        return null;
    }
    
    /**
     * Save custom template
     */
    public function save_template(array $template): string {
        // Generate ID if not provided
        if (empty($template['id'])) {
            $template['id'] = 'custom_' . wp_generate_uuid4();
        }
        
        // Set metadata
        $template['isBuiltIn'] = false;
        $template['createdAt'] = $template['createdAt'] ?? current_time('c');
        $template['updatedAt'] = current_time('c');
        
        // Sanitize
        $template = $this->sanitize_template($template);
        
        // Save
        $this->custom_templates[$template['id']] = $template;
        update_option('flowchat_custom_templates', $this->custom_templates);
        
        return $template['id'];
    }
    
    /**
     * Delete custom template
     */
    public function delete_template(string $id): bool {
        // Can't delete built-in templates
        if (isset($this->built_in_templates[$id])) {
            return false;
        }
        
        if (!isset($this->custom_templates[$id])) {
            return false;
        }
        
        unset($this->custom_templates[$id]);
        update_option('flowchat_custom_templates', $this->custom_templates);
        
        return true;
    }
    
    /**
     * Apply template to instance
     */
    public function apply_template(string $template_id, string $instance_id): bool {
        $template = $this->get_template($template_id);
        if (!$template) {
            return false;
        }
        
        $instance_manager = new Instance_Manager();
        $instance = $instance_manager->get_instance($instance_id);
        
        if (!$instance) {
            return false;
        }
        
        // Merge template config with existing instance
        $merged_config = array_merge(
            $instance,
            $template['config'] ?? [],
            ['id' => $instance_id] // Keep original ID
        );
        
        // Apply style preset if present
        if (!empty($template['styles'])) {
            $merged_config['stylePreset'] = $template['styles']['id'];
            $merged_config['customStyles'] = $template['styles'];
        }
        
        // Apply content preset if present
        if (!empty($template['content'])) {
            $merged_config['welcomeMessage'] = $template['content']['welcomeMessage'];
            $merged_config['placeholderText'] = $template['content']['placeholderText'];
            $merged_config['chatTitle'] = $template['content']['chatTitle'];
            
            if (!empty($template['content']['suggestedPrompts'])) {
                $merged_config['suggestedPrompts'] = $template['content']['suggestedPrompts'];
            }
            
            if (!empty($template['content']['quickReplies'])) {
                $merged_config['quickReplies'] = $template['content']['quickReplies'];
            }
        }
        
        return $instance_manager->update_instance($instance_id, $merged_config);
    }
    
    /**
     * Create instance from template
     */
    public function create_from_template(string $template_id): ?string {
        $template = $this->get_template($template_id);
        if (!$template) {
            return null;
        }
        
        $instance_manager = new Instance_Manager();
        
        // Build instance config from template
        $config = array_merge(
            Instance_Manager::get_default_config(),
            $template['config'] ?? []
        );
        
        // Generate unique name
        $config['name'] = ($template['name'] ?? 'New Chat') . ' - ' . date('M j, Y');
        
        // Apply styles and content
        if (!empty($template['styles'])) {
            $config['stylePreset'] = $template['styles']['id'];
            $config['customStyles'] = $template['styles'];
        }
        
        if (!empty($template['content'])) {
            $config['welcomeMessage'] = $template['content']['welcomeMessage'];
            $config['placeholderText'] = $template['content']['placeholderText'];
            $config['chatTitle'] = $template['content']['chatTitle'];
        }
        
        return $instance_manager->create_instance($config);
    }
    
    /**
     * Export instance as template
     */
    public function export_as_template(string $instance_id, array $options = []): array {
        $instance_manager = new Instance_Manager();
        $instance = $instance_manager->get_instance($instance_id);
        
        if (!$instance) {
            throw new \Exception('Instance not found');
        }
        
        $template = [
            'id' => $options['id'] ?? 'export_' . wp_generate_uuid4(),
            'name' => $options['name'] ?? $instance['name'],
            'description' => $options['description'] ?? '',
            'type' => $options['type'] ?? 'full',
            'category' => $options['category'] ?? 'custom',
            'version' => '1.0.0',
            'author' => $options['author'] ?? wp_get_current_user()->display_name,
            'tags' => $options['tags'] ?? [],
            'isPremium' => false,
            'isBuiltIn' => false,
            'config' => $this->extract_config($instance, $options['type'] ?? 'full'),
            'createdAt' => current_time('c'),
            'updatedAt' => current_time('c')
        ];
        
        // Include styles if requested
        if ($options['includeStyles'] ?? true) {
            $template['styles'] = $instance['customStyles'] ?? null;
        }
        
        // Include content if requested
        if ($options['includeContent'] ?? true) {
            $template['content'] = [
                'id' => 'custom',
                'name' => 'Custom Content',
                'category' => 'custom',
                'language' => 'en',
                'welcomeMessage' => $instance['welcomeMessage'] ?? '',
                'placeholderText' => $instance['placeholderText'] ?? '',
                'chatTitle' => $instance['chatTitle'] ?? '',
                'suggestedPrompts' => $instance['suggestedPrompts'] ?? [],
                'quickReplies' => $instance['quickReplies'] ?? []
            ];
        }
        
        return $template;
    }
    
    /**
     * Extract config based on template type
     */
    private function extract_config(array $instance, string $type): array {
        // Fields to always exclude
        $exclude = ['id', 'webhookUrl', 'createdAt', 'updatedAt'];
        
        // Type-specific field inclusion
        $type_fields = [
            'full' => null, // Include all
            'style' => ['theme', 'primaryColor', 'customStyles', 'stylePreset'],
            'behavior' => ['showHeader', 'showTimestamp', 'showAvatar', 'autoOpen', 'bubbleEnabled', 'bubblePosition'],
            'content' => ['welcomeMessage', 'placeholderText', 'chatTitle', 'suggestedPrompts', 'quickReplies']
        ];
        
        $config = [];
        $allowed = $type_fields[$type] ?? null;
        
        foreach ($instance as $key => $value) {
            if (in_array($key, $exclude)) {
                continue;
            }
            
            if ($allowed === null || in_array($key, $allowed)) {
                $config[$key] = $value;
            }
        }
        
        return $config;
    }
    
    /**
     * Sanitize template data
     */
    private function sanitize_template(array $template): array {
        return [
            'id' => sanitize_key($template['id']),
            'name' => sanitize_text_field($template['name']),
            'description' => sanitize_textarea_field($template['description'] ?? ''),
            'type' => sanitize_key($template['type'] ?? 'full'),
            'category' => sanitize_key($template['category'] ?? 'custom'),
            'version' => sanitize_text_field($template['version'] ?? '1.0.0'),
            'author' => sanitize_text_field($template['author'] ?? ''),
            'tags' => array_map('sanitize_text_field', $template['tags'] ?? []),
            'isPremium' => (bool) ($template['isPremium'] ?? false),
            'isBuiltIn' => (bool) ($template['isBuiltIn'] ?? false),
            'config' => $template['config'] ?? [],
            'styles' => $template['styles'] ?? null,
            'content' => $template['content'] ?? null,
            'n8nWorkflow' => $template['n8nWorkflow'] ?? null,
            'createdAt' => $template['createdAt'] ?? current_time('c'),
            'updatedAt' => $template['updatedAt'] ?? current_time('c')
        ];
    }
}
```

## Import/Export System

### 7. Import/Export Handler

```php
<?php
// includes/class-import-export.php

namespace FlowChat;

class Import_Export {
    
    const EXPORT_VERSION = '1.0';
    
    /**
     * Export instances as JSON
     */
    public function export_instances(array $instance_ids = []): array {
        $instance_manager = new Instance_Manager();
        
        if (empty($instance_ids)) {
            $instances = $instance_manager->get_all_instances();
        } else {
            $instances = [];
            foreach ($instance_ids as $id) {
                $instance = $instance_manager->get_instance($id);
                if ($instance) {
                    $instances[] = $instance;
                }
            }
        }
        
        // Remove sensitive data
        $instances = array_map(function($instance) {
            // Keep webhook URL but mark as needing configuration
            $instance['webhookUrl'] = $instance['webhookUrl'] ? '[CONFIGURE]' : '';
            return $instance;
        }, $instances);
        
        return [
            'version' => self::EXPORT_VERSION,
            'exportDate' => current_time('c'),
            'siteUrl' => home_url(),
            'instances' => $instances
        ];
    }
    
    /**
     * Export as downloadable file
     */
    public function export_to_file(array $instance_ids = []): void {
        $data = $this->export_instances($instance_ids);
        
        $filename = 'flowchat-export-' . date('Y-m-d-His') . '.json';
        
        header('Content-Type: application/json');
        header('Content-Disposition: attachment; filename="' . $filename . '"');
        header('Content-Length: ' . strlen(wp_json_encode($data)));
        
        echo wp_json_encode($data, JSON_PRETTY_PRINT);
        exit;
    }
    
    /**
     * Import instances from JSON
     */
    public function import_instances(array $data, array $options = []): array {
        $results = [
            'success' => [],
            'errors' => [],
            'skipped' => []
        ];
        
        // Validate format
        if (!isset($data['version']) || !isset($data['instances'])) {
            throw new \Exception('Invalid import file format');
        }
        
        $instance_manager = new Instance_Manager();
        $existing = $options['overwrite'] ?? false;
        
        foreach ($data['instances'] as $instance_data) {
            try {
                // Check for existing
                $existing_instance = null;
                if (!empty($instance_data['id'])) {
                    $existing_instance = $instance_manager->get_instance($instance_data['id']);
                }
                
                if ($existing_instance && !$existing) {
                    // Skip existing if not overwriting
                    $results['skipped'][] = [
                        'id' => $instance_data['id'],
                        'name' => $instance_data['name'],
                        'reason' => 'Already exists'
                    ];
                    continue;
                }
                
                // Clean up the data
                $instance_data = $this->prepare_import_data($instance_data);
                
                if ($existing_instance && $existing) {
                    // Update existing
                    $instance_manager->update_instance($instance_data['id'], $instance_data);
                    $results['success'][] = [
                        'id' => $instance_data['id'],
                        'name' => $instance_data['name'],
                        'action' => 'updated'
                    ];
                } else {
                    // Create new
                    unset($instance_data['id']); // Let it generate new ID
                    $new_id = $instance_manager->create_instance($instance_data);
                    $results['success'][] = [
                        'id' => $new_id,
                        'name' => $instance_data['name'],
                        'action' => 'created'
                    ];
                }
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'name' => $instance_data['name'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Import from uploaded file
     */
    public function import_from_file(array $file, array $options = []): array {
        // Validate file
        if ($file['error'] !== UPLOAD_ERR_OK) {
            throw new \Exception('File upload failed');
        }
        
        if ($file['type'] !== 'application/json' && 
            pathinfo($file['name'], PATHINFO_EXTENSION) !== 'json') {
            throw new \Exception('Invalid file type. Please upload a JSON file.');
        }
        
        // Read and parse
        $contents = file_get_contents($file['tmp_name']);
        $data = json_decode($contents, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON format');
        }
        
        return $this->import_instances($data, $options);
    }
    
    /**
     * Prepare instance data for import
     */
    private function prepare_import_data(array $data): array {
        // Mark webhook as needing configuration
        if ($data['webhookUrl'] === '[CONFIGURE]') {
            $data['webhookUrl'] = '';
        }
        
        // Set defaults for missing fields
        $defaults = Instance_Manager::get_default_config();
        $data = array_merge($defaults, $data);
        
        // Update timestamps
        $data['updatedAt'] = current_time('c');
        
        return $data;
    }
    
    /**
     * Export templates
     */
    public function export_templates(array $template_ids = []): array {
        $template_manager = new Template_Manager();
        
        $templates = [];
        if (empty($template_ids)) {
            // Export all custom templates
            $all = $template_manager->get_all_templates();
            $templates = array_filter($all, fn($t) => !$t['isBuiltIn']);
        } else {
            foreach ($template_ids as $id) {
                $template = $template_manager->get_template($id);
                if ($template && !$template['isBuiltIn']) {
                    $templates[] = $template;
                }
            }
        }
        
        return [
            'version' => self::EXPORT_VERSION,
            'exportDate' => current_time('c'),
            'type' => 'templates',
            'templates' => array_values($templates)
        ];
    }
    
    /**
     * Import templates
     */
    public function import_templates(array $data, array $options = []): array {
        $results = [
            'success' => [],
            'errors' => [],
            'skipped' => []
        ];
        
        if (!isset($data['templates'])) {
            throw new \Exception('Invalid template import format');
        }
        
        $template_manager = new Template_Manager();
        
        foreach ($data['templates'] as $template_data) {
            try {
                // Generate new ID to avoid conflicts
                $template_data['id'] = 'imported_' . wp_generate_uuid4();
                $template_data['isBuiltIn'] = false;
                
                $id = $template_manager->save_template($template_data);
                
                $results['success'][] = [
                    'id' => $id,
                    'name' => $template_data['name']
                ];
            } catch (\Exception $e) {
                $results['errors'][] = [
                    'name' => $template_data['name'] ?? 'Unknown',
                    'error' => $e->getMessage()
                ];
            }
        }
        
        return $results;
    }
    
    /**
     * Generate shareable template link
     */
    public function create_share_link(string $template_id): string {
        $template_manager = new Template_Manager();
        $template = $template_manager->get_template($template_id);
        
        if (!$template) {
            throw new \Exception('Template not found');
        }
        
        // Create share token
        $share_data = [
            'template_id' => $template_id,
            'created_at' => time(),
            'created_by' => get_current_user_id()
        ];
        
        $token = wp_generate_uuid4();
        $shares = get_option('flowchat_template_shares', []);
        $shares[$token] = $share_data;
        update_option('flowchat_template_shares', $shares);
        
        return add_query_arg([
            'flowchat_share' => $token
        ], home_url());
    }
    
    /**
     * Import from share link
     */
    public function import_from_share(string $token): ?string {
        $shares = get_option('flowchat_template_shares', []);
        
        if (!isset($shares[$token])) {
            return null;
        }
        
        $share_data = $shares[$token];
        $template_manager = new Template_Manager();
        $template = $template_manager->get_template($share_data['template_id']);
        
        if (!$template) {
            return null;
        }
        
        // Import as new template
        $template['id'] = 'shared_' . wp_generate_uuid4();
        $template['isBuiltIn'] = false;
        
        return $template_manager->save_template($template);
    }
}
```

## Admin Template UI

### 8. Template Browser Component

```tsx
// src/admin/components/TemplateBrowser.tsx

import React, { useState, useMemo } from 'react';
import { Template, TemplateType, TemplateCategory } from '../../types/templates';
import { useTemplates } from '../hooks/useTemplates';
import { __ } from '@wordpress/i18n';
import './TemplateBrowser.css';

interface TemplateBrowserProps {
  onSelect: (template: Template) => void;
  onApply: (templateId: string, instanceId: string) => void;
  selectedInstanceId?: string;
}

export const TemplateBrowser: React.FC<TemplateBrowserProps> = ({
  onSelect,
  onApply,
  selectedInstanceId
}) => {
  const { templates, isLoading } = useTemplates();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TemplateType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TemplateCategory | 'all'>('all');
  const [showPremiumOnly, setShowPremiumOnly] = useState(false);
  
  const filteredTemplates = useMemo(() => {
    return templates.filter(template => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = 
          template.name.toLowerCase().includes(query) ||
          template.description.toLowerCase().includes(query) ||
          template.tags.some(t => t.toLowerCase().includes(query));
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (selectedType !== 'all' && template.type !== selectedType) {
        return false;
      }
      
      // Category filter
      if (selectedCategory !== 'all' && template.category !== selectedCategory) {
        return false;
      }
      
      // Premium filter
      if (showPremiumOnly && !template.isPremium) {
        return false;
      }
      
      return true;
    });
  }, [templates, searchQuery, selectedType, selectedCategory, showPremiumOnly]);
  
  const categories = [
    { value: 'all', label: __('All Categories', 'flowchat') },
    { value: 'customer-support', label: __('Customer Support', 'flowchat') },
    { value: 'sales', label: __('Sales', 'flowchat') },
    { value: 'lead-generation', label: __('Lead Generation', 'flowchat') },
    { value: 'faq', label: __('FAQ', 'flowchat') },
    { value: 'booking', label: __('Booking', 'flowchat') },
    { value: 'ecommerce', label: __('E-commerce', 'flowchat') },
    { value: 'general', label: __('General', 'flowchat') },
    { value: 'custom', label: __('Custom', 'flowchat') }
  ];
  
  const types = [
    { value: 'all', label: __('All Types', 'flowchat') },
    { value: 'full', label: __('Full Templates', 'flowchat') },
    { value: 'style', label: __('Style Presets', 'flowchat') },
    { value: 'behavior', label: __('Behavior Presets', 'flowchat') },
    { value: 'content', label: __('Content Presets', 'flowchat') }
  ];
  
  if (isLoading) {
    return <div className="flowchat-template-loading">{__('Loading templates...', 'flowchat')}</div>;
  }
  
  return (
    <div className="flowchat-template-browser">
      <div className="flowchat-template-filters">
        <input
          type="search"
          placeholder={__('Search templates...', 'flowchat')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flowchat-template-search"
        />
        
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value as any)}
          className="flowchat-template-filter-select"
        >
          {categories.map(cat => (
            <option key={cat.value} value={cat.value}>{cat.label}</option>
          ))}
        </select>
        
        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value as any)}
          className="flowchat-template-filter-select"
        >
          {types.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        
        <label className="flowchat-template-premium-filter">
          <input
            type="checkbox"
            checked={showPremiumOnly}
            onChange={(e) => setShowPremiumOnly(e.target.checked)}
          />
          {__('Premium only', 'flowchat')}
        </label>
      </div>
      
      <div className="flowchat-template-grid">
        {filteredTemplates.map(template => (
          <TemplateCard
            key={template.id}
            template={template}
            onSelect={() => onSelect(template)}
            onApply={selectedInstanceId ? () => onApply(template.id, selectedInstanceId) : undefined}
          />
        ))}
        
        {filteredTemplates.length === 0 && (
          <div className="flowchat-template-empty">
            {__('No templates found matching your criteria.', 'flowchat')}
          </div>
        )}
      </div>
    </div>
  );
};

interface TemplateCardProps {
  template: Template;
  onSelect: () => void;
  onApply?: () => void;
}

const TemplateCard: React.FC<TemplateCardProps> = ({ template, onSelect, onApply }) => {
  return (
    <div className="flowchat-template-card">
      {template.thumbnail && (
        <div 
          className="flowchat-template-thumbnail"
          style={{ backgroundImage: `url(${template.thumbnail})` }}
        />
      )}
      
      <div className="flowchat-template-content">
        <div className="flowchat-template-header">
          <h3 className="flowchat-template-name">{template.name}</h3>
          {template.isPremium && (
            <span className="flowchat-template-badge flowchat-template-badge--premium">
              {__('Premium', 'flowchat')}
            </span>
          )}
          {template.isBuiltIn && (
            <span className="flowchat-template-badge flowchat-template-badge--builtin">
              {__('Built-in', 'flowchat')}
            </span>
          )}
        </div>
        
        <p className="flowchat-template-description">{template.description}</p>
        
        <div className="flowchat-template-tags">
          {template.tags.slice(0, 3).map(tag => (
            <span key={tag} className="flowchat-template-tag">{tag}</span>
          ))}
        </div>
        
        <div className="flowchat-template-meta">
          <span className="flowchat-template-category">
            {template.category.replace('-', ' ')}
          </span>
          <span className="flowchat-template-type">
            {template.type}
          </span>
        </div>
        
        <div className="flowchat-template-actions">
          <button
            onClick={onSelect}
            className="flowchat-template-btn flowchat-template-btn--preview"
          >
            {__('Preview', 'flowchat')}
          </button>
          {onApply && (
            <button
              onClick={onApply}
              className="flowchat-template-btn flowchat-template-btn--apply"
            >
              {__('Apply', 'flowchat')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

### 9. Style Preset Picker

```tsx
// src/admin/components/StylePresetPicker.tsx

import React from 'react';
import { StylePreset, stylePresets } from '../../types/style-presets';
import { __ } from '@wordpress/i18n';
import './StylePresetPicker.css';

interface StylePresetPickerProps {
  value: string;
  onChange: (presetId: string, preset: StylePreset) => void;
  showPreview?: boolean;
}

export const StylePresetPicker: React.FC<StylePresetPickerProps> = ({
  value,
  onChange,
  showPreview = true
}) => {
  const presets = Object.values(stylePresets);
  
  return (
    <div className="flowchat-style-preset-picker">
      <div className="flowchat-style-preset-grid">
        {presets.map(preset => (
          <div
            key={preset.id}
            className={`flowchat-style-preset-item ${value === preset.id ? 'is-selected' : ''}`}
            onClick={() => onChange(preset.id, preset)}
          >
            {showPreview && (
              <div 
                className="flowchat-style-preset-preview"
                style={{
                  '--preview-primary': preset.colors.primary,
                  '--preview-bg': preset.colors.background,
                  '--preview-surface': preset.colors.surface,
                  '--preview-text': preset.colors.text,
                  '--preview-user-msg': preset.colors.userMessage,
                  '--preview-assistant-msg': preset.colors.assistantMessage,
                  '--preview-radius': preset.borderRadius.medium
                } as React.CSSProperties}
              >
                <div className="flowchat-style-preset-preview-header" />
                <div className="flowchat-style-preset-preview-messages">
                  <div className="flowchat-style-preset-preview-msg flowchat-style-preset-preview-msg--user" />
                  <div className="flowchat-style-preset-preview-msg flowchat-style-preset-preview-msg--assistant" />
                </div>
                <div className="flowchat-style-preset-preview-input" />
              </div>
            )}
            
            <div className="flowchat-style-preset-info">
              <span className="flowchat-style-preset-name">{preset.name}</span>
              {preset.description && (
                <span className="flowchat-style-preset-desc">{preset.description}</span>
              )}
            </div>
            
            <div className="flowchat-style-preset-colors">
              <span 
                className="flowchat-style-preset-color-dot"
                style={{ backgroundColor: preset.colors.primary }}
              />
              <span 
                className="flowchat-style-preset-color-dot"
                style={{ backgroundColor: preset.colors.background }}
              />
              <span 
                className="flowchat-style-preset-color-dot"
                style={{ backgroundColor: preset.colors.userMessage }}
              />
            </div>
            
            {value === preset.id && (
              <div className="flowchat-style-preset-selected-indicator">✓</div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
```

## REST API Endpoints

### 10. Template API Endpoints

```php
<?php
// includes/api/class-template-endpoints.php

namespace FlowChat\API;

use FlowChat\Template_Manager;
use FlowChat\Import_Export;

class Template_Endpoints {
    
    public function register_routes(): void {
        register_rest_route('flowchat/v1', '/templates', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_templates'],
                'permission_callback' => [$this, 'can_read']
            ]
        ]);
        
        register_rest_route('flowchat/v1', '/templates/(?P<id>[a-zA-Z0-9_-]+)', [
            [
                'methods' => 'GET',
                'callback' => [$this, 'get_template'],
                'permission_callback' => [$this, 'can_read']
            ],
            [
                'methods' => 'DELETE',
                'callback' => [$this, 'delete_template'],
                'permission_callback' => [$this, 'can_manage']
            ]
        ]);
        
        register_rest_route('flowchat/v1', '/templates', [
            'methods' => 'POST',
            'callback' => [$this, 'create_template'],
            'permission_callback' => [$this, 'can_manage']
        ]);
        
        register_rest_route('flowchat/v1', '/templates/(?P<id>[a-zA-Z0-9_-]+)/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_template'],
            'permission_callback' => [$this, 'can_manage'],
            'args' => [
                'instance_id' => [
                    'required' => true,
                    'type' => 'string'
                ]
            ]
        ]);
        
        register_rest_route('flowchat/v1', '/templates/create-from', [
            'methods' => 'POST',
            'callback' => [$this, 'create_from_template'],
            'permission_callback' => [$this, 'can_manage'],
            'args' => [
                'template_id' => [
                    'required' => true,
                    'type' => 'string'
                ]
            ]
        ]);
        
        register_rest_route('flowchat/v1', '/export/instances', [
            'methods' => 'POST',
            'callback' => [$this, 'export_instances'],
            'permission_callback' => [$this, 'can_manage']
        ]);
        
        register_rest_route('flowchat/v1', '/import/instances', [
            'methods' => 'POST',
            'callback' => [$this, 'import_instances'],
            'permission_callback' => [$this, 'can_manage']
        ]);
        
        register_rest_route('flowchat/v1', '/style-presets', [
            'methods' => 'GET',
            'callback' => [$this, 'get_style_presets'],
            'permission_callback' => [$this, 'can_read']
        ]);
        
        register_rest_route('flowchat/v1', '/content-presets', [
            'methods' => 'GET',
            'callback' => [$this, 'get_content_presets'],
            'permission_callback' => [$this, 'can_read']
        ]);
    }
    
    public function get_templates(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        $templates = $manager->get_all_templates();
        
        // Apply filters
        $type = $request->get_param('type');
        $category = $request->get_param('category');
        
        if ($type) {
            $templates = array_filter($templates, fn($t) => $t['type'] === $type);
        }
        
        if ($category) {
            $templates = array_filter($templates, fn($t) => $t['category'] === $category);
        }
        
        return new \WP_REST_Response(array_values($templates));
    }
    
    public function get_template(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        $template = $manager->get_template($request->get_param('id'));
        
        if (!$template) {
            return new \WP_REST_Response(['error' => 'Template not found'], 404);
        }
        
        return new \WP_REST_Response($template);
    }
    
    public function create_template(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        $data = $request->get_json_params();
        
        try {
            $id = $manager->save_template($data);
            $template = $manager->get_template($id);
            return new \WP_REST_Response($template, 201);
        } catch (\Exception $e) {
            return new \WP_REST_Response(['error' => $e->getMessage()], 400);
        }
    }
    
    public function delete_template(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        $id = $request->get_param('id');
        
        if ($manager->delete_template($id)) {
            return new \WP_REST_Response(['deleted' => true]);
        }
        
        return new \WP_REST_Response(['error' => 'Could not delete template'], 400);
    }
    
    public function apply_template(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        
        $template_id = $request->get_param('id');
        $instance_id = $request->get_param('instance_id');
        
        if ($manager->apply_template($template_id, $instance_id)) {
            return new \WP_REST_Response(['success' => true]);
        }
        
        return new \WP_REST_Response(['error' => 'Could not apply template'], 400);
    }
    
    public function create_from_template(\WP_REST_Request $request): \WP_REST_Response {
        $manager = new Template_Manager();
        $template_id = $request->get_param('template_id');
        
        $instance_id = $manager->create_from_template($template_id);
        
        if ($instance_id) {
            return new \WP_REST_Response([
                'instance_id' => $instance_id
            ], 201);
        }
        
        return new \WP_REST_Response(['error' => 'Could not create instance'], 400);
    }
    
    public function export_instances(\WP_REST_Request $request): \WP_REST_Response {
        $exporter = new Import_Export();
        $instance_ids = $request->get_param('instance_ids') ?? [];
        
        $data = $exporter->export_instances($instance_ids);
        
        return new \WP_REST_Response($data);
    }
    
    public function import_instances(\WP_REST_Request $request): \WP_REST_Response {
        $importer = new Import_Export();
        $data = $request->get_json_params();
        $options = [
            'overwrite' => $request->get_param('overwrite') ?? false
        ];
        
        try {
            $results = $importer->import_instances($data, $options);
            return new \WP_REST_Response($results);
        } catch (\Exception $e) {
            return new \WP_REST_Response(['error' => $e->getMessage()], 400);
        }
    }
    
    public function get_style_presets(): \WP_REST_Response {
        // Return built-in style presets
        $presets = json_decode(
            file_get_contents(FLOWCHAT_PLUGIN_DIR . 'assets/presets/styles.json'),
            true
        ) ?? [];
        
        return new \WP_REST_Response($presets);
    }
    
    public function get_content_presets(): \WP_REST_Response {
        // Return built-in content presets
        $presets = json_decode(
            file_get_contents(FLOWCHAT_PLUGIN_DIR . 'assets/presets/content.json'),
            true
        ) ?? [];
        
        return new \WP_REST_Response($presets);
    }
    
    public function can_read(): bool {
        return current_user_can('edit_posts');
    }
    
    public function can_manage(): bool {
        return current_user_can('manage_options');
    }
}
```

This completes the templates system specification. Creating the next file...
