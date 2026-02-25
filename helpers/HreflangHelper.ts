import { DEFAULT_LANGUAGE } from '@/types/common/I18nTypes'

const HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || 'https://kuray.dev'

const OG_LOCALE_MAP: Record<string, string> = {
  en: 'en_US',
  tr: 'tr_TR',
  de: 'de_DE',
  gr: 'el_GR',
  et: 'et_EE',
  mt: 'mt_MT',
  th: 'th_TH',
  nl: 'nl_NL',
  ua: 'uk_UA',
  he: 'he_IL',
}

/** Returns the OpenGraph locale string for the given language code */
export function getOgLocale(lang: string): string {
  return OG_LOCALE_MAP[lang] || 'en_US'
}

/** Returns a full URL, prepending /{lang} for non-default languages */
export function buildLangUrl(lang: string, path: string): string {
  const prefix = lang === DEFAULT_LANGUAGE ? '' : `/${lang}`
  return `${HOST}${prefix}${path}`
}

/**
 * Builds canonical + hreflang alternates for Next.js Metadata.
 * @param lang - current page language
 * @param path - path WITHOUT lang prefix (e.g. /blog/category/post)
 * @param availableLangs - language codes that have this content (must include 'en')
 */
export function buildAlternates(
  lang: string,
  path: string,
  availableLangs: string[]
): { canonical: string; languages: Record<string, string> } {
  const canonical = buildLangUrl(lang, path)
  const languages: Record<string, string> = {}
  for (const l of availableLangs) {
    languages[l] = buildLangUrl(l, path)
  }
  // x-default points to the default (English) version
  languages['x-default'] = buildLangUrl(DEFAULT_LANGUAGE, path)
  return { canonical, languages }
}
