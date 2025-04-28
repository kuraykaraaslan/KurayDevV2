// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit } from './libs/rateLimit';

export async function middleware(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
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

export const config = {
  matcher: ['/api/:path*', '/api/:path*'],
};