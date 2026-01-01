"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef, useCallback } from "react";
import { composeEventHandlers } from "@radix-ui/primitive";
import { Primitive } from "@radix-ui/react-primitive";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
const useActionBarExportMarkdown = ({ filename, onExport, } = {}) => {
    const api = useAssistantApi();
    const hasExportableContent = useAssistantState(({ message }) => {
        return ((message.role !== "assistant" || message.status?.type !== "running") &&
            message.parts.some((c) => c.type === "text" && c.text.length > 0));
    });
    const callback = useCallback(async () => {
        const content = api.message().getCopyText();
        if (!content)
            return;
        if (onExport) {
            await onExport(content);
            return;
        }
        const blob = new Blob([content], { type: "text/markdown" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename ?? `message-${Date.now()}.md`;
        a.click();
        URL.revokeObjectURL(url);
    }, [api, filename, onExport]);
    if (!hasExportableContent)
        return null;
    return callback;
};
export const ActionBarPrimitiveExportMarkdown = forwardRef(({ filename, onExport, onClick, disabled, ...props }, forwardedRef) => {
    const callback = useActionBarExportMarkdown({ filename, onExport });
    return (_jsx(Primitive.button, { type: "button", ...props, ref: forwardedRef, disabled: disabled || !callback, onClick: composeEventHandlers(onClick, () => {
            callback?.();
        }) }));
});
ActionBarPrimitiveExportMarkdown.displayName =
    "ActionBarPrimitive.ExportMarkdown";
//# sourceMappingURL=ActionBarExportMarkdown.js.map