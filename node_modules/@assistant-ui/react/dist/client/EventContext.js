import { createContext, tapContext, withContextProvider, } from "@assistant-ui/tap";
const EventsContext = createContext(null);
export const withEventsProvider = (events, fn) => {
    return withContextProvider(EventsContext, events, fn);
};
export const tapEvents = () => {
    const events = tapContext(EventsContext);
    if (!events)
        throw new Error("Events context is not available");
    return events;
};
//# sourceMappingURL=EventContext.js.map