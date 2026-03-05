import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession, ChatSessionStatus } from '@/dtos/ChatbotDTO'
import {
    SESSION_KEY,
    MESSAGES_KEY,
    ACTIVE_SESSIONS,
    USER_SESSIONS,
    BROWSER_SESSION,
    SESSION_TTL,
} from './constants'

export default class ChatSessionService {
    // ─────────────────────────── Session CRUD ─────────────────────────

    /**
     * Create a new chat session in Redis.
     */
    static async createSession(
        userId: string,
        userEmail?: string,
        browserId?: string
    ): Promise<StoredChatSession> {
        const chatSessionId = `cs_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`
        const now = new Date().toISOString()

        const session: StoredChatSession = {
            chatSessionId,
            userId,
            userEmail,
            browserId,
            status: 'ACTIVE',
            createdAt: now,
            updatedAt: now,
        }

        const pipeline = redis.pipeline()
        pipeline.set(SESSION_KEY(chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL)
        pipeline.zadd(ACTIVE_SESSIONS, Date.now(), chatSessionId)
        pipeline.sadd(USER_SESSIONS(userId), chatSessionId)
        pipeline.expire(USER_SESSIONS(userId), SESSION_TTL)
        if (browserId) {
            pipeline.set(BROWSER_SESSION(browserId), chatSessionId, 'EX', SESSION_TTL)
        }
        await pipeline.exec()

        Logger.info(
            `[ChatSessionService] Session ${chatSessionId} created for user ${userId}${
                browserId ? ` (browser: ${browserId.slice(0, 8)}...)` : ''
            }`
        )
        return session
    }

    /**
     * Get a session by ID.
     */
    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        const raw = await redis.get(SESSION_KEY(chatSessionId))
        if (!raw) return undefined
        return JSON.parse(raw) as StoredChatSession
    }

    /**
     * Update session metadata in Redis.
     */
    static async updateSession(session: StoredChatSession): Promise<void> {
        session.updatedAt = new Date().toISOString()
        await redis.set(SESSION_KEY(session.chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL)
    }

    /**
     * Add a message to a session's message list.
     */
    static async addMessage(chatSessionId: string, msg: StoredChatMessage): Promise<void> {
        await redis.rpush(MESSAGES_KEY(chatSessionId), JSON.stringify(msg))
        await redis.expire(MESSAGES_KEY(chatSessionId), SESSION_TTL)
    }

    /**
     * Get all messages for a session.
     */
    static async getMessages(chatSessionId: string): Promise<StoredChatMessage[]> {
        const raw = await redis.lrange(MESSAGES_KEY(chatSessionId), 0, -1)
        return raw.map((r) => JSON.parse(r) as StoredChatMessage)
    }

    /**
     * List all chat sessions (admin panel). Sorted by most recent activity.
     */
    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        const page = options?.page ?? 0
        const pageSize = options?.pageSize ?? 20

        const allIds = await redis.zrevrange(ACTIVE_SESSIONS, 0, -1)

        const sessions: StoredChatSession[] = []
        for (const id of allIds) {
            const s = await ChatSessionService.getSession(id)
            if (!s) {
                await redis.zrem(ACTIVE_SESSIONS, id)
                continue
            }
            if (options?.status && s.status !== options.status) continue
            sessions.push(s)
        }

        const total = sessions.length
        const paginated = sessions.slice(page * pageSize, (page + 1) * pageSize)

        return { sessions: paginated, total }
    }

    /**
     * Get sessions for a specific user.
     */
    static async getUserSessions(userId: string): Promise<StoredChatSession[]> {
        const ids = await redis.smembers(USER_SESSIONS(userId))
        const sessions: StoredChatSession[] = []
        for (const id of ids) {
            const s = await ChatSessionService.getSession(id)
            if (s) sessions.push(s)
        }
        return sessions.sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }
}
