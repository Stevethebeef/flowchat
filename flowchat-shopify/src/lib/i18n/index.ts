/**
 * n8n Chat Widget i18n System
 * Internationalization support for Shopify multi-language stores
 */

export {
  translations,
  rtlLanguages,
  isRTL,
  type TranslationStrings,
  type SupportedLocale,
} from './translations';

export { I18nProvider, useI18n, normalizeLocale, type I18nContextValue } from './context';
