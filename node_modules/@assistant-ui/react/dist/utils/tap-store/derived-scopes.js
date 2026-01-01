import { resource, tapEffect } from "@assistant-ui/tap";
import { tapMemo, tapRef, tapResource, tapResources } from "@assistant-ui/tap";
import { createAssistantApiField } from "../../context/react/AssistantApiContext.js";
/**
 * DerivedScope resource - memoizes an AssistantApiField based on source and query.
 * The get callback always calls the most recent version (useEffectEvent pattern).
 * TypeScript infers TSource, TQuery, and TApi from the config object.
 * Validation happens at the DerivedScopesInput level.
 */
export const DerivedScope = resource((config) => {
    const getRef = tapRef(config.get);
    tapEffect(() => {
        getRef.current = config.get;
    });
    return tapMemo(() => {
        return createAssistantApiField({
            source: config.source,
            query: config.query,
            get: () => getRef.current(),
        });
    }, [config.source, JSON.stringify(config.query)]);
});
/**
 * Helper resource to wrap each scope field - stable resource identity for proper memoization.
 * Creating this outside the map ensures tapResources can properly track and memoize each field.
 */
const ScopeFieldWithNameResource = resource((config) => {
    const field = tapResource(config.scopeElement);
    return tapMemo(() => [config.fieldName, field], [config.fieldName, field]);
});
/**
 * DerivedScopes resource - takes an object of DerivedScope resource elements and special callbacks,
 * and returns a Partial<AssistantApi> with all the derived fields.
 */
export const DerivedScopes = resource((scopes) => {
    const { on, subscribe, ...scopeFields } = scopes;
    const callbacksRef = tapRef({ on, subscribe });
    tapEffect(() => {
        callbacksRef.current = { on, subscribe };
    });
    const results = tapResources(scopeFields, (scopeElement, fieldName) => ScopeFieldWithNameResource({
        fieldName,
        scopeElement,
    }), []);
    return tapMemo(() => {
        const result = Object.fromEntries(Object.values(results));
        const { on: onCb, subscribe: subCb } = callbacksRef.current;
        if (onCb) {
            result.on = (selector, callback) => onCb(selector, callback);
        }
        if (subCb)
            result.subscribe = (listener) => subCb(listener);
        return result;
    }, [results]);
});
//# sourceMappingURL=derived-scopes.js.map