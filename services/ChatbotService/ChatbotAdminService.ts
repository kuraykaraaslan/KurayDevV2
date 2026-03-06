import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import ChatbotMessages from '@/messages/ChatbotMessages'
import wsManager from '@/libs/websocket/WSManager'
import { StoredChatMessage, StoredChatSession } from '@/dtos/ChatbotDTO'
import ChatSessionService from './ChatSessionService'
import ChatSessionDBService from './ChatSessionDBService'
import { ACTIVE_SESSIONS, makeMessageId } from './constants'

export default class ChatbotAdminService {
    // ── Private helpers ───────────────────────────────────────────────

    /**
     * Fetch session (throwing if missing), apply status mutation, persist, and broadcast.
     */
    private static async _setSessionStatus(
        chatSessionId: string,
        mutate: (session: StoredChatSession) => void,
        logMessage: string,
    ): Promise<void> {
        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        mutate(session)
        await ChatSessionService.updateSession(session)

        wsManager.publish('chatbot', chatSessionId, {
            ns: 'chatbot',
            type: 'session_update',
            chatSessionId,
            status: session.status,
            ...(session.takenOverBy ? { takenOverBy: session.takenOverBy } : {}),
        })

        Logger.info(`[ChatbotAdminService] ${logMessage}`)
    }

    /**
     * Admin takes over a session — AI stops responding, admin writes manually.
     */
    static async takeoverSession(chatSessionId: string, adminUserId: string): Promise<void> {
        await ChatbotAdminService._setSessionStatus(
            chatSessionId,
            (s) => { s.status = 'TAKEN_OVER'; s.takenOverBy = adminUserId },
            `Session ${chatSessionId} taken over by admin ${adminUserId}`,
        )
    }

    /**
     * Admin releases a session back to AI.
     */
    static async releaseSession(chatSessionId: string): Promise<void> {
        await ChatbotAdminService._setSessionStatus(
            chatSessionId,
            (s) => { s.status = 'ACTIVE'; s.takenOverBy = undefined },
            `Session ${chatSessionId} released back to AI`,
        )
    }

    /**
     * Admin closes a session.
     */
    static async closeSession(chatSessionId: string): Promise<void> {
        await ChatbotAdminService._setSessionStatus(
            chatSessionId,
            (s) => { s.status = 'CLOSED' },
            `Session ${chatSessionId} closed`,
        )
    }

    /**
     * Admin sends a message in a session (appears as "admin" role in the chat).
     */
    static async adminReply({
        chatSessionId,
        message,
        adminUserId,
    }: {
        chatSessionId: string
        message: string
        adminUserId: string
    }): Promise<StoredChatMessage> {
        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        const msg: StoredChatMessage = {
            id: makeMessageId(),
            role: 'admin',
            content: message,
            adminUserId,
            createdAt: new Date().toISOString(),
        }

        await ChatSessionService.addMessage(chatSessionId, msg)
        await redis.zadd(ACTIVE_SESSIONS, Date.now(), chatSessionId)

        // Auto-takeover if not already
        if (session.status === 'ACTIVE') {
            session.status = 'TAKEN_OVER'
            session.takenOverBy = adminUserId
            await ChatSessionService.updateSession(session)

            wsManager.publish('chatbot', chatSessionId, {
                ns: 'chatbot',
                type: 'session_update',
                chatSessionId,
                status: 'TAKEN_OVER',
                takenOverBy: adminUserId,
            })
        }

        wsManager.publish('chatbot', chatSessionId, {
            ns: 'chatbot',
            type: 'new_message',
            chatSessionId,
            message: {
                id: msg.id,
                role: 'admin',
                content: msg.content,
                adminUserId: msg.adminUserId,
                createdAt: msg.createdAt,
            },
        })

        Logger.info(`[ChatbotAdminService] Admin ${adminUserId} replied in session ${chatSessionId}`)
        return msg
    }

    /**
     * Get chatbot analytics stats (admin dashboard).
     * Reads from PostgreSQL — captures all sessions including those expired from Redis.
     */
    static async getStats(): Promise<{
        totalSessions: number
        activeSessions: number
        closedSessions: number
        takenOverSessions: number
        totalMessages: number
        avgMessagesPerSession: number
        uniqueUsers: number
        recentSessions: StoredChatSession[]
    }> {
        return ChatSessionDBService.getStats()
    }
}
