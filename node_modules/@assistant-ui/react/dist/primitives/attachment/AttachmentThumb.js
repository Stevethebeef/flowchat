"use client";
import { jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from "react";
import { useAssistantState } from "../../context/index.js";
import { Primitive } from "@radix-ui/react-primitive";
export const AttachmentPrimitiveThumb = forwardRef((props, ref) => {
    const ext = useAssistantState(({ attachment }) => {
        const parts = attachment.name.split(".");
        return parts.length > 1 ? parts.pop() : "";
    });
    return (_jsxs(Primitive.div, { ...props, ref: ref, children: [".", ext] }));
});
AttachmentPrimitiveThumb.displayName = "AttachmentPrimitive.Thumb";
//# sourceMappingURL=AttachmentThumb.js.map