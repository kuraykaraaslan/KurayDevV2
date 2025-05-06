import { NextRequest, NextResponse } from 'next/server';

const PUBLIC_FILE = /\.(.*)$/;
//de, en, et, gr, mt, th, tr
const SUPPORTED_LOCALES = ['de', 'en', 'et', 'gr', 'mt', 'th', 'tr'];
const DEFAULT_LOCALE = 'en';

function shouldSkipMiddleware(pathname: string): boolean {
  return pathname.startsWith('/_next') || PUBLIC_FILE.test(pathname);
}

function getLocaleFromHeader(req: NextRequest): string {
  const acceptLanguage = req.headers.get('accept-language');
  if (!acceptLanguage) return DEFAULT_LOCALE;

  const preferredLanguages = acceptLanguage.split(',').map(lang => lang.trim().split(';')[0]);
  const matchedLocale = preferredLanguages.find(lang =>
    SUPPORTED_LOCALES.includes(lang.split('-')[0])
  );
  return matchedLocale?.split('-')[0] || DEFAULT_LOCALE;
}

export function middleware(req: NextRequest) {
  const { pathname, locale, search } = req.nextUrl;

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  if (locale === 'default') {
    const detectedLocale = getLocaleFromHeader(req);
    const url = new URL(`/${detectedLocale}${pathname}${search}`, req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
};
