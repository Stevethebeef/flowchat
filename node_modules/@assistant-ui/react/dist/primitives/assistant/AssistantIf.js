"use client";
import { useAssistantState } from "../../context/index.js";
const useAssistantIf = (props) => {
    return useAssistantState(props.condition);
};
export const AssistantIf = ({ children, condition }) => {
    const result = useAssistantIf({ condition });
    return result ? children : null;
};
AssistantIf.displayName = "AssistantIf";
//# sourceMappingURL=AssistantIf.js.map