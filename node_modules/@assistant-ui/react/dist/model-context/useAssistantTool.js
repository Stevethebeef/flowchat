"use client";
import { useEffect } from "react";
import { useAssistantApi } from "../context/react/AssistantApiContext.js";
export const useAssistantTool = (tool) => {
    const api = useAssistantApi();
    useEffect(() => {
        if (!tool.render)
            return undefined;
        return api.tools().setToolUI(tool.toolName, tool.render);
    }, [api, tool.toolName, tool.render]);
    useEffect(() => {
        const { toolName, render, ...rest } = tool;
        const context = {
            tools: {
                [toolName]: rest,
            },
        };
        return api.modelContext().register({
            getModelContext: () => context,
        });
    }, [api, tool]);
};
//# sourceMappingURL=useAssistantTool.js.map