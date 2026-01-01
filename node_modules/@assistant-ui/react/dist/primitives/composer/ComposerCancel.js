"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useCallback } from "react";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
const useComposerCancel = () => {
    const api = useAssistantApi();
    const disabled = useAssistantState(({ composer }) => !composer.canCancel);
    const callback = useCallback(() => {
        api.composer().cancel();
    }, [api]);
    if (disabled)
        return null;
    return callback;
};
/**
 * A button component that cancels the current message composition.
 *
 * This component automatically handles the cancel functionality and is disabled
 * when canceling is not available.
 *
 * @example
 * ```tsx
 * <ComposerPrimitive.Cancel>
 *   Cancel
 * </ComposerPrimitive.Cancel>
 * ```
 */
export const ComposerPrimitiveCancel = createActionButton("ComposerPrimitive.Cancel", useComposerCancel);
//# sourceMappingURL=ComposerCancel.js.map