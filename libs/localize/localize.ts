import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from '@/dictionaries/en.json'

const enabledLanguages = (process.env.NEXT_PUBLIC_I18N_LANGUAGES ?? 'en')
  .split(',')
  .map((l) => l.trim().toLowerCase())
  .filter(Boolean)

i18n.use(initReactI18next).init({
  fallbackLng: 'en',
  debug: false,
  resources: { en: { translation: en } },
  interpolation: { escapeValue: false },
})

export async function loadLanguage(lang: string): Promise<void> {
  if (lang === 'en') return
  if (!enabledLanguages.includes(lang)) return
  if (i18n.hasResourceBundle(lang, 'translation')) return
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mod: any = await import(`@/dictionaries/${lang}.json`)
    i18n.addResourceBundle(lang, 'translation', mod.default ?? mod, true, true)
  } catch {
    i18n.addResourceBundle(lang, 'translation', {}, true, true)
  }
}

export default i18n