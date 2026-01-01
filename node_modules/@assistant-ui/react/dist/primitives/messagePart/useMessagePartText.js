"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartText = () => {
    const text = useAssistantState(({ part }) => {
        if (part.type !== "text" && part.type !== "reasoning")
            throw new Error("MessagePartText can only be used inside text or reasoning message parts.");
        return part;
    });
    return text;
};
//# sourceMappingURL=useMessagePartText.js.map