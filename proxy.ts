import {  NextResponse } from 'next/server'
import {
  rateLimitMiddleware,
  addRateLimitHeaders,
  addCorsHeaders,
  addSecurityHeaders,
} from '@/middlewares'
import { AVAILABLE_LANGUAGES, DEFAULT_LANGUAGE, LANG_EXCLUSIVE, type AppLanguage } from '@/types/common/I18nTypes'

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
  '/api',
  '/s/',  // short links
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

/**
 * Get country code from IP using MaxMind API
 */
async function getCountryCodeFromIP(ip: string): Promise<string | null> {
  const accountId = process.env.MAXMIND_ACCOUNT_ID
  const apiKey = process.env.MAXMIND_API_KEY

  if (!accountId || !apiKey) return null

  try {
    const auth = Buffer.from(`${accountId}:${apiKey}`).toString('base64')
    const response = await fetch(`https://geoip.maxmind.com/geoip/v2.1/country/${ip}`, {
      headers: { Authorization: `Basic ${auth}` },
      // Cache for 1 hour
      next: { revalidate: 3600 },
    })

    if (!response.ok) return null

    const data = await response.json()
    return data?.country?.iso_code ?? null
  } catch {
    return null
  }
}

/**
 * Check if a language is geo-exclusive and if the user is allowed to access it
 */
async function isLanguageAccessAllowed(lang: AppLanguage, request: NextRequest): Promise<boolean> {
  const exclusiveCountries = LANG_EXCLUSIVE[lang]
  
  // Not a geo-exclusive language - allow access
  if (!exclusiveCountries || exclusiveCountries.length === 0) {
    return true
  }

  // Get user's IP
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1'

  // Skip geo check for localhost/development
  if (ip === '127.0.0.1' || ip === '::1' || ip.startsWith('192.168.') || ip.startsWith('10.')) {
    return true
  }

  const countryCode = await getCountryCodeFromIP(ip)

  // If we can't determine country or user is not from an allowed country, deny access
  if (!countryCode || !exclusiveCountries.includes(countryCode.toUpperCase())) {
    return false
  }

  return true
}

async function handleI18n(request: NextRequest) {
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

  // /tr/... /de/... → pass through (with geo-exclusive check)
  if (AVAILABLE_LANGUAGES.includes(first as (typeof AVAILABLE_LANGUAGES)[number])) {
    const lang = first as AppLanguage
    
    // Check if this is a geo-exclusive language and if access is allowed
    const allowed = await isLanguageAccessAllowed(lang, request)
    if (!allowed) {
      // Redirect to default language version
      const rest = segments.slice(1).join('/')
      const url = request.nextUrl.clone()
      url.pathname = rest ? `/${rest}` : '/'
      return NextResponse.redirect(url)
    }
    
    return NextResponse.next()
  }

  // no prefix → rewrite internally to /en/...
  const url = request.nextUrl.clone()
  url.pathname = `/${DEFAULT_LANGUAGE}${pathname}`
  return NextResponse.rewrite(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
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