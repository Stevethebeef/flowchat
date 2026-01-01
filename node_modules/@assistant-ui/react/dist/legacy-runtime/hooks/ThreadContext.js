"use client";
import { useState } from "react";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
import { useAssistantApi, useAssistantEvent, useAssistantState, } from "../../context/react/index.js";
export function useThreadRuntime(options) {
    const api = useAssistantApi();
    const runtime = useAssistantState(() => api.thread.source ? (api.thread().__internal_getRuntime?.() ?? null) : null);
    if (!runtime && !options?.optional) {
        throw new Error("ThreadRuntime is not available");
    }
    return runtime;
}
/**
 * @deprecated Use `useAssistantState(({ thread }) => thread)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 *
 * Hook to access the current thread state.
 *
 * This hook provides reactive access to the thread's state, including messages,
 * running status, capabilities, and other thread-level properties.
 *
 * @param selector Optional selector function to pick specific state properties
 * @returns The selected thread state or the entire thread state if no selector provided
 *
 * @example
 * ```tsx
 * // Before:
 * function ThreadStatus() {
 *   const isRunning = useThread((state) => state.isRunning);
 *   const messageCount = useThread((state) => state.messages.length);
 *   return <div>Running: {isRunning}, Messages: {messageCount}</div>;
 * }
 *
 * // After:
 * function ThreadStatus() {
 *   const isRunning = useAssistantState(({ thread }) => thread.isRunning);
 *   const messageCount = useAssistantState(({ thread }) => thread.messages.length);
 *   return <div>Running: {isRunning}, Messages: {messageCount}</div>;
 * }
 * ```
 */
export const useThread = createStateHookForRuntime(useThreadRuntime);
const useThreadComposerRuntime = (opt) => useThreadRuntime(opt)?.composer ?? null;
/**
 * @deprecated Use `useAssistantState(({ thread }) => thread.composer)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 */
export const useThreadComposer = createStateHookForRuntime(useThreadComposerRuntime);
export function useThreadModelContext(options) {
    const [, rerender] = useState({});
    const runtime = useThreadRuntime(options);
    useAssistantEvent("thread.model-context-update", () => rerender({}));
    if (!runtime)
        return null;
    return runtime?.getModelContext();
}
//# sourceMappingURL=ThreadContext.js.map