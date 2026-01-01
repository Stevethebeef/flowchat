"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback } from "react";
import { composeEventHandlers } from "@radix-ui/primitive";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
import { Primitive } from "@radix-ui/react-primitive";
const useActionBarFeedbackPositive = () => {
    const api = useAssistantApi();
    const callback = useCallback(() => {
        api.message().submitFeedback({ type: "positive" });
    }, [api]);
    return callback;
};
export const ActionBarPrimitiveFeedbackPositive = forwardRef(({ onClick, disabled, ...props }, forwardedRef) => {
    const isSubmitted = useAssistantState((s) => s.message.metadata.submittedFeedback?.type === "positive");
    const callback = useActionBarFeedbackPositive();
    return (_jsx(Primitive.button, { type: "button", ...(isSubmitted ? { "data-submitted": "true" } : {}), ...props, ref: forwardedRef, disabled: disabled || !callback, onClick: composeEventHandlers(onClick, () => {
            callback?.();
        }) }));
});
ActionBarPrimitiveFeedbackPositive.displayName =
    "ActionBarPrimitive.FeedbackPositive";
//# sourceMappingURL=ActionBarFeedbackPositive.js.map