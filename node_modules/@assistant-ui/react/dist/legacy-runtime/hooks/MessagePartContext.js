"use client";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
import { useAssistantApi, useAssistantState } from "../../context/react/index.js";
export function useMessagePartRuntime(options) {
    const api = useAssistantApi();
    const runtime = useAssistantState(() => api.part.source ? (api.part().__internal_getRuntime?.() ?? null) : null);
    if (!runtime && !options?.optional) {
        throw new Error("MessagePartRuntime is not available");
    }
    return runtime;
}
/**
 * @deprecated Use `useAssistantState(({ part }) => part)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 */
export const useMessagePart = createStateHookForRuntime(useMessagePartRuntime);
//# sourceMappingURL=MessagePartContext.js.map