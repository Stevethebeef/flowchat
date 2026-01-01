"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useCallback } from "react";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
export const useComposerSend = () => {
    const api = useAssistantApi();
    const disabled = useAssistantState((s) => s.thread.isRunning || !s.composer.isEditing || s.composer.isEmpty);
    const callback = useCallback(() => {
        api.composer().send();
    }, [api]);
    if (disabled)
        return null;
    return callback;
};
/**
 * A button component that sends the current message in the composer.
 *
 * This component automatically handles the send functionality and is disabled
 * when sending is not available (e.g., when the thread is running, the composer
 * is empty, or not in editing mode).
 *
 * @example
 * ```tsx
 * <ComposerPrimitive.Send>
 *   Send Message
 * </ComposerPrimitive.Send>
 * ```
 */
export const ComposerPrimitiveSend = createActionButton("ComposerPrimitive.Send", useComposerSend);
//# sourceMappingURL=ComposerSend.js.map