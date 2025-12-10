/**
 * Events Module
 *
 * Re-exports all event-related functionality.
 */

export {
  FlowChatEventBus,
  emitEvent,
  onEvent,
  onAnyEvent,
  useFlowChatEvent,
  useInstanceEvents,
  default as globalEventBus,
} from './FlowChatEventBus';

export type {
  FlowChatEventType,
  FlowChatEvent,
  FlowChatEventListener,
  FlowChatEventMap,
  InstanceReadyEvent,
  InstanceDestroyedEvent,
  MessageSentEvent,
  MessageReceivedEvent,
  BubbleOpenedEvent,
  BubbleClosedEvent,
  InstanceSwitchedEvent,
  ConnectionErrorEvent,
  ErrorEvent,
} from './FlowChatEventBus';
