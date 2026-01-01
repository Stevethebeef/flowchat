"use client";
import { createStateHookForRuntime } from "../../context/react/utils/createStateHookForRuntime.js";
import { useAssistantApi, useAssistantState } from "../../context/react/index.js";
export function useAttachmentRuntime(options) {
    const api = useAssistantApi();
    const runtime = useAssistantState(() => api.attachment.source
        ? (api.attachment().__internal_getRuntime?.() ?? null)
        : null);
    if (!runtime && !options?.optional) {
        throw new Error("AttachmentRuntime is not available");
    }
    return runtime;
}
export function useThreadComposerAttachmentRuntime(options) {
    const attachmentRuntime = useAttachmentRuntime(options);
    if (!attachmentRuntime)
        return null;
    if (attachmentRuntime.source !== "thread-composer")
        throw new Error("This component must be used within a thread's ComposerPrimitive.Attachments component.");
    return attachmentRuntime;
}
export function useEditComposerAttachmentRuntime(options) {
    const attachmentRuntime = useAttachmentRuntime(options);
    if (!attachmentRuntime)
        return null;
    if (attachmentRuntime.source !== "edit-composer")
        throw new Error("This component must be used within a message's ComposerPrimitive.Attachments component.");
    return attachmentRuntime;
}
export function useMessageAttachmentRuntime(options) {
    const attachmentRuntime = useAttachmentRuntime(options);
    if (!attachmentRuntime)
        return null;
    if (attachmentRuntime.source !== "message")
        throw new Error("This component must be used within a MessagePrimitive.Attachments component.");
    return attachmentRuntime;
}
/**
 * @deprecated Use `useAssistantState(({ attachment }) => attachment)` instead. See migration guide: https://docs.assistant-ui.com/docs/migrations/v0-12
 */
export const useAttachment = createStateHookForRuntime(useAttachmentRuntime);
export const useThreadComposerAttachment = createStateHookForRuntime(useThreadComposerAttachmentRuntime);
export const useEditComposerAttachment = createStateHookForRuntime(useEditComposerAttachmentRuntime);
export const useMessageAttachment = createStateHookForRuntime(useMessageAttachmentRuntime);
//# sourceMappingURL=AttachmentContext.js.map