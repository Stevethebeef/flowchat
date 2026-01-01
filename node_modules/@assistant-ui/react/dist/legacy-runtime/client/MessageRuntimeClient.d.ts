import { MessageRuntime } from "../runtime/MessageRuntime.js";
import { RefObject } from "react";
import { MessageClientApi } from "../../client/types/Message.js";
export declare const MessageClient: import("@assistant-ui/tap").Resource<{
    key: string | undefined;
    state: any;
    api: MessageClientApi;
}, {
    runtime: MessageRuntime;
    threadIdRef: RefObject<string>;
}>;
//# sourceMappingURL=MessageRuntimeClient.d.ts.map