import { NextRequest } from 'next/server';

/**
 * Spam protection utilities for contact forms
 * Implements honeypot field and timing-based detection
 */

/**
 * Minimum time (in ms) a human would take to fill the form
 * Forms submitted faster than this are likely bots
 */
export const MIN_FORM_FILL_TIME_MS = 3000; // 3 seconds

/**
 * Honeypot field name - should be hidden via CSS
 * Bots will fill this field, humans won't see it
 */
export const HONEYPOT_FIELD_NAME = 'website';

/**
 * Check if the honeypot field was filled (indicates bot)
 */
export function isHoneypotFilled(honeypotValue: string | undefined | null): boolean {
  return !!honeypotValue && honeypotValue.trim().length > 0;
}

/**
 * Check if form was submitted too quickly (indicates bot)
 * @param formLoadTime - Timestamp when form was loaded (from hidden field)
 * @param submitTime - Current timestamp
 */
export function isSubmittedTooQuickly(formLoadTime: number | undefined): boolean {
  if (!formLoadTime) return false; // If no timestamp provided, skip this check
  
  const timeTaken = Date.now() - formLoadTime;
  return timeTaken < MIN_FORM_FILL_TIME_MS;
}

/**
 * Detect common spam patterns in message content
 */
export function hasSpamPatterns(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  
  // Common spam patterns
  const spamPatterns = [
    // Cryptocurrency/financial spam
    /\b(crypto|bitcoin|btc|ethereum|forex|trading|invest|profit)\b.*\b(earn|make|money|usd|\$)\b/i,
    // SEO spam
    /\b(seo|backlink|rank|google|traffic)\b.*\b(service|offer|cheap|best)\b/i,
    // Adult content
    /\b(viagra|cialis|pharmacy|pills|medication)\b/i,
    // Too many URLs
    /(https?:\/\/[^\s]+){3,}/i, // 3+ URLs is suspicious
    // All caps with exclamation
    /[A-Z]{20,}/,
    // Repeated characters
    /(.)\1{10,}/,
  ];
  
  return spamPatterns.some(pattern => pattern.test(lowerMessage));
}

/**
 * Get client fingerprint for rate limiting
 */
export function getClientFingerprint(request: NextRequest): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
             request.headers.get('x-real-ip') ||
             'unknown';
  const userAgent = request.headers.get('user-agent') || 'unknown';
  
  // Simple hash of IP + first part of user agent
  return `${ip}:${userAgent.slice(0, 50)}`;
}

/**
 * Comprehensive spam check result
 */
export interface SpamCheckResult {
  isSpam: boolean;
  reason?: string;
}

/**
 * Run all spam checks
 */
export function checkForSpam(data: {
  honeypot?: string;
  formLoadTime?: number;
  message: string;
}): SpamCheckResult {
  // Check honeypot
  if (isHoneypotFilled(data.honeypot)) {
    return { isSpam: true, reason: 'honeypot_filled' };
  }
  
  // Check timing
  if (isSubmittedTooQuickly(data.formLoadTime)) {
    return { isSpam: true, reason: 'submitted_too_quickly' };
  }
  
  // Check content patterns
  if (hasSpamPatterns(data.message)) {
    return { isSpam: true, reason: 'spam_patterns_detected' };
  }
  
  return { isSpam: false };
}
