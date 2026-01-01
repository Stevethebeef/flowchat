"use client";
import { jsx as _jsx } from "react/jsx-runtime";
import { useCallback, useRef, useEffect, memo, } from "react";
import { create } from "zustand";
import { useAssistantApi, ThreadListItemByIdProvider } from "../../../context/index.js";
import { BaseSubscribable } from "./BaseSubscribable.js";
export class RemoteThreadListHookInstanceManager extends BaseSubscribable {
    useRuntimeHook;
    instances = new Map();
    useAliveThreadsKeysChanged = create(() => ({}));
    constructor(runtimeHook) {
        super();
        this.useRuntimeHook = create(() => ({ useRuntime: runtimeHook }));
    }
    startThreadRuntime(threadId) {
        if (!this.instances.has(threadId)) {
            this.instances.set(threadId, {});
            this.useAliveThreadsKeysChanged.setState({}, true);
        }
        return new Promise((resolve, reject) => {
            const callback = () => {
                const instance = this.instances.get(threadId);
                if (!instance) {
                    dispose();
                    reject(new Error("Thread was deleted before runtime was started"));
                }
                else if (!instance.runtime) {
                    return; // misc update
                }
                else {
                    dispose();
                    resolve(instance.runtime);
                }
            };
            const dispose = this.subscribe(callback);
            callback();
        });
    }
    getThreadRuntimeCore(threadId) {
        const instance = this.instances.get(threadId);
        if (!instance)
            return undefined;
        return instance.runtime;
    }
    stopThreadRuntime(threadId) {
        this.instances.delete(threadId);
        this.useAliveThreadsKeysChanged.setState({}, true);
    }
    setRuntimeHook(newRuntimeHook) {
        const prevRuntimeHook = this.useRuntimeHook.getState().useRuntime;
        if (prevRuntimeHook !== newRuntimeHook) {
            this.useRuntimeHook.setState({ useRuntime: newRuntimeHook }, true);
        }
    }
    _InnerActiveThreadProvider = ({ threadId }) => {
        const { useRuntime } = this.useRuntimeHook();
        const runtime = useRuntime();
        const threadBinding = runtime.thread
            .__internal_threadBinding;
        const updateRuntime = useCallback(() => {
            const aliveThread = this.instances.get(threadId);
            if (!aliveThread)
                throw new Error("Thread not found. This is a bug in assistant-ui.");
            aliveThread.runtime = threadBinding.getState();
            this._notifySubscribers();
        }, [threadId, threadBinding]);
        const isMounted = useRef(false);
        if (!isMounted.current) {
            updateRuntime();
        }
        useEffect(() => {
            isMounted.current = true;
            updateRuntime();
            return threadBinding.outerSubscribe(updateRuntime);
        }, [threadBinding, updateRuntime]);
        // auto initialize thread
        const api = useAssistantApi();
        useEffect(() => {
            return runtime.threads.main.unstable_on("initialize", () => {
                const state = api.threadListItem().getState();
                if (state.status === "new") {
                    api.threadListItem().initialize();
                    // auto generate a title after first run
                    const dispose = runtime.thread.unstable_on("run-end", () => {
                        dispose();
                        api.threadListItem().generateTitle();
                    });
                }
            });
        }, [runtime, api]);
        return null;
    };
    _OuterActiveThreadProvider = memo(({ threadId, provider: Provider }) => {
        // Runtime is provided by ThreadListItemByIdProvider
        return (_jsx(ThreadListItemByIdProvider, { id: threadId, children: _jsx(Provider, { children: _jsx(this._InnerActiveThreadProvider, { threadId: threadId }) }) }));
    });
    __internal_RenderThreadRuntimes = ({ provider }) => {
        this.useAliveThreadsKeysChanged(); // trigger re-render on alive threads change
        return Array.from(this.instances.keys()).map((threadId) => (_jsx(this._OuterActiveThreadProvider, { threadId: threadId, provider: provider }, threadId)));
    };
}
//# sourceMappingURL=RemoteThreadListHookInstanceManager.js.map