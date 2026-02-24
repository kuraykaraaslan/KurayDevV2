import { z } from 'zod'

// ─── Language ─────────────────────────────────────────────────────────────────

export const AppLanguageEnum = z.enum(['en', 'tr', 'de', 'gr', 'et', 'mt', 'th', 'nl', 'ua', 'he'])
export const AppLanguageSchema = AppLanguageEnum.default('en')

export type AppLanguage = z.infer<typeof AppLanguageEnum>

export const AVAILABLE_LANGUAGES = AppLanguageEnum.options

export const DEFAULT_LANGUAGE: AppLanguage = 'en'

export const LANG_NAMES: Record<string, string> = {
  en: 'English',
  tr: 'Türkçe',
  de: 'Deutsch',
  gr: 'Ελληνικά',
  et: 'Eesti',
  mt: 'Malti',
  th: 'ไทย',
  nl: 'Nederlands',
  ua: 'Українська',
  he: 'עברית',
}

export const LANG_FLAGS: Record<string, string> = {
  en: '🇬🇧',
  tr: '🇹🇷',
  de: '🇩🇪',
  gr: '🇬🇷',
  et: '🇪🇪',
  mt: '🇲🇹',
  th: '🇹🇭',
  nl: '🇳🇱',
  ua: '🇺🇦',
  he: '🇮🇱',
}

