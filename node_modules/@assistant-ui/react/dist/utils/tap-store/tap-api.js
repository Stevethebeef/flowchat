import { tapEffect, tapMemo, tapRef } from "@assistant-ui/tap";
class ReadonlyApiHandler {
    ref;
    constructor(ref) {
        this.ref = ref;
    }
    get(_, prop) {
        return this.ref.current[prop];
    }
    ownKeys() {
        return Object.keys(this.ref.current);
    }
    has(_, prop) {
        return prop in this.ref.current;
    }
    getOwnPropertyDescriptor(_, prop) {
        return Object.getOwnPropertyDescriptor(this.ref.current, prop);
    }
    set() {
        return false;
    }
    setPrototypeOf() {
        return false;
    }
    defineProperty() {
        return false;
    }
    deleteProperty() {
        return false;
    }
    preventExtensions() {
        return false;
    }
}
export const tapApi = (api, options) => {
    const ref = tapRef(api);
    tapEffect(() => {
        ref.current = api;
    });
    const apiProxy = tapMemo(() => new Proxy({}, new ReadonlyApiHandler(ref)), []);
    const key = options?.key;
    const state = api.getState();
    return tapMemo(() => ({
        key,
        state,
        api: apiProxy,
    }), [state, key]);
};
//# sourceMappingURL=tap-api.js.map