import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession } from '@/dtos/ChatbotDTO'
import ChatSessionService from './ChatSessionService'
import {
  BROWSER_SESSION,
  DISCONNECT_KEY,
  SESSION_TTL_SECONDS,
  SESSION_CLOSE_TIMEOUT_SECONDS,
} from './constants'

export default class BrowserSessionService {
    static async restoreSession(
        userId: string,
        browserId: string,
        isGuest: boolean = false,
    ): Promise<{ session: StoredChatSession; messages: StoredChatMessage[] } | null> {
        const chatSessionId = await redis.get(BROWSER_SESSION(browserId))
        if (!chatSessionId) return null

        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) {
            await redis.del(BROWSER_SESSION(browserId))
            return null
        }

        // For guests, verify by browserId; for logged-in users, verify by userId
        if (isGuest) {
            if (session.browserId !== browserId) {
                await redis.del(BROWSER_SESSION(browserId))
                return null
            }
        } else if (session.userId !== userId) {
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
            if (elapsed > SESSION_CLOSE_TIMEOUT_SECONDS * 1000) {
                session.status = 'CLOSED'
                await ChatSessionService.updateSession(session)
                await redis.del(BROWSER_SESSION(browserId))
                await redis.del(DISCONNECT_KEY(browserId))
                Logger.info(
                    `[BrowserSessionService] Session ${chatSessionId} auto-closed (browser offline > 5 min)`
                )
                return null
            }
            await redis.del(DISCONNECT_KEY(browserId))
        }

        const messages = await ChatSessionService.getMessages(chatSessionId)
        return { session, messages }
    }

    static async markBrowserDisconnected(browserId: string): Promise<void> {
        await redis.set(
            DISCONNECT_KEY(browserId),
            Date.now().toString(),
            'EX',
            SESSION_CLOSE_TIMEOUT_SECONDS + 60
        )
        Logger.info(`[BrowserSessionService] Browser ${browserId.slice(0, 8)}... marked disconnected`)
    }

    static async cancelBrowserDisconnect(browserId: string): Promise<void> {
        await redis.del(DISCONNECT_KEY(browserId))
    }

    static async getSessionIdByBrowser(browserId: string): Promise<string | null> {
        return redis.get(BROWSER_SESSION(browserId))
    }

    static async linkBrowserToSession(browserId: string, chatSessionId: string): Promise<void> {
        await redis.set(BROWSER_SESSION(browserId), chatSessionId, 'EX', SESSION_TTL_SECONDS)
    }
}
