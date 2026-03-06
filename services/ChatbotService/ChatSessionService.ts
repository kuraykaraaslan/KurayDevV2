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
import ChatSessionDBService from './ChatSessionDBService'

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

        // Persist to DB asynchronously (fire-and-forget — Redis is the hot path)
        ChatSessionDBService.upsertSession(session).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertSession (create) failed: ${e}`)
        )

        return session
    }

    /**
     * Get a session by ID.
     * Checks Redis first; falls back to PostgreSQL when the key has expired,
     * then re-hydrates the Redis cache from the DB row.
     */
    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        const raw = await redis.get(SESSION_KEY(chatSessionId))
        if (raw) return JSON.parse(raw) as StoredChatSession

        // Redis cache-miss — try the persistent DB
        const dbSession = await ChatSessionDBService.getSession(chatSessionId)
        if (dbSession) {
            // Re-hydrate the cache so subsequent reads are fast
            await redis
                .set(SESSION_KEY(chatSessionId), JSON.stringify(dbSession), 'EX', SESSION_TTL)
                .catch(() => { /* non-critical */ })
        }
        return dbSession
    }

    /**
     * Update session metadata in Redis and PostgreSQL.
     */
    static async updateSession(session: StoredChatSession): Promise<void> {
        session.updatedAt = new Date().toISOString()
        await redis.set(SESSION_KEY(session.chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL)

        // Persist to DB asynchronously
        ChatSessionDBService.upsertSession(session).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertSession (update) failed: ${e}`)
        )
    }

    /**
     * Add a message to a session's message list (Redis + PostgreSQL).
     */
    static async addMessage(chatSessionId: string, msg: StoredChatMessage): Promise<void> {
        await redis.rpush(MESSAGES_KEY(chatSessionId), JSON.stringify(msg))
        await redis.expire(MESSAGES_KEY(chatSessionId), SESSION_TTL)

        // Persist to DB asynchronously
        ChatSessionDBService.upsertMessage(chatSessionId, msg).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertMessage failed: ${e}`)
        )
    }

    /**
     * Get all messages for a session.
     * Reads from Redis; falls back to PostgreSQL when the list has expired.
     */
    static async getMessages(chatSessionId: string): Promise<StoredChatMessage[]> {
        const raw = await redis.lrange(MESSAGES_KEY(chatSessionId), 0, -1)
        if (raw.length > 0) return raw.map((r) => JSON.parse(r) as StoredChatMessage)

        // Redis cache-miss — load from DB
        return ChatSessionDBService.getMessages(chatSessionId)
    }

    /**
     * List all chat sessions (admin panel).
     * Reads from PostgreSQL — the authoritative source that includes expired Redis sessions.
     */
    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
        search?: string
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        return ChatSessionDBService.listSessions(options)
    }

    /**
     * Get sessions for a specific user.
     * Reads live sessions from Redis, then merges in any additional sessions
     * from PostgreSQL that may have expired from the cache.
     */
    static async getUserSessions(userId: string): Promise<StoredChatSession[]> {
        // Load whatever is cached in Redis first
        const ids = await redis.smembers(USER_SESSIONS(userId))
        const redisSessions: StoredChatSession[] = []
        for (const id of ids) {
            const s = await ChatSessionService.getSession(id) // already has DB fallback
            if (s) redisSessions.push(s)
        }

        // Also fetch from DB to catch sessions that fell out of Redis entirely
        const { sessions: dbSessions } = await ChatSessionDBService.listSessions({
            // filter by userId by delegating to the generic DB query
        })
        const dbFiltered = dbSessions.filter((s) => s.userId === userId)

        // Merge: DB is authoritative; Redis sessions may be more up-to-date for live sessions
        const merged = new Map<string, StoredChatSession>()
        for (const s of dbFiltered)       merged.set(s.chatSessionId, s)
        for (const s of redisSessions)    merged.set(s.chatSessionId, s) // Redis wins for active

        return Array.from(merged.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }
}
