import { NextResponse, NextRequest } from 'next/server';

import routeLocalization from '@/middlewares/routeLocalization';
import routeProtection from '@/middlewares/routeProtection';


const localizedIgnoreRoutes = ['/_next', '/assets', '/api', '/auth', '/backend', '/_error', '/_app', '/_document', '/_error' , '/terminal'];
const allowedLanguages = ['en', 'tr', 'th', 'de'];

export async function middleware(request: NextRequest, response: NextResponse) {

  const { pathname } = request.nextUrl;

  if (localizedIgnoreRoutes.some(route => pathname.startsWith(route))) {
    return pathname;
  }

  const isLocalized = allowedLanguages.some(lang => pathname.startsWith(`/${lang}`));

  if (isLocalized) {
    return pathname;
  }

  return `/en${pathname}`;
}
 
export const config = {
  matcher: [
    // Skip all internal paths (_next)
    '/_next',
    // Skip all API routes
    '/api',
    // Skip all backend routes
    '/backend',
    // Skip all auth routes
    '/auth',
    // Skip all error routes
    '/_error',
    // Skip all app routes
    '/_app',
    // Skip all document routes
    '/_document',
    // Skip all terminal routes
    '/terminal',
    // Optional: only run on root (/) URL
    // '/'
  ],
}