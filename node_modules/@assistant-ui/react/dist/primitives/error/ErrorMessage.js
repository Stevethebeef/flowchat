"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { Primitive } from "@radix-ui/react-primitive";
import { forwardRef } from "react";
import { useAssistantState } from "../../context/index.js";
export const ErrorPrimitiveMessage = forwardRef(({ children, ...props }, forwardRef) => {
    const error = useAssistantState(({ message }) => {
        return message.status?.type === "incomplete" &&
            message.status.reason === "error"
            ? message.status.error
            : undefined;
    });
    if (error === undefined)
        return null;
    return (_jsx(Primitive.span, { ...props, ref: forwardRef, children: children ?? String(error) }));
});
ErrorPrimitiveMessage.displayName = "ErrorPrimitive.Message";
//# sourceMappingURL=ErrorMessage.js.map