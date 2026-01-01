"use client";
import { useAssistantState } from "../../context/index.js";
export const useMessagePartImage = () => {
    const image = useAssistantState(({ part }) => {
        if (part.type !== "image")
            throw new Error("MessagePartImage can only be used inside image message parts.");
        return part;
    });
    return image;
};
//# sourceMappingURL=useMessagePartImage.js.map