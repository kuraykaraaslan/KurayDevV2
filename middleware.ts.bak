// middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from './libs/rateLimit';

const PUBLIC_FILE = /\.(.*)$/;
const DEFAULT_LOCALE = 'en';

async function handleApiRateLimit(req: NextRequest): Promise<NextResponse | null> {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const { success, remaining } = await checkRateLimit(ip);

  const res = NextResponse.next();
  res.headers.set('X-RateLimit-Limit', '10');
  res.headers.set('X-RateLimit-Remaining', remaining.toString());

  if (!success) {
    return new NextResponse(JSON.stringify({ message: 'Too many requests' }), {
      status: 429,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return res;
}

function handleLocaleRedirect(req: NextRequest): NextResponse | null {
  const { pathname, locale, search } = req.nextUrl;

  if (locale === 'default') {
    // Always assume English is the default
    return NextResponse.redirect(
      new URL(`/${DEFAULT_LOCALE}${pathname}${search}`, req.url)
    );
  }

  // No redirect needed if already on 'en' or any other locale
  return null;
}

function shouldSkipMiddleware(pathname: string): boolean {
  return pathname.startsWith('/_next') || PUBLIC_FILE.test(pathname);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (shouldSkipMiddleware(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/api/')) {
    const rateLimitResponse = await handleApiRateLimit(req);
    return rateLimitResponse;
  }

  const redirectResponse = handleLocaleRedirect(req);
  if (redirectResponse) {
    return redirectResponse;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|.*\\..*).*)',
  ],
};
