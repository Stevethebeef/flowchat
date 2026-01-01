# FlowChat - System Architecture

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              WORDPRESS SITE                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         ADMIN LAYER (PHP)                             │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │   Settings  │  │  Instances  │  │  Templates  │  │   License   │  │   │
│  │  │    Page     │  │   Manager   │  │   Manager   │  │   Manager   │  │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                       DATA LAYER (wp_options)                         │   │
│  │  ┌─────────────────────────────────────────────────────────────────┐ │   │
│  │  │  flowchat_instances: [{id, name, endpoint, settings, style}]    │ │   │
│  │  │  flowchat_global_settings: {defaults, branding, license}        │ │   │
│  │  │  flowchat_templates: [{id, name, config}]                       │ │   │
│  │  └─────────────────────────────────────────────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      REST API LAYER (PHP)                             │   │
│  │  /wp-json/flowchat/v1/                                               │   │
│  │  ├── instances (GET, POST, PUT, DELETE)                              │   │
│  │  ├── settings (GET, PUT)                                             │   │
│  │  ├── history/{session_id} (GET, POST, DELETE)                        │   │
│  │  ├── proxy (POST) → n8n relay                                        │   │
│  │  └── license (GET, POST)                                             │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                      │                                       │
│                                      ▼                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND LAYER (React)                            │   │
│  │                                                                       │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │   │
│  │  │  Shortcode  │  │  Gutenberg  │  │  Elementor  │  │   Bubble    │  │   │
│  │  │  Container  │  │    Block    │  │   Widget    │  │  Container  │  │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │   │
│  │         │                │                │                │         │   │
│  │         └────────────────┴────────────────┴────────────────┘         │   │
│  │                                   │                                   │   │
│  │                                   ▼                                   │   │
│  │         ┌─────────────────────────────────────────────────┐          │   │
│  │         │              FlowChat React App                  │          │   │
│  │         │  ┌─────────────────────────────────────────────┐│          │   │
│  │         │  │           Instance Manager                  ││          │   │
│  │         │  │  • Mounts to DOM containers                 ││          │   │
│  │         │  │  • Creates runtime per instance             ││          │   │
│  │         │  │  • Manages state & events                   ││          │   │
│  │         │  └─────────────────────────────────────────────┘│          │   │
│  │         │                       │                         │          │   │
│  │         │                       ▼                         │          │   │
│  │         │  ┌─────────────────────────────────────────────┐│          │   │
│  │         │  │         assistant-ui Components             ││          │   │
│  │         │  │  • Thread / ThreadPrimitive                 ││          │   │
│  │         │  │  • Composer / ComposerPrimitive             ││          │   │
│  │         │  │  • Message / MessagePrimitive               ││          │   │
│  │         │  │  • AssistantRuntimeProvider                 ││          │   │
│  │         │  └─────────────────────────────────────────────┘│          │   │
│  │         │                       │                         │          │   │
│  │         │                       ▼                         │          │   │
│  │         │  ┌─────────────────────────────────────────────┐│          │   │
│  │         │  │         n8n Runtime Adapter                 ││          │   │
│  │         │  │  • HTTP/SSE communication                   ││          │   │
│  │         │  │  • Message transformation                   ││          │   │
│  │         │  │  • Session management                       ││          │   │
│  │         │  │  • Error handling                           ││          │   │
│  │         │  └─────────────────────────────────────────────┘│          │   │
│  │         └─────────────────────────────────────────────────┘          │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTPS (SSE/REST)
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                              n8n INSTANCE                                    │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                        Chat Trigger Node                             │    │
│  │  • Receives messages with session ID                                 │    │
│  │  • WordPress metadata (user, page context)                           │    │
│  │  • Streams response chunks                                           │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                    │                                         │
│                                    ▼                                         │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                      AI Workflow (User-defined)                      │    │
│  │  • LLM nodes (OpenAI, Anthropic, etc.)                              │    │
│  │  • RAG / Vector stores                                               │    │
│  │  • Tool calls / Function execution                                   │    │
│  │  • Custom business logic                                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

### Admin Layer (PHP)

| Component | Responsibility |
|-----------|----------------|
| Settings Page | Global plugin configuration, defaults, branding |
| Instances Manager | CRUD for chat instances, configuration UI |
| Templates Manager | Pre-built and custom templates management |
| License Manager | License validation, feature gating |

### Data Layer (wp_options)

| Option Key | Type | Purpose |
|------------|------|---------|
| `flowchat_instances` | JSON array | All chat instance configurations |
| `flowchat_global_settings` | JSON object | Plugin-wide settings |
| `flowchat_templates` | JSON array | Template definitions |
| `flowchat_license` | JSON object | License key and status |

### REST API Layer (PHP)

| Endpoint | Methods | Purpose |
|----------|---------|---------|
| `/instances` | GET, POST, PUT, DELETE | Instance CRUD |
| `/settings` | GET, PUT | Global settings |
| `/history/{session_id}` | GET, POST, DELETE | Chat history |
| `/proxy` | POST | n8n message relay |
| `/license` | GET, POST | License operations |

### Frontend Layer (React)

| Component | Responsibility |
|-----------|----------------|
| Instance Manager | DOM mounting, runtime creation, state |
| assistant-ui Components | Chat UI primitives |
| n8n Runtime Adapter | n8n communication, streaming |
| Style Manager | CSS variable injection, theming |

## Data Flow Diagrams

### 1. Initial Page Load

```
User visits page with chat
         │
         ▼
┌─────────────────────────┐
│   WordPress renders     │
│   shortcode/block       │
│   • Creates container   │
│   • data-instance-id    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   PHP enqueues assets   │
│   • build/index.js      │
│   • build/index.css     │
│   • wp_localize_script  │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   React app initializes │
│   • Reads flowchatConfig│
│   • Scans for containers│
│   • Mounts instances    │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│   Per-instance setup    │
│   • Create runtime      │
│   • Load history        │
│   • Render UI           │
└─────────────────────────┘
```

### 2. Message Send Flow

```
User types message and sends
              │
              ▼
┌──────────────────────────────┐
│   Composer captures input    │
│   • Text content             │
│   • File attachments         │
│   • Voice transcription      │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   Runtime adapter prepares   │
│   • Session ID               │
│   • Message history          │
│   • WordPress metadata       │
│   • Instance config          │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   Request to WordPress API   │
│   POST /flowchat/v1/proxy    │
│   • Nonce validation         │
│   • User capability check    │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   WordPress proxies to n8n   │
│   • Adds server-side meta    │
│   • Signs request (optional) │
│   • SSE stream passthrough   │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   n8n Chat Trigger receives  │
│   • Executes workflow        │
│   • Streams response chunks  │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   Runtime adapter processes  │
│   • Parse SSE chunks         │
│   • Update message state     │
│   • Handle tool calls        │
└────────────┬─────────────────┘
             │
             ▼
┌──────────────────────────────┐
│   UI updates in real-time    │
│   • Streaming text           │
│   • Typing indicator         │
│   • Scroll management        │
└──────────────────────────────┘
```

### 3. Multi-Instance Coordination

```
┌─────────────────────────────────────────────────────────────────┐
│                         Page DOM                                 │
│                                                                  │
│  ┌─────────────────────┐     ┌─────────────────────┐           │
│  │ <div                │     │ <div                │           │
│  │   data-flowchat     │     │   data-flowchat     │           │
│  │   data-instance-id  │     │   data-instance-id  │           │
│  │   ="sales-bot">     │     │   ="support-bot">   │           │
│  │ </div>              │     │ </div>              │           │
│  └──────────┬──────────┘     └──────────┬──────────┘           │
│             │                           │                       │
│             │    ┌──────────────────────┤                       │
│             │    │                      │                       │
│             ▼    ▼                      ▼                       │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   FlowChat Instance Manager              │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │               Shared Context                      │   │   │
│  │  │  • Active instances Map<id, runtime>              │   │   │
│  │  │  • Event bus for cross-instance events            │   │   │
│  │  │  • Global state (minimized bubbles, etc.)         │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                           │                              │   │
│  │         ┌─────────────────┼─────────────────┐           │   │
│  │         ▼                 ▼                 ▼           │   │
│  │  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐   │   │
│  │  │ Instance A  │   │ Instance B  │   │ Bubble Inst │   │   │
│  │  │ Runtime     │   │ Runtime     │   │ Runtime     │   │   │
│  │  │ Adapter     │   │ Adapter     │   │ Adapter     │   │   │
│  │  │ State       │   │ State       │   │ State       │   │   │
│  │  └─────────────┘   └─────────────┘   └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Floating Bubble Container                   │   │
│  │  (position: fixed, rendered at body level)               │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## State Management Architecture

### Global State (React Context)

```typescript
interface FlowChatGlobalState {
  // Registered instances
  instances: Map<string, InstanceState>;
  
  // Bubble state (persists across pages via localStorage)
  bubble: {
    isOpen: boolean;
    isMinimized: boolean;
    activeInstanceId: string | null;
    unreadCount: number;
    position: { x: number; y: number };
  };
  
  // User preferences
  preferences: {
    soundEnabled: boolean;
    notificationsEnabled: boolean;
  };
  
  // Feature flags (from license)
  features: {
    multiInstance: boolean;
    bubble: boolean;
    history: boolean;
    analytics: boolean;
    whiteLabel: boolean;
  };
}
```

### Instance State (Per Chat)

```typescript
interface InstanceState {
  id: string;
  config: InstanceConfig;
  runtime: ExternalStoreRuntime;
  
  // Conversation state
  sessionId: string;
  messages: ThreadMessage[];
  isRunning: boolean;
  
  // UI state
  isExpanded: boolean;
  inputValue: string;
  attachments: File[];
  
  // History
  historyLoaded: boolean;
  historyError: string | null;
}
```

### Storage Strategy

| Data Type | Storage | Scope |
|-----------|---------|-------|
| Instance configs | wp_options | Server, all users |
| Chat history | wp_options / custom table | Server, per user |
| Session ID | sessionStorage | Browser tab |
| Bubble state | localStorage | Browser, cross-tab |
| Runtime state | React state | Memory, ephemeral |

## Security Architecture

### Authentication Flow

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│   Browser       │      │   WordPress     │      │   n8n           │
│   (React App)   │      │   (PHP API)     │      │   (Workflow)    │
└────────┬────────┘      └────────┬────────┘      └────────┬────────┘
         │                        │                        │
         │  1. Request with       │                        │
         │     WP nonce           │                        │
         │ ─────────────────────► │                        │
         │                        │                        │
         │                        │  2. Validate nonce     │
         │                        │     Check capabilities │
         │                        │                        │
         │                        │  3. Prepare signed     │
         │                        │     payload with       │
         │                        │     user metadata      │
         │                        │ ─────────────────────► │
         │                        │                        │
         │                        │                        │  4. Verify signature
         │                        │                        │     Process request
         │                        │                        │
         │                        │  5. Stream response    │
         │                        │ ◄───────────────────── │
         │                        │                        │
         │  6. Pass through       │                        │
         │     stream             │                        │
         │ ◄───────────────────── │                        │
         │                        │                        │
```

### Security Layers

1. **WordPress Nonce**: CSRF protection for all API requests
2. **Capability Check**: Verify user has permission to use chat
3. **Rate Limiting**: Prevent abuse (configurable per instance)
4. **Payload Signing**: HMAC signature for n8n requests (optional)
5. **Input Sanitization**: All user input sanitized before processing
6. **Output Escaping**: All dynamic content escaped before rendering

## Performance Considerations

### Optimization Strategies

| Area | Strategy |
|------|----------|
| Bundle Size | Code splitting, tree shaking, lazy loading |
| Initial Load | Critical CSS inline, deferred JS |
| Runtime | Virtual scrolling for long threads |
| Network | Request batching, connection reuse |
| Caching | Config caching, history pagination |

### Bundle Architecture

```
build/
├── index.js              # Main entry (admin detection, lazy load)
├── index.css             # Critical styles
├── chunks/
│   ├── chat.js           # Chat components (lazy)
│   ├── bubble.js         # Bubble components (lazy)
│   ├── admin.js          # Admin UI (lazy, admin only)
│   └── vendors.js        # Shared dependencies
└── index.asset.php       # WP dependencies manifest
```

## Error Handling Architecture

### Error Categories

| Category | Handling | User Feedback |
|----------|----------|---------------|
| Network | Retry with backoff | "Connection lost, retrying..." |
| n8n Timeout | Configurable timeout | Custom message from admin |
| Workflow Error | Log, notify | Custom error message |
| Rate Limited | Backoff, queue | "Please wait..." |
| Auth Failed | Re-authenticate | "Session expired" |

### Error Flow

```
Error occurs in runtime adapter
              │
              ▼
┌──────────────────────────┐
│   Classify error type    │
│   • Network / Timeout    │
│   • Server error         │
│   • Client error         │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│   Check retry policy     │
│   • Retryable? → Retry   │
│   • Max retries? → Fail  │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│   Get error message      │
│   • From admin config    │
│   • Fallback defaults    │
└───────────┬──────────────┘
            │
            ▼
┌──────────────────────────┐
│   Display to user        │
│   • In-chat message      │
│   • Toast notification   │
│   • Retry button         │
└──────────────────────────┘
```
