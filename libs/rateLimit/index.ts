// libs/rateLimiter.ts
import { redis } from '../redis';

const WINDOW_SECONDS = 60;
const MAX_REQUESTS = 10;

export const checkRateLimit = async (key: string): Promise<{ success: boolean; remaining: number }> => {
  const redisKey = `ratelimit:${key}`;
  const count = await redis.incr(redisKey);

  if (count === 1) await redis.expire(redisKey, WINDOW_SECONDS);

  return {
    success: count <= MAX_REQUESTS,
    remaining: Math.max(0, MAX_REQUESTS - count),
  };
};
