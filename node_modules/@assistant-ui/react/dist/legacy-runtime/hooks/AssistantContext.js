"use client";
import { useAssistantApi } from "../../context/react/AssistantApiContext.js";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
export function useAssistantRuntime(options) {
    const api = useAssistantApi();
    const runtime = api.threads().__internal_getAssistantRuntime?.() ?? null;
    if (!runtime && !options?.optional) {
        throw new Error("AssistantRuntime is not available");
    }
    return runtime;
}
const useThreadListRuntime = (opt) => useAssistantRuntime(opt)?.threads ?? null;
/**
 * @deprecated Use `useAssistantState(({ threads }) => threads)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 */
export const useThreadList = createStateHookForRuntime(useThreadListRuntime);
//# sourceMappingURL=AssistantContext.js.map