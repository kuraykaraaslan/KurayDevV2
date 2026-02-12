import { NextRequest, NextResponse } from 'next/server'
import redisInstance from '@/libs/redis'
import type { RateLimitConfig, RateLimitResult, MiddlewareResult } from './types'

/**
 * Check if running in development mode
 */
const isDevelopment = process.env.NODE_ENV === 'development'

/**
 * Multiplier for development mode (10x more lenient)
 */
const DEV_MULTIPLIER = isDevelopment ? 10 : 1

/**
 * Rate limit configurations per route pattern
 * More specific patterns should come first
 * In development, limits are 10x higher
 */
export const RATE_LIMIT_CONFIG: Record<string, RateLimitConfig> = {
  // Auth routes - stricter limits
  '/api/auth/login': { limit: 5 * DEV_MULTIPLIER, window: 60 },
  '/api/auth/register': { limit: 3 * DEV_MULTIPLIER, window: 60 },
  '/api/auth/forgot-password': { limit: 3 * DEV_MULTIPLIER, window: 60 },
  '/api/auth/reset-password': { limit: 3 * DEV_MULTIPLIER, window: 60 },
  '/api/auth/otp': { limit: 5 * DEV_MULTIPLIER, window: 60 },

  // Contact form - prevent spam
  '/api/contact': { limit: 3 * DEV_MULTIPLIER, window: 60 },

  // Comments - prevent spam
  '/api/comments': { limit: 10 * DEV_MULTIPLIER, window: 60 },

  // Search - moderate limit
  '/api/search': { limit: 30 * DEV_MULTIPLIER, window: 60 },

  // AI endpoints - expensive operations
  '/api/ai': { limit: 10 * DEV_MULTIPLIER, window: 60 },

  // Public read endpoints - generous limits
  '/api/posts': { limit: 60 * DEV_MULTIPLIER, window: 60 },
  '/api/projects': { limit: 60 * DEV_MULTIPLIER, window: 60 },
  '/api/categories': { limit: 60 * DEV_MULTIPLIER, window: 60 },

  // Default for all other API routes
  default: { limit: 100 * DEV_MULTIPLIER, window: 60 },
}

/**
 * Routes exempt from rate limiting
 */
export const RATE_LIMIT_EXEMPT_ROUTES = [
  '/api/status',
  '/api/auth/csrf',
  '/api/cron',
  '/api/webhook',
]

/**
 * Get rate limit config for a pathname
 */
export function getRateLimitConfig(pathname: string): RateLimitConfig {
  // Check exempt routes first
  if (RATE_LIMIT_EXEMPT_ROUTES.some((route) => pathname.startsWith(route))) {
    return { limit: Infinity, window: 60 }
  }

  // Find matching config (most specific first)
  for (const [pattern, config] of Object.entries(RATE_LIMIT_CONFIG)) {
    if (pattern !== 'default' && pathname.startsWith(pattern)) {
      return config
    }
  }

  return RATE_LIMIT_CONFIG['default']
}

/**
 * Get client IP from request headers
 */
export function getClientIP(request: NextRequest): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('cf-connecting-ip')?.trim() ||
    'unknown'
  )
}

/**
 * Check rate limit using Redis sliding window
 */
export async function checkRateLimit(
  ip: string,
  pathname: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  const key = `ratelimit:${ip}:${pathname.split('/').slice(0, 4).join('/')}`

  try {
    const current = await redisInstance.incr(key)

    // Set expiry on first request
    if (current === 1) {
      await redisInstance.expire(key, config.window)
    }

    const ttl = await redisInstance.ttl(key)
    const remaining = Math.max(config.limit - current, 0)

    return {
      allowed: current <= config.limit,
      remaining,
      resetIn: ttl > 0 ? ttl : config.window,
    }
  } catch (error) {
    // If Redis fails, allow the request (fail open)
    console.error('[RateLimit] Redis error:', error)
    return { allowed: true, remaining: config.limit, resetIn: config.window }
  }
}

/**
 * Rate limit middleware handler
 * Returns response if rate limit exceeded, null to continue
 */
export async function rateLimitMiddleware(request: NextRequest): Promise<MiddlewareResult> {
  const pathname = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  const config = getRateLimitConfig(pathname)

  // Skip if exempt
  if (config.limit === Infinity) {
    return null
  }

  const { allowed, resetIn } = await checkRateLimit(clientIP, pathname, config)

  if (!allowed) {
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many requests. Please try again later.',
        },
      },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': config.limit.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': resetIn.toString(),
          'Retry-After': resetIn.toString(),
        },
      }
    )
  }

  return null
}

/**
 * Add rate limit headers to response
 */
export async function addRateLimitHeaders(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const pathname = request.nextUrl.pathname
  const clientIP = getClientIP(request)
  const config = getRateLimitConfig(pathname)

  if (config.limit !== Infinity) {
    const { remaining, resetIn } = await checkRateLimit(clientIP, pathname, config)
    response.headers.set('X-RateLimit-Limit', config.limit.toString())
    response.headers.set('X-RateLimit-Remaining', Math.max(remaining - 1, 0).toString())
    response.headers.set('X-RateLimit-Reset', resetIn.toString())
  }
}
