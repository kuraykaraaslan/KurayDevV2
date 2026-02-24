'use client'

import { useRouter, usePathname } from 'next/navigation'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'

/**
 * Drop-in replacement for Next.js `useRouter` that automatically
 * preserves the current locale prefix in all navigations.
 *
 * Usage:
 *   const router = useI18nRouter()
 *   router.push('/blog')        // → /tr/blog  (if current lang is tr)
 *   router.push('/blog')        // → /blog      (if current lang is en)
 *   router.push('/blog', 'de')  // → /de/blog  (explicit lang override)
 */
export function useI18nRouter() {
  const router = useRouter()
  const pathname = usePathname()

  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const currentLang: AppLanguage =
    AVAILABLE_LANGUAGES.includes(firstSegment as AppLanguage) && firstSegment !== DEFAULT_LANGUAGE
      ? (firstSegment as AppLanguage)
      : DEFAULT_LANGUAGE

  const localize = (href: string, lang: AppLanguage = currentLang): string => {
    if (lang === DEFAULT_LANGUAGE) return href
    return `/${lang}${href.startsWith('/') ? href : `/${href}`}`
  }

  return {
    ...router,
    currentLang,
    localize,
    push: (href: string, lang?: AppLanguage) => router.push(localize(href, lang)),
    replace: (href: string, lang?: AppLanguage) => router.replace(localize(href, lang)),
    prefetch: (href: string, lang?: AppLanguage) => router.prefetch(localize(href, lang)),
  }
}

export default useI18nRouter
