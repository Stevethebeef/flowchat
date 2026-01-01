"use client";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
import { useAssistantApi, useAssistantState } from "../../context/react/index.js";
export function useThreadListItemRuntime(options) {
    const api = useAssistantApi();
    const runtime = useAssistantState(() => api.threadListItem.source
        ? (api.threadListItem().__internal_getRuntime?.() ?? null)
        : null);
    if (!runtime && !options?.optional) {
        throw new Error("ThreadListItemRuntime is not available");
    }
    return runtime;
}
/**
 * @deprecated Use `useAssistantState(({ threadListItem }) => threadListItem)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 */
export const useThreadListItem = createStateHookForRuntime(useThreadListItemRuntime);
//# sourceMappingURL=ThreadListItemContext.js.map