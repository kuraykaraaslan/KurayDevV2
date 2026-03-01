'use client'

import NextLink from 'next/link'
import { usePathname } from 'next/navigation'
import type { AppLanguage } from '@/types/common/I18nTypes'
import { getCurrentLangFromPathname, localizePath } from '@/libs/i18n/localePath'
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

  const currentLang: AppLanguage = getCurrentLangFromPathname(pathname)

  const localizeHref = (href: LinkProps['href']): LinkProps['href'] => {
    if (typeof href === 'string') {
      return localizePath(href, currentLang, Boolean(ignoreLang))
    }

    // URL object ({ pathname, query, ... })
    if (href.pathname) {
      // NOTE: Next.js expects pathname to be a path, not an absolute URL.
      // We localize + canonicalize here similarly to string hrefs.
      const pathname = typeof href.pathname === 'string' ? href.pathname : String(href.pathname)
      return { ...href, pathname: localizePath(pathname, currentLang, Boolean(ignoreLang)) }
    }

    return href
  }

  return <NextLink href={localizeHref(href)} {...props} />
}

export default Link
