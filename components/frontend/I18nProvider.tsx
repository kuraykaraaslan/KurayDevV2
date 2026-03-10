'use client'

import { useEffect, type ReactNode } from 'react'
import i18n from '@/libs/localize/localize'
import type { AppLanguage } from '@/types/common/I18nTypes'
import { getDirection } from '@/types/common/I18nTypes'
import { useLanguageStore } from '@/libs/zustand'

interface I18nProviderProps {
  lang: AppLanguage
  children: ReactNode
}

export default function I18nProvider({ lang, children }: I18nProviderProps) {
  const setLang = useLanguageStore((s) => s.setLang)

  useEffect(() => {
    setLang(lang)
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    document.documentElement.lang = lang
    document.documentElement.dir = getDirection(lang)
  }, [lang, setLang])

  return <>{children}</>
}
