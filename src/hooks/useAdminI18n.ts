/**
 * Admin i18n Hook
 *
 * Provides access to admin translation strings from WordPress.
 */

declare global {
  interface Window {
    n8nChatAdmin?: {
      i18n?: Record<string, string>;
      apiUrl?: string;
      publicApiUrl?: string;
      nonce?: string;
      pluginUrl?: string;
      adminUrl?: string;
      version?: string;
    };
  }
}

/**
 * Get the admin i18n object
 */
export function getAdminI18n(): Record<string, string> {
  return window.n8nChatAdmin?.i18n || {};
}

/**
 * Translate a string with optional fallback
 */
export function t(key: string, fallback?: string): string {
  const i18n = getAdminI18n();
  return i18n[key] || fallback || key;
}

/**
 * Hook to use admin i18n
 */
export function useAdminI18n() {
  const i18n = getAdminI18n();

  return {
    i18n,
    t: (key: string, fallback?: string) => i18n[key] || fallback || key,
  };
}

export default useAdminI18n;
