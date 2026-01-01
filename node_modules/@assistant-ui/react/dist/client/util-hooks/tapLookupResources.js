import { tapMemo, tapResources } from "@assistant-ui/tap";
export const tapLookupResources = (elements) => {
    const elementsMap = tapMemo(() => Object.fromEntries(elements), [elements]);
    const resources = tapResources(elementsMap, (t) => t, []);
    const keys = tapMemo(() => Object.keys(resources), [resources]);
    const state = tapMemo(() => {
        const result = new Array(keys.length);
        for (let i = 0; i < keys.length; i++) {
            result[i] = resources[keys[i]].state;
        }
        return result;
    }, [keys, resources]);
    return {
        state,
        api: (lookup) => {
            const value = "index" in lookup
                ? resources[keys[lookup.index]]?.api
                : resources[lookup.key]?.api;
            if (!value) {
                throw new Error(`tapLookupResources: Resource not found for lookup: ${JSON.stringify(lookup)}`);
            }
            return value;
        },
    };
};
//# sourceMappingURL=tapLookupResources.js.map