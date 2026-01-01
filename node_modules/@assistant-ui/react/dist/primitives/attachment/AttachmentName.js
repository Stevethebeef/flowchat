"use client";
import { Fragment as _Fragment, jsx as _jsx } from "react/jsx-runtime";
import { useAssistantState } from "../../context/index.js";
export const AttachmentPrimitiveName = () => {
    const name = useAssistantState(({ attachment }) => attachment.name);
    return _jsx(_Fragment, { children: name });
};
AttachmentPrimitiveName.displayName = "AttachmentPrimitive.Name";
//# sourceMappingURL=AttachmentName.js.map