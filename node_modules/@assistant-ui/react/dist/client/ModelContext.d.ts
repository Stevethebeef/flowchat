import { ModelContextProvider } from "../model-context/ModelContextTypes.js";
import { Unsubscribe } from "../types/index.js";
export type ModelContextRegistrar = ModelContextProvider & {
    register: (provider: ModelContextProvider) => Unsubscribe;
};
export declare const withModelContextProvider: <TResult>(modelContext: ModelContextRegistrar, fn: () => TResult) => TResult;
export declare const tapModelContext: () => ModelContextRegistrar;
//# sourceMappingURL=ModelContext.d.ts.map