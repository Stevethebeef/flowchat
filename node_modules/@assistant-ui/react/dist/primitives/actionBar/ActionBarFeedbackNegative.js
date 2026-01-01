"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { composeEventHandlers } from "@radix-ui/primitive";
import { Primitive } from "@radix-ui/react-primitive";
import { useCallback } from "react";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
const useActionBarFeedbackNegative = () => {
    const api = useAssistantApi();
    const callback = useCallback(() => {
        api.message().submitFeedback({ type: "negative" });
    }, [api]);
    return callback;
};
export const ActionBarPrimitiveFeedbackNegative = forwardRef(({ onClick, disabled, ...props }, forwardedRef) => {
    const isSubmitted = useAssistantState((s) => s.message.metadata.submittedFeedback?.type === "negative");
    const callback = useActionBarFeedbackNegative();
    return (_jsx(Primitive.button, { type: "button", ...(isSubmitted ? { "data-submitted": "true" } : {}), ...props, ref: forwardedRef, disabled: disabled || !callback, onClick: composeEventHandlers(onClick, () => {
            callback?.();
        }) }));
});
ActionBarPrimitiveFeedbackNegative.displayName =
    "ActionBarPrimitive.FeedbackNegative";
//# sourceMappingURL=ActionBarFeedbackNegative.js.map