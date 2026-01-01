import { resource } from "@assistant-ui/tap";
import { tapApi } from "../../utils/tap-store/index.js";
import { tapSubscribable } from "../util-hooks/tapSubscribable.js";
export const MessagePartClient = resource(({ runtime }) => {
    const runtimeState = tapSubscribable(runtime);
    const api = {
        getState: () => runtimeState,
        addToolResult: (result) => runtime.addToolResult(result),
        resumeToolCall: (payload) => runtime.resumeToolCall(payload),
        __internal_getRuntime: () => runtime,
    };
    return tapApi(api, {
        key: runtimeState.type === "tool-call"
            ? `toolCallId-${runtimeState.toolCallId}`
            : undefined,
    });
});
//# sourceMappingURL=MessagePartRuntimeClient.js.map