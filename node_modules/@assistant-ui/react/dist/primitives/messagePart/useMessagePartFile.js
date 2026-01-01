"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartFile = () => {
    const file = useAssistantState(({ part }) => {
        if (part.type !== "file")
            throw new Error("MessagePartFile can only be used inside file message parts.");
        return part;
    });
    return file;
};
//# sourceMappingURL=useMessagePartFile.js.map