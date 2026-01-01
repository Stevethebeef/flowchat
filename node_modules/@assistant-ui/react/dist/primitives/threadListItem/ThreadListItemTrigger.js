"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useAssistantApi } from "../../context/index.js";
import { useCallback } from "react";
const useThreadListItemTrigger = () => {
    const api = useAssistantApi();
    return useCallback(() => {
        api.threadListItem().switchTo();
    }, [api]);
};
export const ThreadListItemPrimitiveTrigger = createActionButton("ThreadListItemPrimitive.Trigger", useThreadListItemTrigger);
//# sourceMappingURL=ThreadListItemTrigger.js.map