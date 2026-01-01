"use client";
import { useAssistantState } from "../../context/index.js";
export const ThreadPrimitiveEmpty = ({ children, }) => {
    const empty = useAssistantState(({ thread }) => thread.messages.length === 0 && !thread.isLoading);
    return empty ? children : null;
};
ThreadPrimitiveEmpty.displayName = "ThreadPrimitive.Empty";
//# sourceMappingURL=ThreadEmpty.js.map