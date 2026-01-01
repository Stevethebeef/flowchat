import { AppendMessage, ThreadMessage } from "../../../types/index.js";
import { AttachmentAdapter } from "../adapters/attachment/index.js";
import { ThreadRuntimeCore } from "../core/ThreadRuntimeCore.js";
import { BaseComposerRuntimeCore } from "./BaseComposerRuntimeCore.js";
export declare class DefaultEditComposerRuntimeCore extends BaseComposerRuntimeCore {
    private runtime;
    private endEditCallback;
    get canCancel(): boolean;
    protected getAttachmentAdapter(): AttachmentAdapter | undefined;
    private _nonTextParts;
    private _previousText;
    private _parentId;
    private _sourceId;
    constructor(runtime: ThreadRuntimeCore & {
        adapters?: {
            attachments?: AttachmentAdapter | undefined;
        } | undefined;
    }, endEditCallback: () => void, { parentId, message }: {
        parentId: string | null;
        message: ThreadMessage;
    });
    handleSend(message: Omit<AppendMessage, "parentId" | "sourceId">): Promise<void>;
    handleCancel(): void;
}
//# sourceMappingURL=DefaultEditComposerRuntimeCore.d.ts.map