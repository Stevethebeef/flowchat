"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AssistantProvider, useAssistantApi, useExtendedAssistantApi, } from "../react/AssistantApiContext.js";
import { checkEventScope, normalizeEventSelector, } from "../../types/EventTypes.js";
import { DerivedScope } from "../../utils/tap-store/derived-scopes.js";
export const ThreadListItemByIndexProvider = ({ index, archived, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        threadListItem: DerivedScope({
            source: "threads",
            query: { type: "index", index, archived },
            get: () => baseApi.threads().item({ index, archived }),
        }),
        on(selector, callback) {
            const getItem = () => baseApi.threads().item({ index, archived });
            const { event, scope } = normalizeEventSelector(selector);
            if (!checkEventScope("thread-list-item", scope, event))
                return baseApi.on(selector, callback);
            return baseApi.on({ scope: "*", event }, (e) => {
                if (e.threadId === getItem().getState().id) {
                    callback(e);
                }
            });
        },
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
export const ThreadListItemByIdProvider = ({ id, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        threadListItem: DerivedScope({
            source: "threads",
            query: { type: "id", id },
            get: () => baseApi.threads().item({ id }),
        }),
        on(selector, callback) {
            const getItem = () => baseApi.threads().item({ id });
            const { event, scope } = normalizeEventSelector(selector);
            if (!checkEventScope("thread-list-item", scope, event))
                return baseApi.on(selector, callback);
            return baseApi.on({ scope: "*", event }, (e) => {
                if (e.threadId !== getItem().getState().id)
                    return;
                callback(e);
            });
        },
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
//# sourceMappingURL=ThreadListItemProvider.js.map