import { NextRequest, NextResponse } from 'next/server';
import { CSRF_HEADER_NAME } from './csrf';
import type { MiddlewareResult } from './types';

/**
 * Allowed origins for CORS
 */
export const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://kuray.dev',
  'https://www.kuray.dev',
  'http://127.0.0.1:3000',
];

/**
 * Allowed HTTP methods
 */
export const ALLOWED_METHODS = 'GET, POST, PUT, DELETE, PATCH, OPTIONS';

/**
 * Allowed request headers
 */
export const ALLOWED_HEADERS = `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER_NAME}`;

/**
 * Check if origin is allowed
 */
export function isAllowedOrigin(origin: string | null): boolean {
  return ALLOWED_ORIGINS.includes(origin || '');
}

/**
 * Handle CORS preflight request
 */
export function corsPreflightMiddleware(request: NextRequest): MiddlewareResult {
  if (request.method !== 'OPTIONS') {
    return null;
  }

  const origin = request.headers.get('origin');
  const isAllowed = isAllowedOrigin(origin);

  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': isAllowed ? origin || '*' : '',
      'Access-Control-Allow-Methods': ALLOWED_METHODS,
      'Access-Control-Allow-Headers': ALLOWED_HEADERS,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Add CORS headers to response
 */
export function addCorsHeaders(request: NextRequest, response: NextResponse): void {
  const origin = request.headers.get('origin');
  
  if (isAllowedOrigin(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin || '');
    response.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
    response.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }
}
