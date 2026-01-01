"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useAssistantApi } from "../../context/index.js";
import { useCallback } from "react";
const useThreadListItemUnarchive = () => {
    const api = useAssistantApi();
    return useCallback(() => {
        api.threadListItem().unarchive();
    }, [api]);
};
export const ThreadListItemPrimitiveUnarchive = createActionButton("ThreadListItemPrimitive.Unarchive", useThreadListItemUnarchive);
//# sourceMappingURL=ThreadListItemUnarchive.js.map