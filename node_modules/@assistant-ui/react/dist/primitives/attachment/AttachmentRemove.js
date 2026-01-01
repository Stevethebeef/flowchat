"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useCallback } from "react";
import { useAssistantApi } from "../../context/index.js";
const useAttachmentRemove = () => {
    const api = useAssistantApi();
    const handleRemoveAttachment = useCallback(() => {
        api.attachment().remove();
    }, [api]);
    return handleRemoveAttachment;
};
export const AttachmentPrimitiveRemove = createActionButton("AttachmentPrimitive.Remove", useAttachmentRemove);
//# sourceMappingURL=AttachmentRemove.js.map