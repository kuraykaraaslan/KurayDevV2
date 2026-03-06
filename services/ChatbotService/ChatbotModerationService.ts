import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { BAN_KEY, RATE_LIMIT_KEY, BAN_TTL_SECONDS, USER_RATE_LIMIT_MAX, USER_RATE_WINDOW_SECONDS } from './constants'

export default class ChatbotModerationService {
    static async banUser(userId: string): Promise<void> {
        await redis.set(BAN_KEY(userId), '1', 'EX', BAN_TTL_SECONDS)
        Logger.info(`[ChatbotModerationService] User ${userId} banned from chatbot for 1 hour`)
    }

    static async unbanUser(userId: string): Promise<void> {
        await redis.del(BAN_KEY(userId))
        Logger.info(`[ChatbotModerationService] User ${userId} unbanned from chatbot`)
    }

    static async isUserBanned(userId: string): Promise<boolean> {
        const val = await redis.get(BAN_KEY(userId))
        return val !== null
    }

    static async getBanTTL(userId: string): Promise<number> {
        const ttl = await redis.ttl(BAN_KEY(userId))
        return ttl > 0 ? ttl : 0
    }

    static async checkUserRateLimit(userId: string): Promise<boolean> {
        try {
            const key = RATE_LIMIT_KEY(userId)
            const current = await redis.incr(key)

            if (current === 1) {
                await redis.expire(key, USER_RATE_WINDOW_SECONDS)
            }

            if (current > USER_RATE_LIMIT_MAX) {
                Logger.warn(
                    `[ChatbotModerationService] Rate limit exceeded for user ${userId} (${current}/${USER_RATE_LIMIT_MAX})`
                )
                return false
            }

            return true
        } catch (err) {
            Logger.error(`[ChatbotModerationService] Rate limit check failed: ${err}`)
            return true
        }
    }
}
