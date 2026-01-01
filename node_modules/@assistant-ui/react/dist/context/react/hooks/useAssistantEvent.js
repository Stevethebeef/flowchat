import { useEffect, useRef } from "react";
import { useAssistantApi } from "../../react/AssistantApiContext.js";
import { normalizeEventSelector, } from "../../../types/EventTypes.js";
export const useAssistantEvent = (selector, callback) => {
    const api = useAssistantApi();
    const callbackRef = useRef(callback);
    useEffect(() => {
        callbackRef.current = callback;
    });
    const { scope, event } = normalizeEventSelector(selector);
    useEffect(() => api.on({ scope, event }, (e) => callbackRef.current(e)), [api, scope, event]);
};
//# sourceMappingURL=useAssistantEvent.js.map