import { MessageClientApi } from "./types/Message.js";
import { ThreadMessage } from "../types/index.js";
export type ThreadMessageClientProps = {
    message: ThreadMessage;
    index: number;
    isLast?: boolean;
    branchNumber?: number;
    branchCount?: number;
};
export declare const ThreadMessageClient: import("@assistant-ui/tap").Resource<{
    key: string | undefined;
    state: any;
    api: MessageClientApi;
}, ThreadMessageClientProps>;
//# sourceMappingURL=ThreadMessageClient.d.ts.map