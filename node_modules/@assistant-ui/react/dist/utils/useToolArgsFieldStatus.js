import { getPartialJsonObjectFieldState } from "assistant-stream/utils";
import { useAssistantState } from "../context/index.js";
const COMPLETE_STATUS = { type: "complete" };
export const useToolArgsFieldStatus = (fieldPath) => {
    return useAssistantState(({ part }) => {
        if (part.type !== "tool-call")
            throw new Error("useToolArgsFieldStatus can only be used inside tool-call message parts");
        const state = getPartialJsonObjectFieldState(part.args, fieldPath);
        if (state === "complete" || part.status?.type === "requires-action")
            return COMPLETE_STATUS;
        return part.status;
    });
};
//# sourceMappingURL=useToolArgsFieldStatus.js.map