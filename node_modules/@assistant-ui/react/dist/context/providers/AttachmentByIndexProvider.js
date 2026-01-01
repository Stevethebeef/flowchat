"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AssistantProvider, useAssistantApi, useExtendedAssistantApi, } from "../react/AssistantApiContext.js";
import { DerivedScope } from "../../utils/tap-store/derived-scopes.js";
export const MessageAttachmentByIndexProvider = ({ index, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        attachment: DerivedScope({
            source: "message",
            query: { type: "index", index },
            get: () => baseApi.message().attachment({ index }),
        }),
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
export const ComposerAttachmentByIndexProvider = ({ index, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        attachment: DerivedScope({
            source: "composer",
            query: { type: "index", index },
            get: () => baseApi.composer().attachment({ index }),
        }),
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
//# sourceMappingURL=AttachmentByIndexProvider.js.map