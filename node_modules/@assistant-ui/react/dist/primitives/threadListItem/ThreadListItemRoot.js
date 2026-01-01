"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Primitive } from "@radix-ui/react-primitive";
import { forwardRef } from "react";
import { useAssistantState } from "../../context/index.js";
export const ThreadListItemPrimitiveRoot = forwardRef((props, ref) => {
    const isMain = useAssistantState(({ threads, threadListItem }) => threads.mainThreadId === threadListItem.id);
    return (_jsx(Primitive.div, { ...(isMain ? { "data-active": "true", "aria-current": "true" } : null), ...props, ref: ref }));
});
ThreadListItemPrimitiveRoot.displayName = "ThreadListItemPrimitive.Root";
//# sourceMappingURL=ThreadListItemRoot.js.map