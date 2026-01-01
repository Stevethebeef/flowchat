"use client";
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { useAssistantApi, AssistantProvider, } from "../context/react/AssistantApiContext.js";
import { RuntimeAdapter } from "./RuntimeAdapter.js";
import { ThreadPrimitiveViewportProvider } from "../context/providers/ThreadViewportProvider.js";
const getRenderComponent = (runtime) => {
    return runtime._core?.RenderComponent;
};
export const AssistantRuntimeProviderImpl = ({ children, runtime }) => {
    const api = useAssistantApi({
        threads: RuntimeAdapter(runtime),
    });
    const RenderComponent = getRenderComponent(runtime);
    return (_jsxs(AssistantProvider, { api: api, children: [RenderComponent && _jsx(RenderComponent, {}), _jsx(ThreadPrimitiveViewportProvider, { children: children })] }));
};
export const AssistantRuntimeProvider = memo(AssistantRuntimeProviderImpl);
//# sourceMappingURL=AssistantRuntimeProvider.js.map