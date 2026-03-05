import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { BAN_KEY, RATE_LIMIT_KEY, BAN_TTL, USER_RATE_LIMIT, USER_RATE_WINDOW } from './constants'

export default class ChatbotModerationService {
    // ────────────────────────── Ban management ─────────────────────────

    /**
     * Ban a user from chatbot for 1 hour.
     */
    static async banUser(userId: string): Promise<void> {
        await redis.set(BAN_KEY(userId), '1', 'EX', BAN_TTL)
        Logger.info(`[ChatbotModerationService] User ${userId} banned from chatbot for 1 hour`)
    }

    /**
     * Unban a user from chatbot.
     */
    static async unbanUser(userId: string): Promise<void> {
        await redis.del(BAN_KEY(userId))
        Logger.info(`[ChatbotModerationService] User ${userId} unbanned from chatbot`)
    }

    /**
     * Check if a user is currently banned.
     */
    static async isUserBanned(userId: string): Promise<boolean> {
        const val = await redis.get(BAN_KEY(userId))
        return val !== null
    }

    /**
     * Get remaining ban time in seconds (0 if not banned).
     */
    static async getBanTTL(userId: string): Promise<number> {
        const ttl = await redis.ttl(BAN_KEY(userId))
        return ttl > 0 ? ttl : 0
    }

    // ────────────────────── Per-user rate limiting ──────────────────────

    /**
     * Check per-user rate limit (sliding window via Redis INCR + TTL).
     * Returns true if allowed, false if rate limit exceeded.
     */
    static async checkUserRateLimit(userId: string): Promise<boolean> {
        try {
            const key = RATE_LIMIT_KEY(userId)
            const current = await redis.incr(key)

            if (current === 1) {
                await redis.expire(key, USER_RATE_WINDOW)
            }

            if (current > USER_RATE_LIMIT) {
                Logger.warn(
                    `[ChatbotModerationService] Rate limit exceeded for user ${userId} (${current}/${USER_RATE_LIMIT})`
                )
                return false
            }

            return true
        } catch (err) {
            // Fail open — if Redis errors, allow the request
            Logger.error(`[ChatbotModerationService] Rate limit check failed: ${err}`)
            return true
        }
    }
}
