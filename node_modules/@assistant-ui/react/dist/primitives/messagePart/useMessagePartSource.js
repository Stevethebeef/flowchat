"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartSource = () => {
    const source = useAssistantState(({ part }) => {
        if (part.type !== "source")
            throw new Error("MessagePartSource can only be used inside source message parts.");
        return part;
    });
    return source;
};
//# sourceMappingURL=useMessagePartSource.js.map