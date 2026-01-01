import { resource, tapMemo } from "@assistant-ui/tap";
export const EventManager = resource(() => {
    const events = tapMemo(() => {
        const listeners = new Map();
        return {
            on: (event, callback) => {
                if (!listeners.has(event)) {
                    listeners.set(event, new Set());
                }
                const eventListeners = listeners.get(event);
                eventListeners.add(callback);
                return () => {
                    eventListeners.delete(callback);
                    if (eventListeners.size === 0) {
                        listeners.delete(event);
                    }
                };
            },
            emit: (event, payload) => {
                const eventListeners = listeners.get(event);
                const wildcardListeners = listeners.get("*");
                if (!eventListeners && !wildcardListeners)
                    return;
                // make sure state updates flush
                queueMicrotask(() => {
                    // Emit to specific event listeners
                    if (eventListeners) {
                        for (const callback of eventListeners) {
                            callback(payload);
                        }
                    }
                    // Emit to wildcard listeners
                    if (wildcardListeners) {
                        for (const callback of wildcardListeners) {
                            callback({ event, payload });
                        }
                    }
                });
            },
        };
    }, []);
    return events;
});
//# sourceMappingURL=EventManagerRuntimeClient.js.map