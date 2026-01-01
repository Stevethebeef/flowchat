import { resource } from "@assistant-ui/tap";
import { tapApi } from "../../utils/tap-store/index.js";
import { tapSubscribable } from "../util-hooks/tapSubscribable.js";
export const AttachmentRuntimeClient = resource(({ runtime }) => {
    const state = tapSubscribable(runtime);
    return tapApi({
        getState: () => state,
        remove: runtime.remove,
        __internal_getRuntime: () => runtime,
    }, {
        key: state.id,
    });
});
//# sourceMappingURL=AttachmentRuntimeClient.js.map