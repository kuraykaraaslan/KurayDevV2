import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import {
  rateLimitMiddleware,
  addRateLimitHeaders,
  addCorsHeaders,
  addSecurityHeaders,
} from '@/middlewares'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE } from '@/types/common/I18nTypes'

const STATIC_EXTENSIONS = new Set([
  '.ico', '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg',
  '.woff', '.woff2', '.ttf', '.otf', '.webmanifest',
])

const STATIC_FILES = new Set([
  '/sw.js',
  '/manifest.webmanifest',
  '/icon-192x192.png',
  '/icon-512x512.png',
  '/favicon.ico',
  '/robots.txt',
  '/sitemap.xml',
  '/opensearch.xml',
  '/site.webmanifest',
])

const SKIP_PREFIXES = [
  '/_next',     // Next.js internals (chunks, images, etc.)
  '/_vercel',   // Vercel internals (if any)
  '/__nextjs',  // tooling edge-cases
  '/auth',
  '/admin',
]

function shouldSkipI18n(pathname: string): boolean {
  if (SKIP_PREFIXES.some((p) => pathname.startsWith(p))) return true
  if (STATIC_FILES.has(pathname)) return true

  // /sitemap-*.xml
  if (pathname.startsWith('/sitemap') && pathname.endsWith('.xml')) return true

  // extension check (only last segment)
  const last = pathname.split('/').pop() || ''
  const dot = last.lastIndexOf('.')
  if (dot !== -1) {
    const ext = last.slice(dot).toLowerCase()
    if (STATIC_EXTENSIONS.has(ext)) return true
  }

  return false
}

async function handleApi(request: NextRequest) {
  const rateLimitResponse = await rateLimitMiddleware(request)
  if (rateLimitResponse) return rateLimitResponse

  const response = NextResponse.next()
  await addRateLimitHeaders(request, response)
  addCorsHeaders(request, response)
  addSecurityHeaders(response)
  return response
}

function handleI18n(request: NextRequest) {
  const { pathname } = request.nextUrl
  const segments = pathname.split('/').filter(Boolean)
  const first = segments[0]

  // /en/... → redirect to canonical URL without /en
  if (first === DEFAULT_LANGUAGE) {
    const rest = segments.slice(1).join('/')
    const url = request.nextUrl.clone()
    url.pathname = rest ? `/${rest}` : '/'
    return NextResponse.redirect(url)
  }

  // /tr/... /de/... → pass through
  if (AVAILABLE_LANGUAGES.includes(first as (typeof AVAILABLE_LANGUAGES)[number])) {
    return NextResponse.next()
  }

  // no prefix → rewrite internally to /en/...
  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
  return NextResponse.rewrite(url)
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API
  if (pathname.startsWith('/api')) return handleApi(request)

  // Frontend skip
  if (shouldSkipI18n(pathname)) return NextResponse.next()

  // Frontend i18n
  return handleI18n(request)
}