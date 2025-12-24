import { NextRequest, NextResponse } from 'next/server';

// CSRF configuration
const CSRF_COOKIE_NAME = 'csrf-token';
const CSRF_HEADER_NAME = 'x-csrf-token';

// CSRF koruması gerektirmeyen route'lar
const CSRF_EXEMPT_ROUTES = [
  '/api/auth/callback',
  '/api/cron',
  '/api/webhook',
  '/api/status',
  '/api/auth/csrf',
];

function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some(route => pathname.startsWith(route));
}

/**
 * Simple CSRF validation using Double Submit Cookie pattern
 */
function validateCSRF(request: NextRequest): { valid: boolean; error?: string } {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);

  if (!cookieToken || !headerToken) {
    return { 
      valid: false, 
      error: 'CSRF token missing. Include both cookie and X-CSRF-Token header.' 
    };
  }

  if (cookieToken !== headerToken) {
    return { 
      valid: false, 
      error: 'CSRF token mismatch.' 
    };
  }

  return { valid: true };
}

export async function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const pathname = request.nextUrl.pathname;
  
  // İzin verilen domains
  const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://kuray.dev',
    'https://www.kuray.dev',
    'http://127.0.0.1:3000',
  ];

  const isAllowedOrigin = allowedOrigins.includes(origin || '');

  // CORS preflight
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': isAllowedOrigin ? origin || '*' : '',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER_NAME}`,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  // CSRF validation for mutating requests (POST, PUT, DELETE, PATCH)
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  const requiresCSRF = !safeMethods.includes(request.method) && !isCSRFExempt(pathname);

  if (requiresCSRF) {
    const csrfValidation = validateCSRF(request);
    
    if (!csrfValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'CSRF_VALIDATION_FAILED',
            message: csrfValidation.error || 'CSRF validation failed',
          },
        },
        { status: 403 }
      );
    }
  }

  const response = NextResponse.next();

  // CORS headers
  if (isAllowedOrigin) {
    response.headers.set('Access-Control-Allow-Origin', origin || '');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', `Content-Type, Authorization, X-Requested-With, ${CSRF_HEADER_NAME}`);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  // Security headers
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(self), interest-cohort=()');

  return response;
}

export const config = {
  matcher: '/api/:path*',
};
