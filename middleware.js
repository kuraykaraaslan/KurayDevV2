import { NextResponse } from "next/server";

let locales = ['en', 'tr', 'de'];

function getLocale(request) {
  // Implement logic to determine user's preferred locale
  // Example: return request.headers['Accept-Language'] or any other method
  return 'en';
}

export function middleware(request) {
  
  const { pathname } = request.nextUrl;
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (pathnameHasLocale) return;

  const locale = getLocale(request);
  request.nextUrl.pathname = `/${locale}${pathname}`;
  
  // Example: Prevent redirection loop by checking if the locale is already present
  if (!pathname.startsWith(`/${locale}/`)) {
    return NextResponse.redirect(request.nextUrl);
  }

  // Handle other scenarios based on requirements
  
}

export const config = {
  matcher: [
    '/((?!_next|assets|api|auth|backend).*)',
    // Add more patterns as needed for URL matching
  ],
};
