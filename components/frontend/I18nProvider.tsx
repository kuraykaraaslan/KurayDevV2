'use client'

import { useEffect, type ReactNode } from 'react'
import i18n from '@/libs/localize/localize'
import type { AppLanguage } from '@/types/common/I18nTypes'

interface I18nProviderProps {
  lang: AppLanguage
  children: ReactNode
}

export default function I18nProvider({ lang, children }: I18nProviderProps) {
  useEffect(() => {
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang)
    }
    document.documentElement.lang = lang
  }, [lang])

  return <>{children}</>
}
