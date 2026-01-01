"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useAssistantApi } from "../../context/index.js";
import { useCallback } from "react";
const useThreadListItemArchive = () => {
    const api = useAssistantApi();
    return useCallback(() => {
        api.threadListItem().archive();
    }, [api]);
};
export const ThreadListItemPrimitiveArchive = createActionButton("ThreadListItemPrimitive.Archive", useThreadListItemArchive);
//# sourceMappingURL=ThreadListItemArchive.js.map