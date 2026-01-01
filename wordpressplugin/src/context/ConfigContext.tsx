/**
 * ConfigContext
 *
 * Provides instance-specific configuration to components.
 * Per 05-frontend-components.md spec.
 */

import React, { createContext, useContext, useMemo, type ReactNode } from 'react';
import type { N8nChatConfig, ChatContext as ChatContextData } from '../types';

interface ConfigContextValue {
  /** Current instance ID */
  instanceId: string;

  /** Instance configuration */
  config: N8nChatConfig;

  /** WordPress context */
  wpContext: ChatContextData | null;

  /** API endpoint base URL */
  apiBase: string;

  /** API nonce for authentication */
  nonce: string;

  /** Whether this is a preview mode */
  isPreview: boolean;
}

const ConfigContext = createContext<ConfigContextValue | null>(null);

interface ConfigProviderProps {
  children: ReactNode;
  instanceId: string;
  config: N8nChatConfig;
  wpContext?: ChatContextData;
  apiBase?: string;
  nonce?: string;
  isPreview?: boolean;
}

/**
 * Provider for instance-specific configuration
 */
export function ConfigProvider({
  children,
  instanceId,
  config,
  wpContext,
  apiBase = '',
  nonce = '',
  isPreview = false,
}: ConfigProviderProps) {
  const value = useMemo(
    () => ({
      instanceId,
      config,
      wpContext: wpContext || null,
      apiBase,
      nonce,
      isPreview,
    }),
    [instanceId, config, wpContext, apiBase, nonce, isPreview]
  );

  return <ConfigContext.Provider value={value}>{children}</ConfigContext.Provider>;
}

/**
 * Hook to access configuration context
 */
export function useConfig(): ConfigContextValue {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}

/**
 * Hook to access just the instance config
 */
export function useInstanceConfig(): N8nChatConfig {
  const { config } = useConfig();
  return config;
}

/**
 * Hook to access current instance ID
 */
export function useInstanceId(): string {
  const { instanceId } = useConfig();
  return instanceId;
}

/**
 * Hook to access WordPress context
 */
export function useWPContext(): ChatContextData | null {
  const { wpContext } = useConfig();
  return wpContext;
}

/**
 * Hook to access API configuration
 */
export function useAPIConfig(): { apiBase: string; nonce: string } {
  const { apiBase, nonce } = useConfig();
  return { apiBase, nonce };
}

export default ConfigContext;
