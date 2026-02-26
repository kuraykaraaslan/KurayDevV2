'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/libs/localize/localize'
import { useEffect, useState } from 'react'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'
import i18n from '@/libs/localize/localize'

function detectLang(): AppLanguage {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE

  // 1. Check URL path for lang prefix
  const pathLang = window.location.pathname.split('/').filter(Boolean)[0] as AppLanguage
  if (AVAILABLE_LANGUAGES.includes(pathLang)) return pathLang

  // 2. Check browser language
  const browserLang = navigator.language.split('-')[0] as AppLanguage
  if (AVAILABLE_LANGUAGES.includes(browserLang)) return browserLang

  return DEFAULT_LANGUAGE
}

export default function NotFoundPage() {
  const { t } = useTranslation()
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const lang = detectLang()
    if (i18n.language !== lang) {
      i18n.changeLanguage(lang).then(() => setReady(true))
    } else {
      setReady(true)
    }
    document.documentElement.lang = lang
  }, [])

  // Prevent flash of English text while i18n loads
  if (!ready) return null

  return (
    <section className="h-screen flex items-center justify-center bg-base-100">
      <div className="py-8 px-4 mx-auto max-w-screen-xl lg:py-16 lg:px-6">
        <div className="mx-auto max-w-screen-sm text-center">
          <h1 className="mb-4 text-7xl tracking-tight font-extrabold lg:text-9xl text-primary">
            404
          </h1>
          <p className="mb-4 text-3xl tracking-tight font-bold md:text-4xl">
            {t('errors.404.title')}
          </p>
          <p className="mb-4 text-lg font-light">
            {t('errors.404.description')}
          </p>
          <Link
            href="/"
            className="px-6 py-3 text-lg font-medium text-white bg-primary rounded-md mt-8"
          >
            {t('errors.404.button')}
          </Link>
        </div>
      </div>
    </section>
  )
}
