"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartReasoning = () => {
    const text = useAssistantState(({ part }) => {
        if (part.type !== "reasoning")
            throw new Error("MessagePartReasoning can only be used inside reasoning message parts.");
        return part;
    });
    return text;
};
//# sourceMappingURL=useMessagePartReasoning.js.map