"use client";
import { useEffect } from "react";
import { useAssistantApi } from "../context/react/AssistantApiContext.js";
const getInstructions = (instruction) => {
    if (typeof instruction === "string")
        return { instruction };
    return instruction;
};
export const useAssistantInstructions = (config) => {
    const { instruction, disabled = false } = getInstructions(config);
    const api = useAssistantApi();
    useEffect(() => {
        if (disabled)
            return;
        const config = {
            system: instruction,
        };
        return api.modelContext().register({
            getModelContext: () => config,
        });
    }, [api, instruction, disabled]);
};
//# sourceMappingURL=useAssistantInstructions.js.map