import { z } from "zod";
// Convert tools to AI SDK format
export const toAISDKTools = (tools) => {
    return Object.fromEntries(Object.entries(tools).map(([name, tool]) => [
        name,
        {
            ...(tool.description ? { description: tool.description } : undefined),
            parameters: (tool.parameters instanceof z.ZodType
                ? z.toJSONSchema(tool.parameters)
                : tool.parameters),
        },
    ]));
};
// Filter enabled tools
export const getEnabledTools = (tools) => {
    return Object.fromEntries(Object.entries(tools).filter(([, tool]) => !tool.disabled && tool.type !== "backend"));
};
// Create headers for fetch request
export const createRequestHeaders = async (headersValue) => {
    const resolvedHeaders = typeof headersValue === "function" ? await headersValue() : headersValue;
    const headers = new Headers(resolvedHeaders);
    headers.set("Content-Type", "application/json");
    return headers;
};
//# sourceMappingURL=utils.js.map