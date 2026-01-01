/**
 * Frontend i18n hook
 *
 * Provides translations for frontend chat widget components.
 */

import { useMemo } from 'react';
import { useN8nChatConfig } from '../context/N8nChatContext';

interface FrontendI18n {
  [key: string]: string;
}

/**
 * Get frontend i18n object
 */
export function getFrontendI18n(config: { i18n?: FrontendI18n } | null): FrontendI18n {
  return config?.i18n || {};
}

/**
 * Hook for accessing frontend translation strings
 */
export function useFrontendI18n() {
  const config = useN8nChatConfig();

  const i18n = useMemo(() => getFrontendI18n(config), [config]);

  /**
   * Get translation with fallback
   */
  const t = (key: string, fallback?: string): string => {
    return i18n[key] || fallback || key;
  };

  return { i18n, t };
}

export default useFrontendI18n;
