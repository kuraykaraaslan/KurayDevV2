'use client'

import { useRouter as useNextRouter, usePathname } from 'next/navigation'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'

/**
 * Drop-in replacement for Next.js `useRouter` that automatically
 * preserves the current locale prefix in all navigations.
 *
 * Usage:
 *   const router = useRouter()
 *   router.push('/blog')        // → /tr/blog  (if current lang is tr)
 *   router.push('/blog')        // → /blog      (if current lang is en)
 *   router.push('/blog', 'de')  // → /de/blog  (explicit lang override)
 */
export function useRouter() {
  const router = useNextRouter()
  const pathname = usePathname()

  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const currentLang: AppLanguage =
    AVAILABLE_LANGUAGES.includes(firstSegment as AppLanguage) && firstSegment !== DEFAULT_LANGUAGE
      ? (firstSegment as AppLanguage)
      : DEFAULT_LANGUAGE

  const localize = (href: string, lang: AppLanguage = currentLang, ignoreLang = false): string => {
    if (ignoreLang || lang === DEFAULT_LANGUAGE) return href
    return `/${lang}${href.startsWith('/') ? href : `/${href}`}`
  }

  return {
    ...router,
    currentLang,
    localize,
    push: (href: string, opts?: AppLanguage | { lang?: AppLanguage; ignoreLang?: boolean }) => {
      const lang = typeof opts === 'string' ? opts : opts?.lang
      const ignoreLang = typeof opts === 'object' ? opts.ignoreLang : false
      return router.push(localize(href, lang, ignoreLang))
    },
    replace: (href: string, opts?: AppLanguage | { lang?: AppLanguage; ignoreLang?: boolean }) => {
      const lang = typeof opts === 'string' ? opts : opts?.lang
      const ignoreLang = typeof opts === 'object' ? opts.ignoreLang : false
      return router.replace(localize(href, lang, ignoreLang))
    },
    prefetch: (href: string, opts?: AppLanguage | { lang?: AppLanguage; ignoreLang?: boolean }) => {
      const lang = typeof opts === 'string' ? opts : opts?.lang
      const ignoreLang = typeof opts === 'object' ? opts.ignoreLang : false
      return router.prefetch(localize(href, lang, ignoreLang))
    },
  }
}

export default useRouter
