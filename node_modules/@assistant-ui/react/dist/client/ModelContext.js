import { createContext, tapContext, withContextProvider, } from "@assistant-ui/tap";
const ModelContextContext = createContext(null);
export const withModelContextProvider = (modelContext, fn) => {
    return withContextProvider(ModelContextContext, modelContext, fn);
};
export const tapModelContext = () => {
    const modelContext = tapContext(ModelContextContext);
    if (!modelContext)
        throw new Error("Model context is not available in this context");
    return modelContext;
};
//# sourceMappingURL=ModelContext.js.map