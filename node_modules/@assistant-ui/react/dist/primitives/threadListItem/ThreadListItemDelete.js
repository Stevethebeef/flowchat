"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useAssistantApi } from "../../context/index.js";
import { useCallback } from "react";
const useThreadListItemDelete = () => {
    const api = useAssistantApi();
    return useCallback(() => {
        api.threadListItem().delete();
    }, [api]);
};
export const ThreadListItemPrimitiveDelete = createActionButton("ThreadListItemPrimitive.Delete", useThreadListItemDelete);
//# sourceMappingURL=ThreadListItemDelete.js.map