"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from "react";
import { useEscapeKeydown } from "@radix-ui/react-use-escape-keydown";
import { Primitive } from "@radix-ui/react-primitive";
import { composeEventHandlers } from "@radix-ui/primitive";
import { useCallback } from "react";
import { useAssistantState, useAssistantApi } from "../../context/index.js";
const useActionBarStopSpeaking = () => {
    const api = useAssistantApi();
    const isSpeaking = useAssistantState(({ message }) => message.speech != null);
    const callback = useCallback(() => {
        api.message().stopSpeaking();
    }, [api]);
    if (!isSpeaking)
        return null;
    return callback;
};
export const ActionBarPrimitiveStopSpeaking = forwardRef((props, ref) => {
    const callback = useActionBarStopSpeaking();
    // TODO this stops working if the user is not hovering over an older message
    useEscapeKeydown((e) => {
        if (callback) {
            e.preventDefault();
            callback();
        }
    });
    return (_jsx(Primitive.button, { type: "button", disabled: !callback, ...props, ref: ref, onClick: composeEventHandlers(props.onClick, () => {
            callback?.();
        }) }));
});
ActionBarPrimitiveStopSpeaking.displayName = "ActionBarPrimitive.StopSpeaking";
//# sourceMappingURL=ActionBarStopSpeaking.js.map