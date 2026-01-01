"use client";
import { useAssistantState } from "../../context/index.js";
const useComposerIf = (props) => {
    return useAssistantState(({ composer }) => {
        if (props.editing === true && !composer.isEditing)
            return false;
        if (props.editing === false && composer.isEditing)
            return false;
        return true;
    });
};
/**
 * @deprecated Use `<AssistantIf condition={({ composer }) => ...} />` instead.
 */
export const ComposerPrimitiveIf = ({ children, ...query }) => {
    const result = useComposerIf(query);
    return result ? children : null;
};
ComposerPrimitiveIf.displayName = "ComposerPrimitive.If";
//# sourceMappingURL=ComposerIf.js.map