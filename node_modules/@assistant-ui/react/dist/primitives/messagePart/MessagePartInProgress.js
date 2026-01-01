"use client";
import { useAssistantState } from "../../context/index.js";
// TODO should this be renamed to IsRunning?
export const MessagePartPrimitiveInProgress = ({ children }) => {
    const isInProgress = useAssistantState(({ part }) => part.status.type === "running");
    return isInProgress ? children : null;
};
MessagePartPrimitiveInProgress.displayName = "MessagePartPrimitive.InProgress";
//# sourceMappingURL=MessagePartInProgress.js.map