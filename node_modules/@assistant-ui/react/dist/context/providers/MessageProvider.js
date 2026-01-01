"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AssistantProvider, useExtendedAssistantApi, } from "../react/AssistantApiContext.js";
import { useResource } from "@assistant-ui/tap/react";
import { asStore } from "../../utils/tap-store/index.js";
import { ThreadMessageClient, } from "../../client/ThreadMessageClient.js";
import { DerivedScope } from "../../utils/tap-store/derived-scopes.js";
export const MessageProvider = ({ children, ...props }) => {
    const store = useResource(asStore(ThreadMessageClient(props)));
    const api = useExtendedAssistantApi({
        message: DerivedScope({
            source: "root",
            query: {},
            get: () => store.getState().api,
        }),
        subscribe: store.subscribe,
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
//# sourceMappingURL=MessageProvider.js.map