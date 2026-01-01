"use client";
import { useEffect } from "react";
import { useAssistantApi } from "../context/react/AssistantApiContext.js";
export const useAssistantToolUI = (tool) => {
    const api = useAssistantApi();
    useEffect(() => {
        if (!tool?.toolName || !tool?.render)
            return undefined;
        return api.tools().setToolUI(tool.toolName, tool.render);
    }, [api, tool?.toolName, tool?.render]);
};
//# sourceMappingURL=useAssistantToolUI.js.map