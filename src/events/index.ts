/**
 * Events Module
 *
 * Re-exports all event-related functionality.
 */

export {
  N8nChatEventBus,
  emitEvent,
  onEvent,
  onAnyEvent,
  useN8nChatEvent,
  useInstanceEvents,
  default as globalEventBus,
} from './N8nChatEventBus';

export type {
  N8nChatEventType,
  N8nChatEvent,
  N8nChatEventListener,
  N8nChatEventMap,
  InstanceReadyEvent,
  InstanceDestroyedEvent,
  MessageSentEvent,
  MessageReceivedEvent,
  BubbleOpenedEvent,
  BubbleClosedEvent,
  InstanceSwitchedEvent,
  ConnectionErrorEvent,
  ErrorEvent,
} from './N8nChatEventBus';
