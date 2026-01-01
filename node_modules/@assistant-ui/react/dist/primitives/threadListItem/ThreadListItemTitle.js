"use client";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useAssistantState } from "../../context/index.js";
export const ThreadListItemPrimitiveTitle = ({ fallback }) => {
    const title = useAssistantState(({ threadListItem }) => threadListItem.title);
    return _jsx(_Fragment, { children: title || fallback });
};
ThreadListItemPrimitiveTitle.displayName = "ThreadListItemPrimitive.Title";
//# sourceMappingURL=ThreadListItemTitle.js.map