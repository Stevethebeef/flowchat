"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartData = (name) => {
    const part = useAssistantState(({ part }) => {
        if (part.type !== "data") {
            return null;
        }
        return part;
    });
    if (!part) {
        return null;
    }
    if (name && part.name !== name) {
        return null;
    }
    return part;
};
//# sourceMappingURL=useMessagePartData.js.map