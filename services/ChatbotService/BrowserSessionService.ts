import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession } from '@/dtos/ChatbotDTO'
import ChatSessionService from './ChatSessionService'
import {
    BROWSER_SESSION,
    DISCONNECT_KEY,
    SESSION_TTL,
    SESSION_CLOSE_TIMEOUT,
} from './constants'

export default class BrowserSessionService {
    /**
     * Restore a session for a browser.
     * If disconnected > 5 min ago → close old session, return null.
     * Otherwise → return session + messages.
     */
    static async restoreSession(
        userId: string,
        browserId: string
    ): Promise<{ session: StoredChatSession; messages: StoredChatMessage[] } | null> {
        const chatSessionId = await redis.get(BROWSER_SESSION(browserId))
        if (!chatSessionId) return null

        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) {
            await redis.del(BROWSER_SESSION(browserId))
            return null
        }

        if (session.userId !== userId) {
            await redis.del(BROWSER_SESSION(browserId))
            return null
        }

        if (session.status === 'CLOSED') {
            await redis.del(BROWSER_SESSION(browserId))
            return null
        }

        const disconnectedAt = await redis.get(DISCONNECT_KEY(browserId))
        if (disconnectedAt) {
            const elapsed = Date.now() - parseInt(disconnectedAt, 10)
            if (elapsed > SESSION_CLOSE_TIMEOUT * 1000) {
                // 5 min passed → close the session
                session.status = 'CLOSED'
                await ChatSessionService.updateSession(session)
                await redis.del(BROWSER_SESSION(browserId))
                await redis.del(DISCONNECT_KEY(browserId))
                Logger.info(
                    `[BrowserSessionService] Session ${chatSessionId} auto-closed (browser offline > 5 min)`
                )
                return null
            }
            // Still within 5 min → cancel disconnect timer
            await redis.del(DISCONNECT_KEY(browserId))
        }

        const messages = await ChatSessionService.getMessages(chatSessionId)
        return { session, messages }
    }

    /**
     * Mark a browser as disconnected. If they don't reconnect within 5 min,
     * the session will be closed on next restore attempt.
     */
    static async markBrowserDisconnected(browserId: string): Promise<void> {
        await redis.set(
            DISCONNECT_KEY(browserId),
            Date.now().toString(),
            'EX',
            SESSION_CLOSE_TIMEOUT + 60
        )
        Logger.info(`[BrowserSessionService] Browser ${browserId.slice(0, 8)}... marked disconnected`)
    }

    /**
     * Cancel disconnect timer (browser reconnected within 5 min).
     */
    static async cancelBrowserDisconnect(browserId: string): Promise<void> {
        await redis.del(DISCONNECT_KEY(browserId))
    }

    /**
     * Get the chatSessionId associated with a browserId (Redis lookup).
     */
    static async getSessionIdByBrowser(browserId: string): Promise<string | null> {
        return redis.get(BROWSER_SESSION(browserId))
    }

    /**
     * Link or refresh a browser → session mapping in Redis.
     */
    static async linkBrowserToSession(browserId: string, chatSessionId: string): Promise<void> {
        await redis.set(BROWSER_SESSION(browserId), chatSessionId, 'EX', SESSION_TTL)
    }
}
