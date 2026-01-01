import { resource, tapEffect, tapInlineResource } from "@assistant-ui/tap";
import { ThreadListClient } from "./client/ThreadListRuntimeClient.js";
import { tapModelContext } from "../client/ModelContext.js";
export const RuntimeAdapter = resource((runtime) => {
    const modelContext = tapModelContext();
    tapEffect(() => {
        return runtime.registerModelContextProvider(modelContext);
    }, [runtime, modelContext]);
    return tapInlineResource(ThreadListClient({
        runtime: runtime.threads,
        __internal_assistantRuntime: runtime,
    }));
});
//# sourceMappingURL=RuntimeAdapter.js.map