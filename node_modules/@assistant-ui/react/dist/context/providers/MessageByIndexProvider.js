"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { AssistantProvider, useAssistantApi, useExtendedAssistantApi, } from "../react/AssistantApiContext.js";
import { checkEventScope, normalizeEventSelector, } from "../../types/EventTypes.js";
import { DerivedScope } from "../../utils/tap-store/derived-scopes.js";
export const MessageByIndexProvider = ({ index, children }) => {
    const baseApi = useAssistantApi();
    const api = useExtendedAssistantApi({
        message: DerivedScope({
            source: "thread",
            query: { type: "index", index },
            get: () => baseApi.thread().message({ index }),
        }),
        composer: DerivedScope({
            source: "message",
            query: {},
            get: () => baseApi.thread().message({ index }).composer,
        }),
        on(selector, callback) {
            const getMessage = () => baseApi.thread().message({ index });
            const { event, scope } = normalizeEventSelector(selector);
            if (!checkEventScope("composer", scope, event) &&
                !checkEventScope("message", scope, event))
                return baseApi.on(selector, callback);
            return baseApi.on({ scope: "thread", event }, (e) => {
                if (e.messageId === getMessage().getState().id) {
                    callback(e);
                }
            });
        },
    });
    return _jsx(AssistantProvider, { api: api, children: children });
};
//# sourceMappingURL=MessageByIndexProvider.js.map