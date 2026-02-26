import { NextResponse } from 'next/server'
import {
  rateLimitMiddleware,
  addRateLimitHeaders,
  addCorsHeaders,
  addSecurityHeaders,
} from '@/middlewares'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/types/common/I18nTypes'

// Static assets served from /public — skip lang routing
const STATIC_EXTENSIONS = ['.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.woff', '.woff2', '.ttf', '.otf', '.webmanifest']

// PWA files served from /public — skip lang routing
const STATIC_FILES = ['/sw.js', '/manifest.webmanifest', '/icon-192x192.png', '/icon-512x512.png']

function isStaticAsset(pathname: string): boolean {
  return (
    STATIC_EXTENSIONS.some((ext) => pathname.endsWith(ext)) ||
    STATIC_FILES.includes(pathname)
  )
}

/**
 * Next.js 16 Proxy — orchestrates API security + frontend i18n routing
 *
 * Rules (frontend paths only):
 *  /en/...           → redirect to /... (canonical, en is hidden default)
 *  /tr/... /de/... → pass through  ([lang] route handles it)
 *  /...              → rewrite internally to /en/... (URL stays clean)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── API routes: rate limiting + security headers ─────────────────────────
  if (pathname.startsWith('/api')) {
    const rateLimitResponse = await rateLimitMiddleware(request)
    if (rateLimitResponse) return rateLimitResponse

    const response = NextResponse.next()
    await addRateLimitHeaders(request, response)
    addCorsHeaders(request, response)
    addSecurityHeaders(response)
    return response
  }

  // ── Skip: auth/admin routes and static assets ────────────────────────────
  if (
    pathname.startsWith('/auth') ||
    pathname.startsWith('/admin') ||
    isStaticAsset(pathname)
  ) {
    return NextResponse.next()
  }

  // ── Frontend i18n routing ─────────────────────────────────────────────────
  const segments = pathname.split('/').filter(Boolean)
  const firstSegment = segments[0]

  // /en/... → redirect to canonical URL without /en prefix
  if (firstSegment === DEFAULT_LANGUAGE) {
    const rest = segments.slice(1).join('/')
    const canonicalUrl = request.nextUrl.clone()
    canonicalUrl.pathname = rest ? `/${rest}` : '/'
    return NextResponse.redirect(canonicalUrl)
  }

  // /tr/... /de/... etc. → valid non-default lang, pass through
  if (AVAILABLE_LANGUAGES.includes(firstSegment as (typeof AVAILABLE_LANGUAGES)[number])) {
    return NextResponse.next()
  }

  // No lang prefix → rewrite to /en/... internally (URL stays the same)
  const rewriteUrl = request.nextUrl.clone()
  rewriteUrl.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
  return NextResponse.rewrite(rewriteUrl)
}
