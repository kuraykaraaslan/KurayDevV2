import { NextRequest, NextResponse } from 'next/server'
import type { CSRFValidationResult, MiddlewareResult } from './types'

export const CSRF_COOKIE_NAME = 'csrf-token'
export const CSRF_HEADER_NAME = 'x-csrf-token'

/**
 * Routes exempt from CSRF protection
 */
export const CSRF_EXEMPT_ROUTES = [
  '/api/auth/callback',
  '/api/cron',
  '/api/webhook',
  '/api/status',
  '/api/auth/csrf',
]

/**
 * HTTP methods that don't require CSRF protection
 */
export const CSRF_SAFE_METHODS = ['GET', 'HEAD', 'OPTIONS']

/**
 * Check if route is exempt from CSRF
 */
export function isCSRFExempt(pathname: string): boolean {
  return CSRF_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))
}

/**
 * Validate CSRF token using Double Submit Cookie pattern
 */
export function validateCSRF(request: NextRequest): CSRFValidationResult {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value
  const headerToken = request.headers.get(CSRF_HEADER_NAME)

  if (!cookieToken || !headerToken) {
    return {
      valid: false,
      error: 'CSRF token missing. Include both cookie and X-CSRF-Token header.',
    }
  }

  if (cookieToken !== headerToken) {
    return {
      valid: false,
      error: 'CSRF token mismatch.',
    }
  }

  return { valid: true }
}

/**
 * CSRF middleware handler
 * Returns response if validation fails, null to continue
 */
export function csrfMiddleware(request: NextRequest): MiddlewareResult {
  const pathname = request.nextUrl.pathname
  const requiresCSRF = !CSRF_SAFE_METHODS.includes(request.method) && !isCSRFExempt(pathname)

  if (!requiresCSRF) {
    return null
  }

  const validation = validateCSRF(request)

  if (!validation.valid) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'CSRF_VALIDATION_FAILED',
          message: validation.error || 'CSRF validation failed',
        },
      },
      { status: 403 }
    )
  }

  return null
}
