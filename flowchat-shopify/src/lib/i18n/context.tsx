/**
 * i18n Context and Hook for n8n Chat Widget
 * Provides translation functions and locale management
 */

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  translations,
  isRTL,
  type TranslationStrings,
  type SupportedLocale,
} from './translations';

export interface I18nContextValue {
  locale: SupportedLocale;
  t: TranslationStrings;
  isRTL: boolean;
  setLocale: (locale: SupportedLocale) => void;
  formatMessage: (key: keyof TranslationStrings, replacements?: Record<string, string>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

/**
 * Normalize locale code to supported locale
 * Handles variants like "en-US" -> "en", "zh-Hans" -> "zh-CN"
 */
export function normalizeLocale(locale: string): SupportedLocale {
  // Direct match
  if (locale in translations) {
    return locale as SupportedLocale;
  }

  // Handle common variants
  const normalized = locale.toLowerCase();

  // Chinese variants
  if (normalized.startsWith('zh')) {
    if (normalized.includes('tw') || normalized.includes('hant') || normalized.includes('hk')) {
      return 'zh-TW';
    }
    return 'zh-CN';
  }

  // Norwegian variants (Shopify uses 'nb' for Bokmål, 'nn' for Nynorsk)
  if (normalized === 'nb' || normalized === 'nn' || normalized.startsWith('nb-') || normalized.startsWith('nn-')) {
    return 'no';
  }

  // Get base language (e.g., "en-US" -> "en")
  const baseLang = normalized.split('-')[0];
  if (baseLang in translations) {
    return baseLang as SupportedLocale;
  }

  // Fallback to English
  return 'en';
}

interface I18nProviderProps {
  children: ReactNode;
  locale?: string;
  customTranslations?: Partial<TranslationStrings>;
  onLocaleChange?: (locale: SupportedLocale) => void;
}

export function I18nProvider({
  children,
  locale = 'en',
  customTranslations,
  onLocaleChange,
}: I18nProviderProps) {
  const normalizedLocale = useMemo(() => normalizeLocale(locale), [locale]);

  const value = useMemo<I18nContextValue>(() => {
    // Merge default translations with custom overrides
    const baseTranslations = translations[normalizedLocale];
    const mergedTranslations = customTranslations
      ? { ...baseTranslations, ...customTranslations }
      : baseTranslations;

    return {
      locale: normalizedLocale,
      t: mergedTranslations,
      isRTL: isRTL(normalizedLocale),
      setLocale: (newLocale: SupportedLocale) => {
        onLocaleChange?.(newLocale);
      },
      formatMessage: (key, replacements) => {
        let message = mergedTranslations[key];
        if (replacements) {
          Object.entries(replacements).forEach(([k, v]) => {
            message = message.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
          });
        }
        return message;
      },
    };
  }, [normalizedLocale, customTranslations, onLocaleChange]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

/**
 * Hook to access i18n context
 */
export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) {
    // Return default English if used outside provider
    return {
      locale: 'en',
      t: translations.en,
      isRTL: false,
      setLocale: () => {},
      formatMessage: (key) => translations.en[key],
    };
  }
  return context;
}
