"use client";
import { useAssistantApi, useAssistantState } from "../../context/react/index.js";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
export function useComposerRuntime(options) {
    const api = useAssistantApi();
    const runtime = useAssistantState(() => api.composer.source
        ? (api.composer().__internal_getRuntime?.() ?? null)
        : null);
    if (!runtime && !options?.optional) {
        throw new Error("ComposerRuntime is not available");
    }
    return runtime;
}
/**
 * @deprecated Use `useAssistantState(({ composer }) => composer)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 *
 * Hook to access the current composer state.
 *
 * This hook provides reactive access to the composer's state, including text content,
 * attachments, editing status, and send/cancel capabilities.
 *
 * @param selector Optional selector function to pick specific state properties
 * @returns The selected composer state or the entire composer state if no selector provided
 *
 * @example
 * ```tsx
 * // Before:
 * function ComposerStatus() {
 *   const text = useComposer((state) => state.text);
 *   const canSend = useComposer((state) => state.canSend);
 *   const attachmentCount = useComposer((state) => state.attachments.length);
 *   return (
 *     <div>
 *       Text: {text.length} chars,
 *       Attachments: {attachmentCount},
 *       Can send: {canSend}
 *     </div>
 *   );
 * }
 *
 * // After:
 * function ComposerStatus() {
 *   const text = useAssistantState(({ composer }) => composer.text);
 *   const canSend = useAssistantState(({ composer }) => composer.canSend);
 *   const attachmentCount = useAssistantState(({ composer }) => composer.attachments.length);
 *   return (
 *     <div>
 *       Text: {text.length} chars,
 *       Attachments: {attachmentCount},
 *       Can send: {canSend}
 *     </div>
 *   );
 * }
 * ```
 */
export const useComposer = createStateHookForRuntime(useComposerRuntime);
//# sourceMappingURL=ComposerContext.js.map