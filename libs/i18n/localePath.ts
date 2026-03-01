import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, type AppLanguage } from '@/types/common/I18nTypes'

function isSpecialHref(href: string): boolean {
  // In-page anchors or query-only navigations should not be prefixed.
  return href.startsWith('#') || href.startsWith('?')
}

function isNonHttpProtocol(href: string): boolean {
  return (
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('sms:') ||
    href.startsWith('whatsapp:')
  )
}

function safeOrigin(input?: string): string | null {
  if (!input) return null
  try {
    return new URL(input).origin
  } catch {
    return null
  }
}

/**
 * If `href` is a same-origin absolute URL (e.g. https://kuray.dev/blog),
 * return only its path+search+hash so Next.js treats it as internal.
 * Otherwise return the original `href`.
 */
export function normalizeSameOriginAbsoluteHref(href: string): string {
  if (!href) return href
  if (isSpecialHref(href) || isNonHttpProtocol(href)) return href

  const isAbsoluteHttp = href.startsWith('http://') || href.startsWith('https://')
  if (!isAbsoluteHttp) return href

  let parsed: URL
  try {
    parsed = new URL(href)
  } catch {
    return href
  }

  const allowedOrigins = new Set<string>()
  if (typeof window !== 'undefined') allowedOrigins.add(window.location.origin)

  // Prefer the public app host if configured (works in client bundles)
  allowedOrigins.add(safeOrigin(process.env.NEXT_PUBLIC_APPLICATION_HOST) ?? '')
  allowedOrigins.add(safeOrigin(process.env.APPLICATION_HOST) ?? '')

  if (!allowedOrigins.has(parsed.origin)) return href
  return `${parsed.pathname}${parsed.search}${parsed.hash}` || '/'
}

export function getCurrentLangFromPathname(pathname?: string | null): AppLanguage {
  const firstSegment = (pathname ?? '').split('/').filter(Boolean)[0]
  const maybeLang = firstSegment as AppLanguage
  return AVAILABLE_LANGUAGES.includes(maybeLang) && maybeLang !== DEFAULT_LANGUAGE ? maybeLang : DEFAULT_LANGUAGE
}

function stripDefaultLangPrefix(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const segments = normalized.split('/').filter(Boolean)
  if (segments[0] !== DEFAULT_LANGUAGE) return normalized

  const rest = segments.slice(1).join('/')
  return rest ? `/${rest}` : '/'
}

function isAlreadyLocalized(path: string): boolean {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const first = normalized.split('/').filter(Boolean)[0] as AppLanguage | undefined
  return Boolean(first && AVAILABLE_LANGUAGES.includes(first) && first !== DEFAULT_LANGUAGE)
}

/**
 * Converts an href-like string into a locale-aware internal path.
 * - Preserves external links (http(s) other-origin, mailto/tel, etc.)
 * - Strips same-origin absolute URLs into paths
 * - Avoids double-prefixing if a locale prefix already exists
 * - Keeps DEFAULT_LANGUAGE unprefixed (canonical)
 */
export function localizePath(href: string, lang: AppLanguage, ignoreLang = false): string {
  if (!href) return href
  if (isSpecialHref(href) || isNonHttpProtocol(href)) return href

  const normalizedHref = normalizeSameOriginAbsoluteHref(href)

  // External absolute URLs stay as-is
  if (normalizedHref.startsWith('http://') || normalizedHref.startsWith('https://')) return normalizedHref

  // Ensure leading slash for internal paths (e.g. 'blog' -> '/blog')
  const path = normalizedHref.startsWith('/') ? normalizedHref : `/${normalizedHref}`

  // Canonicalize /en/... to /...
  const canonical = stripDefaultLangPrefix(path)

  // If caller supplied an explicit non-default locale, trust it.
  if (isAlreadyLocalized(canonical)) return canonical

  if (ignoreLang || lang === DEFAULT_LANGUAGE) return canonical

  // / -> /tr
  if (canonical === '/') return `/${lang}`

  return `/${lang}${canonical}`
}
