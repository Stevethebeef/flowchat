# FlowChat - Multi-Instance Configuration System

## Overview

FlowChat's multi-instance architecture allows site owners to create and manage multiple independent chat configurations. Each instance can connect to a different n8n workflow, have unique styling, and serve different purposes.

## Use Cases

### 1. Multiple Chatbots by Function
- **Sales Bot**: Product inquiries, pricing questions
- **Support Bot**: Technical support, troubleshooting
- **FAQ Bot**: Common questions, self-service

### 2. Department-Specific Chats
- **HR Chat**: Employee questions, benefits
- **IT Helpdesk**: Technical issues, access requests
- **Finance**: Invoice inquiries, payment status

### 3. Audience-Specific Chats
- **Visitor Chat**: General inquiries, lead capture
- **Customer Chat**: Order status, account management (login required)
- **Partner Chat**: B2B inquiries, partnership info

### 4. Language/Region Variants
- **English Support**: Default language
- **Spanish Support**: Spanish-speaking customers
- **German Support**: German-speaking customers

## Architecture

### Instance Identification

```typescript
interface InstanceIdentifier {
  id: string;           // Unique slug: "sales-bot", "support-de"
  name: string;         // Display name: "Sales Assistant"
  description?: string; // Admin notes
}
```

**ID Rules**:
- Lowercase alphanumeric and hyphens only
- 3-50 characters
- Must be unique across all instances
- Cannot be changed after creation (without migration)

### Instance Configuration Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    Global Defaults                               │
│   flowchat_global_settings.defaults                             │
│   Applied to all instances unless overridden                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Template Settings                             │
│   flowchat_templates[].config                                   │
│   Pre-built configurations that can be applied                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Instance Settings                              │
│   flowchat_instances[].{all settings}                           │
│   Instance-specific overrides                                    │
└─────────────────────────────────────────────────────────────────┘
```

### Configuration Merge Strategy

```typescript
function getInstanceConfig(instanceId: string): InstanceConfig {
  const globalDefaults = getOption('flowchat_global_settings').defaults;
  const instance = getOption('flowchat_instances').find(i => i.id === instanceId);
  
  if (!instance) {
    throw new Error(`Instance not found: ${instanceId}`);
  }
  
  // Get template config if specified
  let templateConfig = {};
  if (instance.appearance.template !== 'custom') {
    const template = getOption('flowchat_templates')
      .find(t => t.id === instance.appearance.template);
    templateConfig = template?.config || {};
  }
  
  // Deep merge: defaults < template < instance
  return deepMerge(
    globalDefaults,
    templateConfig,
    instance
  );
}
```

## Frontend Instance Management

### Instance Manager Context

```typescript
// contexts/InstanceManagerContext.tsx

interface InstanceManagerState {
  // All configured instances (from PHP config)
  availableInstances: Map<string, InstanceConfig>;
  
  // Currently mounted instances (with runtimes)
  activeInstances: Map<string, ActiveInstance>;
  
  // Global UI state
  bubbleState: BubbleState;
  
  // Methods
  mountInstance: (containerId: string, instanceId: string) => void;
  unmountInstance: (containerId: string) => void;
  getRuntime: (instanceId: string) => ExternalStoreRuntime | null;
  switchBubbleInstance: (instanceId: string) => void;
}

interface ActiveInstance {
  id: string;
  containerId: string;
  runtime: ExternalStoreRuntime;
  sessionId: string;
  state: InstanceState;
}

interface BubbleState {
  isOpen: boolean;
  isMinimized: boolean;
  activeInstanceId: string | null;
  unreadCounts: Record<string, number>;
  position: { x: number; y: number };
}
```

### Instance Mounting Process

```typescript
// When a chat container is found in the DOM:

function mountInstance(containerId: string, instanceId: string): void {
  const config = availableInstances.get(instanceId);
  if (!config) {
    console.error(`Instance config not found: ${instanceId}`);
    return;
  }
  
  // Check license for multi-instance
  if (activeInstances.size >= 1 && !features.multiInstance) {
    console.warn('Multi-instance requires Premium license');
    return;
  }
  
  // Check if instance already active
  if (activeInstances.has(containerId)) {
    console.warn(`Container already has active instance: ${containerId}`);
    return;
  }
  
  // Create runtime adapter for this instance
  const runtime = createN8nRuntime({
    instanceId: config.id,
    endpoint: config.endpoint,
    auth: config.auth,
    behavior: config.behavior,
    onError: (error) => handleInstanceError(instanceId, error),
  });
  
  // Generate or restore session ID
  const sessionId = getOrCreateSessionId(instanceId);
  
  // Load history if enabled
  if (config.features.history.enabled) {
    loadHistory(instanceId, sessionId).then(messages => {
      runtime.setMessages(messages);
    });
  }
  
  // Register active instance
  activeInstances.set(containerId, {
    id: instanceId,
    containerId,
    runtime,
    sessionId,
    state: {
      isExpanded: false,
      inputValue: '',
      attachments: [],
    }
  });
  
  // Mount React component
  const container = document.getElementById(containerId);
  const root = createRoot(container);
  root.render(
    <AssistantRuntimeProvider runtime={runtime}>
      <ChatInstance config={config} />
    </AssistantRuntimeProvider>
  );
}
```

### Multi-Container Discovery

```typescript
// On app initialization:

function initializeFlowChat(): void {
  // Configuration passed from PHP
  const config = window.flowchatConfig;
  
  // Store available instances
  config.instances.forEach(instance => {
    availableInstances.set(instance.id, instance);
  });
  
  // Find and mount inline chat containers
  const inlineContainers = document.querySelectorAll('[data-flowchat]');
  inlineContainers.forEach(container => {
    const instanceId = container.dataset.instanceId || config.defaultInstance;
    mountInstance(container.id, instanceId);
  });
  
  // Mount bubble if enabled and licensed
  if (config.bubble.enabled && features.bubble) {
    mountBubble(config.bubble.defaultInstance);
  }
}
```

## Instance Switching

### Bubble Instance Switching UI

When multiple instances are available and switching is enabled, the bubble shows an instance selector:

```typescript
interface InstanceSwitcherProps {
  instances: InstanceConfig[];
  activeInstanceId: string;
  onSwitch: (instanceId: string) => void;
  unreadCounts: Record<string, number>;
}

function InstanceSwitcher({ 
  instances, 
  activeInstanceId, 
  onSwitch,
  unreadCounts 
}: InstanceSwitcherProps) {
  return (
    <div className="flowchat-instance-switcher">
      {instances.map(instance => (
        <button
          key={instance.id}
          className={cn(
            'flowchat-instance-tab',
            instance.id === activeInstanceId && 'active'
          )}
          onClick={() => onSwitch(instance.id)}
        >
          {instance.appearance.avatar?.assistant_image ? (
            <img src={instance.appearance.avatar.assistant_image} alt="" />
          ) : (
            <span className="avatar-fallback">
              {instance.name.charAt(0)}
            </span>
          )}
          <span className="instance-name">{instance.name}</span>
          {unreadCounts[instance.id] > 0 && (
            <span className="unread-badge">{unreadCounts[instance.id]}</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### Switching Behavior

```typescript
function switchBubbleInstance(newInstanceId: string): void {
  const currentInstance = activeInstances.get('bubble-container');
  
  // Save current conversation state
  if (currentInstance) {
    saveInstanceState(currentInstance.id, {
      messages: currentInstance.runtime.getMessages(),
      inputValue: currentInstance.state.inputValue,
    });
  }
  
  // Unmount current
  unmountInstance('bubble-container');
  
  // Mount new instance
  mountInstance('bubble-container', newInstanceId);
  
  // Restore state if available
  const savedState = loadInstanceState(newInstanceId);
  if (savedState) {
    const instance = activeInstances.get('bubble-container');
    instance.runtime.setMessages(savedState.messages);
    instance.state.inputValue = savedState.inputValue;
  }
  
  // Update bubble state
  setBubbleState(prev => ({
    ...prev,
    activeInstanceId: newInstanceId,
  }));
}
```

## Session Management

### Session ID Strategy

```typescript
// Each instance maintains its own session ID
// Format: flowchat_{instanceId}_{sessionId}

function getOrCreateSessionId(instanceId: string): string {
  const storageKey = `flowchat_session_${instanceId}`;
  const config = availableInstances.get(instanceId);
  
  // Check for existing session
  let sessionId = sessionStorage.getItem(storageKey);
  
  // Create new if not exists or if history disabled
  if (!sessionId || !config.features.history.persist_across_sessions) {
    sessionId = generateUUID();
    sessionStorage.setItem(storageKey, sessionId);
  }
  
  return sessionId;
}

// For persistent sessions (logged-in users with history)
function getPersistentSessionId(instanceId: string, userId: number): string {
  // Request from server - creates or retrieves existing
  return fetchSessionId(instanceId, userId);
}
```

### Per-Instance Storage Keys

```typescript
const STORAGE_KEYS = {
  session: (id: string) => `flowchat_session_${id}`,
  history: (id: string) => `flowchat_history_${id}`,
  state: (id: string) => `flowchat_state_${id}`,
  unread: (id: string) => `flowchat_unread_${id}`,
};

// Cross-instance state (bubble position, etc.)
const GLOBAL_STORAGE_KEY = 'flowchat_global';
```

## Same-Page Instance Handling

### Multiple Inline Chats

```html
<!-- Page with multiple inline chats -->
<div class="product-comparison">
  <div class="product-card">
    <h3>Product A</h3>
    <div data-flowchat 
         data-instance-id="product-a-support"
         id="chat-product-a">
    </div>
  </div>
  
  <div class="product-card">
    <h3>Product B</h3>
    <div data-flowchat 
         data-instance-id="product-b-support"
         id="chat-product-b">
    </div>
  </div>
</div>

<!-- Plus floating bubble -->
<!-- Rendered at body level -->
```

### Instance Isolation

Each instance is completely isolated:

1. **Runtime**: Separate `ExternalStoreRuntime` per instance
2. **State**: Independent React state trees
3. **Session**: Unique session IDs
4. **History**: Separate localStorage/API entries
5. **Styling**: CSS variables scoped to container

```css
/* Each container gets scoped CSS variables */
#chat-product-a {
  --flowchat-primary: #0066cc;
  --flowchat-background: #ffffff;
}

#chat-product-b {
  --flowchat-primary: #cc6600;
  --flowchat-background: #f9f9f9;
}
```

## Event Communication

### Cross-Instance Events

For advanced use cases, instances can communicate via an event bus:

```typescript
// Event types for cross-instance communication
type FlowChatEvent = 
  | { type: 'INSTANCE_READY'; instanceId: string }
  | { type: 'MESSAGE_SENT'; instanceId: string; messageId: string }
  | { type: 'MESSAGE_RECEIVED'; instanceId: string; messageId: string }
  | { type: 'BUBBLE_OPENED'; instanceId: string }
  | { type: 'BUBBLE_CLOSED'; instanceId: string }
  | { type: 'INSTANCE_SWITCHED'; from: string; to: string };

class FlowChatEventBus {
  private listeners: Map<string, Set<(event: FlowChatEvent) => void>> = new Map();
  
  subscribe(eventType: string, callback: (event: FlowChatEvent) => void): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(callback);
    
    return () => this.listeners.get(eventType)?.delete(callback);
  }
  
  emit(event: FlowChatEvent): void {
    this.listeners.get(event.type)?.forEach(callback => callback(event));
    this.listeners.get('*')?.forEach(callback => callback(event));
  }
}

// Global event bus instance
const eventBus = new FlowChatEventBus();
window.flowchatEvents = eventBus;
```

### External Integration Hooks

```javascript
// External scripts can listen to FlowChat events
window.flowchatEvents.subscribe('MESSAGE_SENT', (event) => {
  // Track in analytics
  gtag('event', 'chat_message_sent', {
    instance: event.instanceId,
  });
});

window.flowchatEvents.subscribe('BUBBLE_OPENED', (event) => {
  // Update page state
  document.body.classList.add('chat-active');
});
```

## Admin Multi-Instance Management

### Instance List Operations

```php
<?php
namespace FlowChat\Admin;

class InstanceManager {
  
  /**
   * Get all instances with computed properties
   */
  public function get_all(): array {
    $instances = get_option('flowchat_instances', []);
    $license = get_option('flowchat_license', []);
    
    // Check limits
    $max_instances = $this->get_instance_limit($license);
    
    return array_map(function($instance, $index) use ($max_instances) {
      return array_merge($instance, [
        'is_over_limit' => $index >= $max_instances,
        'can_edit' => $index < $max_instances,
      ]);
    }, $instances, array_keys($instances));
  }
  
  /**
   * Create new instance
   */
  public function create(array $data): array|WP_Error {
    $instances = get_option('flowchat_instances', []);
    $license = get_option('flowchat_license', []);
    
    // Check limit
    if (count($instances) >= $this->get_instance_limit($license)) {
      return new WP_Error(
        'limit_reached',
        'Instance limit reached. Upgrade to Premium for unlimited instances.'
      );
    }
    
    // Validate
    $errors = InstanceValidator::validate($data);
    if (!empty($errors)) {
      return new WP_Error('validation_failed', implode(', ', $errors));
    }
    
    // Check ID uniqueness
    if ($this->instance_exists($data['id'])) {
      return new WP_Error('duplicate_id', 'Instance ID already exists.');
    }
    
    // Add timestamps
    $data['created_at'] = current_time('mysql');
    $data['updated_at'] = current_time('mysql');
    
    // Save
    $instances[] = $data;
    update_option('flowchat_instances', $instances);
    
    return $data;
  }
  
  /**
   * Duplicate instance
   */
  public function duplicate(string $source_id): array|WP_Error {
    $source = $this->get($source_id);
    if (!$source) {
      return new WP_Error('not_found', 'Source instance not found.');
    }
    
    // Generate new ID
    $new_id = $this->generate_unique_id($source['id'] . '-copy');
    
    // Clone config
    $clone = $source;
    $clone['id'] = $new_id;
    $clone['name'] = $source['name'] . ' (Copy)';
    $clone['usage_count'] = 0;
    $clone['last_used'] = null;
    
    return $this->create($clone);
  }
  
  /**
   * Reorder instances
   */
  public function reorder(array $order): bool {
    $instances = get_option('flowchat_instances', []);
    $indexed = array_column($instances, null, 'id');
    
    $reordered = [];
    foreach ($order as $id) {
      if (isset($indexed[$id])) {
        $reordered[] = $indexed[$id];
      }
    }
    
    // Add any missing instances at the end
    foreach ($instances as $instance) {
      if (!in_array($instance['id'], $order)) {
        $reordered[] = $instance;
      }
    }
    
    return update_option('flowchat_instances', $reordered);
  }
  
  private function get_instance_limit(array $license): int {
    if (($license['status'] ?? 'free') === 'active') {
      return PHP_INT_MAX; // Unlimited
    }
    return 1; // Free tier
  }
}
```

### Import/Export

```php
<?php
/**
 * Export single instance configuration
 */
public function export_instance(string $id): array {
  $instance = $this->get($id);
  if (!$instance) {
    return [];
  }
  
  return [
    'version' => FLOWCHAT_VERSION,
    'exported_at' => current_time('mysql'),
    'instance' => $instance,
  ];
}

/**
 * Import instance configuration
 */
public function import_instance(array $data): array|WP_Error {
  if (empty($data['instance'])) {
    return new WP_Error('invalid_data', 'Invalid import data.');
  }
  
  $instance = $data['instance'];
  
  // Check if ID exists, rename if needed
  if ($this->instance_exists($instance['id'])) {
    $instance['id'] = $this->generate_unique_id($instance['id']);
    $instance['name'] = $instance['name'] . ' (Imported)';
  }
  
  return $this->create($instance);
}
```

## Free vs Premium Instance Limits

| Feature | Free | Premium |
|---------|------|---------|
| Max instances | 1 | Unlimited |
| Instance switching | N/A | ✓ |
| Per-instance history | ✗ | ✓ |
| Instance analytics | ✗ | ✓ |
| Instance export/import | ✗ | ✓ |
| Instance duplication | ✗ | ✓ |

### Limit Enforcement

```typescript
// Frontend check before mounting additional instances
function canMountInstance(): boolean {
  const { features, activeInstances } = useInstanceManager();
  
  if (activeInstances.size === 0) {
    return true; // First instance always allowed
  }
  
  return features.multiInstance;
}

// Show upgrade prompt for blocked features
function UpgradePrompt() {
  return (
    <div className="flowchat-upgrade-prompt">
      <p>Multiple chat instances require Premium.</p>
      <a href={upgradeUrl}>Upgrade Now →</a>
    </div>
  );
}
```
