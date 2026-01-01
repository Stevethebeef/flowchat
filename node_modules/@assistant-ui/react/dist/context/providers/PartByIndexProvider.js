"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AssistantProvider, useAssistantApi, useExtendedAssistantApi, } from "../react/AssistantApiContext.js";
import { DerivedScope } from "../../utils/tap-store/derived-scopes.js";
export const PartByIndexProvider = ({ index, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        part: DerivedScope({
            source: "message",
            query: { type: "index", index },
            get: () => baseApi.message().part({ index }),
        }),
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
//# sourceMappingURL=PartByIndexProvider.js.map