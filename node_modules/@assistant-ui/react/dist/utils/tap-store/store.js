import { tapMemo, tapEffect, resource, createResource, } from "@assistant-ui/tap";
export const asStore = resource((element) => {
    const resource = tapMemo(() => createResource(element, { mount: false }), [element.type]);
    tapEffect(() => {
        resource.render(element);
    });
    return resource;
});
//# sourceMappingURL=store.js.map