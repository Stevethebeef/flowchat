import { AppendMessage, PendingAttachment } from "../../../types/index.js";
import { AttachmentAdapter } from "../adapters/attachment/index.js";
import { ThreadComposerRuntimeCore } from "../core/ComposerRuntimeCore.js";
import { ThreadRuntimeCore } from "../core/ThreadRuntimeCore.js";
import { BaseComposerRuntimeCore } from "./BaseComposerRuntimeCore.js";
export declare class DefaultThreadComposerRuntimeCore extends BaseComposerRuntimeCore implements ThreadComposerRuntimeCore {
    private runtime;
    private _canCancel;
    get canCancel(): boolean;
    get attachments(): readonly PendingAttachment[];
    protected getAttachmentAdapter(): AttachmentAdapter | undefined;
    constructor(runtime: Omit<ThreadRuntimeCore, "composer"> & {
        adapters?: {
            attachments?: AttachmentAdapter | undefined;
        } | undefined;
    });
    connect(): import("../../..").Unsubscribe;
    handleSend(message: Omit<AppendMessage, "parentId" | "sourceId">): Promise<void>;
    handleCancel(): Promise<void>;
}
//# sourceMappingURL=DefaultThreadComposerRuntimeCore.d.ts.map