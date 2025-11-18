import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;

// STATIC PATHS ALWAYS SKIPPED
const ALWAYS_SKIP = ['/robots.txt', '/favicon.ico'];

function shouldSkipMiddleware(pathname: string): boolean {
  // Always skip these
  if (ALWAYS_SKIP.includes(pathname)) return true;

  // Skip all XML files (sitemap.xml & any .xml)
  if (pathname.endsWith('.xml')) return true;

  // Skip Next.js internal files
  if (pathname.startsWith('/_next')) return true;

  // Skip public static files (images, fonts, css, js, etc.)
  if (PUBLIC_FILE.test(pathname)) return true;

  return false;
}

// Supported locales
const SUPPORTED_LOCALES = ['de', 'en', 'et', 'gr', 'mt', 'th', 'tr'];
const DEFAULT_LOCALE = 'en';

function getLocaleFromHeader(request: NextRequest): string {
  const acceptLanguage = request.headers.get('accept-language');
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferredLanguages = acceptLanguage
    .split(',')
    .map(lang => lang.trim().split(';')[0]);

  const matchedLocale = preferredLanguages.find(lang =>
    SUPPORTED_LOCALES.includes(lang.split('-')[0])
  );

  return matchedLocale?.split('-')[0] || DEFAULT_LOCALE;
}

export function middleware(request: NextRequest) {
  const { pathname, locale, search } = request.nextUrl;

  // BYPASS ALL STATIC FILES INCLUDING XML + robots.txt
  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  // Handle default locale → Redirect
  if (locale === 'default') {
    const detectedLocale = getLocaleFromHeader(request);
    const url = new URL(`/${detectedLocale}${pathname}${search}`, request.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Exclude ALL static files and XML files from middleware
    '/((?!_next|.*\\.xml|robots.txt|favicon.ico|.*\\..*).*)',
  ],
};
