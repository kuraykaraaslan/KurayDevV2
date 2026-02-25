import { z } from 'zod'
import { countries, languages } from 'country-data-list'

// ─── Language enum ────────────────────────────────────────────────────────────

export const AppLanguageEnum = z.enum(['en', 'tr', 'de', 'el', 'et', 'mt', 'th', 'nl', 'uk', 'he'])
export const AppLanguageSchema = AppLanguageEnum.default('en')

export type AppLanguage = z.infer<typeof AppLanguageEnum>

export const AVAILABLE_LANGUAGES = AppLanguageEnum.options
export const DEFAULT_LANGUAGE: AppLanguage = 'en'

// ─── Country code resolver ────────────────────────────────────────────────────
// Use lang.toUpperCase() if that country speaks the language, else fall back
// to the first country where the language is primary.
// Two overrides are unavoidable: package returns wrong countries for these.

const COUNTRY_OVERRIDES: Partial<Record<AppLanguage, string>> = { en: 'GB', el: 'GR' }

function resolveCountryCode(lang: AppLanguage): string {
  if (COUNTRY_OVERRIDES[lang]) return COUNTRY_OVERRIDES[lang]!
  const alpha3 = languages.all.find((l) => l.alpha2 === lang)?.alpha3
  const byAlpha2 = countries.all.find((c) => c.alpha2 === lang.toUpperCase())
  if (byAlpha2 && alpha3 && byAlpha2.languages.includes(alpha3)) return byAlpha2.alpha2
  return countries.all.find((c) => alpha3 && c.languages[0] === alpha3)?.alpha2 ?? lang.toUpperCase()
}

// ─── Derived maps ─────────────────────────────────────────────────────────────

export const LANG_NAMES: Record<string, string> = Object.fromEntries(
  AVAILABLE_LANGUAGES.map((lang) => {
    const raw = new Intl.DisplayNames([lang], { type: 'language' }).of(lang) ?? lang
    return [lang, raw.replace(/^\p{L}/u, (c) => c.toUpperCase())]
  })
)

export const LANG_FLAGS: Record<string, string> = Object.fromEntries(
  AVAILABLE_LANGUAGES.map((lang) => {
    const country = countries.all.find((c) => c.alpha2 === resolveCountryCode(lang))
    return [lang, country?.emoji ?? '']
  })
)

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Returns the OpenGraph locale string (e.g. 'el' → 'el_GR', 'en' → 'en_US') */
export function getOgLocale(lang: string): string {
  const l = lang as AppLanguage
  const cc = resolveCountryCode(l)
  // English flag is GB but OG convention is en_US
  return l === 'en' ? 'en_US' : `${l}_${cc}`
}

/** Returns the square-flags CDN URL for a language code */
export function getLangFlagUrl(lang: AppLanguage): string {
  return `https://kapowaz.github.io/square-flags/flags/${resolveCountryCode(lang).toLowerCase()}.svg`
}
