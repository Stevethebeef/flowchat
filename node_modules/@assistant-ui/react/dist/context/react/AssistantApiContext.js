"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useEffect, } from "react";
import { useResource } from "@assistant-ui/tap/react";
import { normalizeEventSelector, } from "../../types/EventTypes.js";
import { DevToolsProviderApi } from "../../devtools/DevToolsHooks.js";
import { useAssistantClient, } from "../../client/AssistantClient.js";
import { DerivedScopes, } from "../../utils/tap-store/derived-scopes.js";
export const createAssistantApiField = (config) => {
    const fn = config.get;
    fn.source = config.source;
    fn.query = config.query;
    return fn;
};
const NO_OP_FN = () => () => { };
const AssistantApiContext = createContext({
    threads: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Threads is only available inside <AssistantProvider />");
        },
    }),
    tools: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Tools is only available inside <AssistantProvider />");
        },
    }),
    modelContext: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("ModelContext is only available inside <AssistantProvider />");
        },
    }),
    threadListItem: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("ThreadListItem is only available inside <AssistantProvider />");
        },
    }),
    thread: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Thread is only available inside <AssistantProvider />");
        },
    }),
    composer: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Composer is only available inside <AssistantProvider />");
        },
    }),
    message: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Message is only available inside <ThreadPrimitive.Messages />");
        },
    }),
    part: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Part is only available inside <MessagePrimitive.Parts />");
        },
    }),
    attachment: createAssistantApiField({
        source: null,
        query: {},
        get: () => {
            throw new Error("Attachment is only available inside <MessagePrimitive.Attachments /> or <ComposerPrimitive.Attachments />");
        },
    }),
    subscribe: NO_OP_FN,
    on: (selector) => {
        const { scope } = normalizeEventSelector(selector);
        throw new Error(`Event scope is not available in this component: ${scope}`);
    },
});
export const useAssistantApiImpl = () => {
    return useContext(AssistantApiContext);
};
/**
 * Hook to extend the current AssistantApi with additional derived scope fields and special callbacks.
 * This merges the derived fields with the existing API from context.
 * Fields are automatically memoized based on source and query changes.
 * Special callbacks (on, subscribe) use the useEffectEvent pattern to always access latest values.
 *
 * @param scopes - Record of field names to DerivedScope resource elements, plus optional special callbacks
 * @returns The merged AssistantApi
 *
 * @example
 * ```tsx
 * const api = useExtendedAssistantApi({
 *   message: DerivedScope({
 *     source: "root",
 *     query: {},
 *     get: () => messageApi,
 *   }),
 *   on: (selector, callback) => {
 *     // Custom event filtering logic
 *   },
 * });
 * ```
 */
export const useExtendedAssistantApi = (scopes) => {
    const baseApi = useAssistantApiImpl();
    const partialApi = useResource(DerivedScopes(scopes));
    return useMemo(() => extendApi(baseApi, partialApi), [baseApi, partialApi]);
};
const useExtendedAssistantApiImpl = (config) => {
    return useAssistantClient(config);
};
export function useAssistantApi(config) {
    if (config) {
        return useExtendedAssistantApiImpl(config);
    }
    else {
        return useAssistantApiImpl();
    }
}
const mergeFnsWithUnsubscribe = (fn1, fn2) => {
    if (fn1 === NO_OP_FN)
        return fn2;
    if (fn2 === NO_OP_FN)
        return fn1;
    return (...args) => {
        const unsubscribe1 = fn1(...args);
        const unsubscribe2 = fn2(...args);
        return () => {
            unsubscribe1();
            unsubscribe2();
        };
    };
};
export const extendApi = (api, api2) => {
    const api2Subscribe = api2.subscribe;
    return {
        ...api,
        ...api2,
        subscribe: mergeFnsWithUnsubscribe(api.subscribe, api2Subscribe ?? NO_OP_FN),
    };
};
export const AssistantProvider = ({ api, children, devToolsVisible = true }) => {
    useEffect(() => {
        if (!devToolsVisible || !api.subscribe)
            return undefined;
        return DevToolsProviderApi.register(api);
    }, [api, devToolsVisible]);
    return (_jsx(AssistantApiContext.Provider, { value: api, children: children }));
};
//# sourceMappingURL=AssistantApiContext.js.map