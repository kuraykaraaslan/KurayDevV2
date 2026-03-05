import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import ChatbotMessages from '@/messages/ChatbotMessages'
import wsManager from '@/libs/websocket/WSManager'
import { StoredChatMessage, StoredChatSession } from '@/dtos/ChatbotDTO'
import ChatSessionService from './ChatSessionService'
import { ACTIVE_SESSIONS, MESSAGES_KEY } from './constants'

export default class ChatbotAdminService {
    /**
     * Admin takes over a session — AI stops responding, admin writes manually.
     */
    static async takeoverSession(chatSessionId: string, adminUserId: string): Promise<void> {
        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

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

        Logger.info(`[ChatbotAdminService] Session ${chatSessionId} taken over by admin ${adminUserId}`)
    }

    /**
     * Admin releases a session back to AI.
     */
    static async releaseSession(chatSessionId: string): Promise<void> {
        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        session.status = 'ACTIVE'
        session.takenOverBy = undefined
        await ChatSessionService.updateSession(session)

        wsManager.publish('chatbot', chatSessionId, {
            ns: 'chatbot',
            type: 'session_update',
            chatSessionId,
            status: 'ACTIVE',
        })

        Logger.info(`[ChatbotAdminService] Session ${chatSessionId} released back to AI`)
    }

    /**
     * Admin closes a session.
     */
    static async closeSession(chatSessionId: string): Promise<void> {
        const session = await ChatSessionService.getSession(chatSessionId)
        if (!session) throw new Error(ChatbotMessages.SESSION_NOT_FOUND)

        session.status = 'CLOSED'
        await ChatSessionService.updateSession(session)

        wsManager.publish('chatbot', chatSessionId, {
            ns: 'chatbot',
            type: 'session_update',
            chatSessionId,
            status: 'CLOSED',
        })

        Logger.info(`[ChatbotAdminService] Session ${chatSessionId} closed`)
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
            id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
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
        const allIds = await redis.zrevrange(ACTIVE_SESSIONS, 0, -1)

        let activeSessions = 0
        let closedSessions = 0
        let takenOverSessions = 0
        let totalMessages = 0
        const userSet = new Set<string>()
        const allSessions: StoredChatSession[] = []

        for (const id of allIds) {
            const s = await ChatSessionService.getSession(id)
            if (!s) {
                await redis.zrem(ACTIVE_SESSIONS, id)
                continue
            }
            allSessions.push(s)
            userSet.add(s.userId)

            if (s.status === 'ACTIVE') activeSessions++
            else if (s.status === 'CLOSED') closedSessions++
            else if (s.status === 'TAKEN_OVER') takenOverSessions++

            const msgCount = await redis.llen(MESSAGES_KEY(id))
            totalMessages += msgCount
        }

        const totalSessions = allSessions.length
        const avgMessagesPerSession =
            totalSessions > 0
                ? Math.round((totalMessages / totalSessions) * 10) / 10
                : 0

        const recentSessions = allSessions
            .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
            .slice(0, 5)

        return {
            totalSessions,
            activeSessions,
            closedSessions,
            takenOverSessions,
            totalMessages,
            avgMessagesPerSession,
            uniqueUsers: userSet.size,
            recentSessions,
        }
    }
}
