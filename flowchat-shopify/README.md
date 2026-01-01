# FlowChat Shopify

AI chat widget for Shopify stores powered by n8n workflows and [Assistant UI](https://www.assistant-ui.com).

## Features

- **Zero Backend Required** - Connects directly to your n8n webhook
- **Built on Assistant UI** - Y Combinator backed, production-grade chat components
- **Rich Shopify Context** - Sends customer, cart, product, and page data to AI
- **Theme Editor Configuration** - All settings via Shopify Theme Editor
- **Modern Design** - Light/dark themes, responsive, accessible
- **Streaming Responses** - Real-time SSE with token-by-token display
- **Branch Navigation** - Navigate between regenerated message versions
- **Copy & Regenerate** - Built-in message actions

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Shopify App

1. Create a Partner account at [partners.shopify.com](https://partners.shopify.com)
2. Create a new app
3. Update `shopify.app.toml` with your app credentials

### 3. Build the Widget

```bash
npm run build:widget
```

### 4. Deploy to Shopify

```bash
npm run deploy
```

### 5. Configure in Theme Editor

1. Go to your Shopify store's Theme Editor
2. Click "App embeds" in the sidebar
3. Enable "FlowChat Widget"
4. Enter your n8n webhook URL
5. Customize appearance and behavior

## n8n Workflow Setup

Your n8n workflow should:

1. **Webhook Trigger** - Receives chat messages
2. **Memory Node** - Stores conversation history
3. **AI Agent** - Processes messages with context
4. **Respond to Webhook** - Returns AI response

### Request Format

```json
{
  "action": "sendMessage",
  "sessionId": "uuid",
  "chatInput": "User's message",
  "context": {
    "shop": { "name": "...", "domain": "...", "currency": "..." },
    "customer": { "logged_in": true, "email": "...", "name": "..." },
    "cart": { "item_count": 2, "total_price": "99.00", "items": [...] },
    "product": { "title": "...", "price": "..." },
    "page": { "type": "product", "url": "/products/..." },
    "locale": { "language": "en", "country": "US" },
    "timestamp": "2025-12-31T12:00:00Z"
  }
}
```

### Response Formats

**Streaming (SSE):**
```
data: {"output": "Hello"}
data: {"output": "Hello there!"}
data: [DONE]
```

**Non-Streaming (JSON):**
```json
{
  "output": "Hello there! How can I help you today?"
}
```

### CORS Configuration

Enable CORS on your n8n webhook by adding these headers:
- `Access-Control-Allow-Origin: *` (or your shop domain)
- `Access-Control-Allow-Methods: POST, OPTIONS`
- `Access-Control-Allow-Headers: Content-Type`

## Development

### Local Development

```bash
npm run dev
```

### Type Checking

```bash
npm run typecheck
```

### Linting

```bash
npm run lint
```

## Project Structure

```
flowchat-shopify/
├── extensions/
│   └── flowchat-widget/
│       ├── assets/                    # Built widget files (generated)
│       │   ├── flowchat-widget.js     # React bundle (~304KB)
│       │   └── flowchat-widget.css    # Styles (~9KB)
│       ├── blocks/
│       │   └── flowchat-embed.liquid  # App Embed with block schema
│       └── shopify.extension.toml
├── src/
│   ├── components/
│   │   ├── FlowChatWidget.tsx         # Main widget (AssistantRuntimeProvider)
│   │   ├── ChatPanel.tsx              # Uses ThreadPrimitive, ComposerPrimitive
│   │   ├── BubbleTrigger.tsx          # Floating chat button
│   │   ├── ChatHeader.tsx             # Panel header
│   │   └── WelcomeScreen.tsx          # ThreadPrimitive.Suggestion
│   ├── lib/
│   │   └── n8nChatModelAdapter.ts     # ChatModelAdapter for n8n
│   ├── styles/
│   │   └── main.css                   # Widget styles (CSS Variables)
│   └── types/
│       └── index.ts                   # TypeScript definitions
├── package.json
├── shopify.app.toml
├── tsconfig.json
├── vite.config.ts
└── n8n-workflow-template.json         # Sample n8n workflow
```

## Architecture

The widget uses **Assistant UI's LocalRuntime** pattern:

```
┌─────────────────────────────────────────────────────┐
│  FlowChatWidget                                     │
│  └─ AssistantRuntimeProvider (runtime)              │
│      └─ useLocalRuntime(n8nChatModelAdapter)        │
│          └─ ChatPanel                               │
│              ├─ ThreadPrimitive.Root                │
│              │   ├─ ThreadPrimitive.Empty           │
│              │   │   └─ WelcomeScreen               │
│              │   └─ ThreadPrimitive.Viewport        │
│              │       └─ ThreadPrimitive.Messages    │
│              └─ ComposerPrimitive.Root              │
│                  ├─ ComposerPrimitive.Input         │
│                  └─ ComposerPrimitive.Send/Cancel   │
└─────────────────────────────────────────────────────┘
```

## Configuration Options

All settings are available in the Theme Editor:

| Setting | Description |
|---------|-------------|
| Webhook URL | Your n8n webhook endpoint |
| Welcome Message | First message shown to users |
| Suggested Prompts | Quick action buttons |
| Theme | Light, Dark, or Auto |
| Position | Bottom-right or Bottom-left |
| Primary Color | Brand color for the widget |
| Send Customer Info | Include email, name, order history |
| Send Cart Contents | Include cart items and totals |
| Send Product Details | Include current product on product pages |
| Auto-Open | Automatically open chat after delay |
| Voice Input | Enable speech-to-text |
| File Upload | Enable image/document uploads |

## License

Private - FlowChat
