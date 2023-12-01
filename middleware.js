import { NextResponse } from "next/server";

let locales = ['en', 'tr'];

function getLocale(request) {
  const acceptLanguage = request.headers.get('Accept-Language');
  const preferredLocales = acceptLanguage.split(',').map((locale) => locale.split(';')[0]);

  for (const preferredLocale of preferredLocales) {
    if (locales.includes(preferredLocale)) {
      return preferredLocale;
    }
  }

  return locales[0]; // Fallback to the first locale
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  const pathnameHasLocale = locales.some(
    (locale) => {
      return pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`;
    }
  );

  if (pathnameHasLocale) return;

  // Redirect if there is no locale
  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  return NextResponse.redirect(request.nextUrl);
}

export const config = {
  matcher: [
    '/((?!_next|api|assets|backend|auth).*)',
  ],
};
