"use client";
import { useAssistantState } from "../../context/index.js";
export const MessagePrimitiveError = ({ children }) => {
    const hasError = useAssistantState(({ message }) => message.status?.type === "incomplete" &&
        message.status.reason === "error");
    return hasError ? children : null;
};
MessagePrimitiveError.displayName = "MessagePrimitive.Error";
//# sourceMappingURL=MessageError.js.map