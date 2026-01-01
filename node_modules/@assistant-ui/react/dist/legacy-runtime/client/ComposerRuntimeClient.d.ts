import { type tapRef } from "@assistant-ui/tap";
import { ComposerRuntime } from "../runtime/ComposerRuntime.js";
import { ComposerClientApi } from "../../client/types/Composer.js";
export declare const ComposerClient: import("@assistant-ui/tap").Resource<{
    key: string | undefined;
    state: any;
    api: ComposerClientApi;
}, {
    threadIdRef: tapRef.RefObject<string>;
    messageIdRef?: tapRef.RefObject<string>;
    runtime: ComposerRuntime;
}>;
//# sourceMappingURL=ComposerRuntimeClient.d.ts.map