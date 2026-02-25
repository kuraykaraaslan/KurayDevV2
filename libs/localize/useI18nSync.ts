'use client'
import { useEffect } from 'react'
import i18n from '@/libs/localize/localize'
import useGlobalStore from '@/libs/zustand'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'

function detectBrowserLang(): AppLanguage {
  if (typeof navigator === 'undefined') return DEFAULT_LANGUAGE
  const code = navigator.language.split('-')[0] as AppLanguage
  return AVAILABLE_LANGUAGES.includes(code) ? code : DEFAULT_LANGUAGE
}

export function useI18nSync() {
  const user = useGlobalStore((s) => s.user)
  const lang = (user?.userPreferences?.language ?? detectBrowserLang()) as AppLanguage

  useEffect(() => {
    if (i18n.language !== lang) i18n.changeLanguage(lang)
    document.documentElement.lang = lang
  }, [lang])
}
