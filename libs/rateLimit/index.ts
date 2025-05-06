// libs/RateLimiter.ts

import { NextResponse } from 'next/server';
import redisInstance from '../redis';

const RATE_LIMIT = 10;
const RATE_DURATION = 60; // seconds

export default class RateLimiter {
  static getIpFromRequest(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip')?.trim() ||
      'unknown'
    );
  }

  static async check(ip: string): Promise<{ success: boolean; remaining: number }> {
    const key = `rate_limit:${ip}`;
    const current = await redisInstance.get(key);
    const currentCount = current ? parseInt(current, 10) : 0;
    const newCount = currentCount + 1;
    await redisInstance.set(key, newCount, 'EX', RATE_DURATION);
    return { success: newCount <= RATE_LIMIT, remaining: Math.max(RATE_LIMIT - newCount, 0) };
  }

  /**
   * Applies rate limiting. If limit exceeded, returns 429 response.
   * Otherwise, returns modified response with headers.
   */
  static async useRateLimit(request: NextRequest): Promise<NextResponse | null> {
    const ip = this.getIpFromRequest(request);
    const { success, remaining } = await this.check(ip);

    const res = NextResponse.next();
    res.headers.set('X-RateLimit-Limit', RATE_LIMIT.toString());
    res.headers.set('X-RateLimit-Remaining', remaining.toString());

    if (!success) {
      return new NextResponse(JSON.stringify({ message: 'Too many requests' }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return res;
  }
}
