"use client";
import { createActionButton, } from "../../utils/createActionButton.js";
import { useCallback } from "react";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
const useThreadSuggestion = ({ prompt, send, clearComposer = true, autoSend, method: _method, }) => {
    const api = useAssistantApi();
    const disabled = useAssistantState(({ thread }) => thread.isDisabled);
    // ========== Deprecation Mapping ==========
    const resolvedSend = send ?? autoSend ?? false;
    // ==========================================
    const callback = useCallback(() => {
        const isRunning = api.thread().getState().isRunning;
        if (resolvedSend && !isRunning) {
            api.thread().append(prompt);
            if (clearComposer) {
                api.composer().setText("");
            }
        }
        else {
            if (clearComposer) {
                api.composer().setText(prompt);
            }
            else {
                const currentText = api.composer().getState().text;
                api
                    .composer()
                    .setText(currentText.trim() ? `${currentText} ${prompt}` : prompt);
            }
        }
    }, [api, resolvedSend, clearComposer, prompt]);
    if (disabled)
        return null;
    return callback;
};
export const ThreadPrimitiveSuggestion = createActionButton("ThreadPrimitive.Suggestion", useThreadSuggestion, ["prompt", "send", "clearComposer", "autoSend", "method"]);
//# sourceMappingURL=ThreadSuggestion.js.map