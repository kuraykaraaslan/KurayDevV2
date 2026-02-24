import { z } from 'zod'

// ─── Language ─────────────────────────────────────────────────────────────────

export const AppLanguageEnum = z.enum(['en', 'tr', 'de', 'gr', 'et', 'mt', 'th', 'nl', 'ua', 'he'])
export const AppLanguageSchema = AppLanguageEnum.default('en')

export type AppLanguage = z.infer<typeof AppLanguageEnum>

export const AVAILABLE_LANGUAGES = AppLanguageEnum.options

export const DEFAULT_LANGUAGE: AppLanguage = 'en'

