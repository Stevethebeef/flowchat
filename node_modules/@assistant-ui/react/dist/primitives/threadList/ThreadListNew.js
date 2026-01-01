"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { Primitive } from "@radix-ui/react-primitive";
import { composeEventHandlers } from "@radix-ui/primitive";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
export const ThreadListPrimitiveNew = forwardRef(({ onClick, disabled, ...props }, forwardedRef) => {
    const isMain = useAssistantState(({ threads }) => threads.newThreadId === threads.mainThreadId);
    const api = useAssistantApi();
    return (_jsx(Primitive.button, { type: "button", ...(isMain ? { "data-active": "true", "aria-current": "true" } : null), ...props, ref: forwardedRef, disabled: disabled, onClick: composeEventHandlers(onClick, () => {
            api.threads().switchToNewThread();
        }) }));
});
ThreadListPrimitiveNew.displayName = "ThreadListPrimitive.New";
//# sourceMappingURL=ThreadListNew.js.map