/**
 * Middleware modules - centralized exports
 */

// Types
export type {
  MiddlewareHandler,
  RateLimitConfig,
  RateLimitResult,
  CSRFValidationResult,
  MiddlewareResult,
} from './types'

// Rate Limit
export {
  RATE_LIMIT_CONFIG,
  RATE_LIMIT_EXEMPT_ROUTES,
  getRateLimitConfig,
  getClientIP,
  checkRateLimit,
  rateLimitMiddleware,
  addRateLimitHeaders,
} from './rateLimit'

// CSRF
export {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  CSRF_EXEMPT_ROUTES,
  CSRF_SAFE_METHODS,
  isCSRFExempt,
  validateCSRF,
  csrfMiddleware,
} from './csrf'

// CORS
export {
  ALLOWED_ORIGINS,
  ALLOWED_METHODS,
  ALLOWED_HEADERS,
  isAllowedOrigin,
  corsPreflightMiddleware,
  addCorsHeaders,
} from './cors'

// Security
export { SECURITY_HEADERS, addSecurityHeaders } from './security'
