'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'
import type { ComponentProps } from 'react'

type LinkProps = ComponentProps<typeof NextLink> & { ignoreLang?: boolean }

/**
 * Drop-in replacement for Next.js `Link` that automatically
 * preserves the current locale prefix in all href values.
 *
 * Pass `ignoreLang` to skip prefixing (e.g. /admin, /auth/*, /settings).
 *
 * Usage:
 *   <Link href="/blog">Blog</Link>              // → /tr/blog  (if current lang is tr)
 *   <Link href="/admin" ignoreLang>Admin</Link> // → /admin    (no prefix)
 */
export function Link({ href, ignoreLang, ...props }: LinkProps) {
  const pathname = usePathname()

  const firstSegment = pathname.split('/').filter(Boolean)[0]
  const currentLang: AppLanguage =
    AVAILABLE_LANGUAGES.includes(firstSegment as AppLanguage) && firstSegment !== DEFAULT_LANGUAGE
      ? (firstSegment as AppLanguage)
      : DEFAULT_LANGUAGE

  const localizeHref = (href: LinkProps['href']): LinkProps['href'] => {
    if (ignoreLang || currentLang === DEFAULT_LANGUAGE) return href

    if (typeof href === 'string') {
      // External links — unchanged
      if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:')) return href
      return `/${currentLang}${href.startsWith('/') ? href : `/${href}`}`
    }

    // URL object ({ pathname, query, ... })
    if (href.pathname) {
      return { ...href, pathname: `/${currentLang}${href.pathname}` }
    }

    return href
  }

  return <NextLink href={localizeHref(href)} {...props} />
}

export default Link
