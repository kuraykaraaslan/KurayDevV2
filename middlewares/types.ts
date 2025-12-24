import { NextRequest, NextResponse } from 'next/server';

/**
 * Middleware handler function type
 */
export type MiddlewareHandler = (
  request: NextRequest,
  response?: NextResponse
) => Promise<NextResponse | null> | NextResponse | null;

/**
 * Rate limit configuration interface
 */
export interface RateLimitConfig {
  limit: number;
  window: number; // seconds
}

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number;
}

/**
 * CSRF validation result
 */
export interface CSRFValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Middleware result - can be response to return or null to continue
 */
export type MiddlewareResult = NextResponse | null;
