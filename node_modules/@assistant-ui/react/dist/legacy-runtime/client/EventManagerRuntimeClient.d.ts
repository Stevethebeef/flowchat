import { Unsubscribe } from "../../types/Unsubscribe.js";
import { AssistantEventMap, AssistantEvent, AssistantEventCallback } from "../../types/EventTypes.js";
export type EventManager = {
    on<TEvent extends AssistantEvent>(event: TEvent, callback: AssistantEventCallback<TEvent>): Unsubscribe;
    emit<TEvent extends Exclude<AssistantEvent, "*">>(event: TEvent, payload: AssistantEventMap[TEvent]): void;
};
export declare const EventManager: import("@assistant-ui/tap").Resource<{
    on: <TEvent extends AssistantEvent>(event: TEvent, callback: AssistantEventCallback<TEvent>) => () => void;
    emit: <TEvent extends Exclude<AssistantEvent, "*">>(event: TEvent, payload: AssistantEventMap[TEvent]) => void;
}, undefined>;
//# sourceMappingURL=EventManagerRuntimeClient.d.ts.map