import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession, ChatSessionStatus } from '@/dtos/ChatbotDTO'
import {
  SESSION_KEY,
  MESSAGES_KEY,
  ACTIVE_SESSIONS,
  USER_SESSIONS,
  BROWSER_SESSION,
  SESSION_TTL_SECONDS,
} from './constants'
import { generateSessionId } from './utils'
import ChatSessionDBService from './ChatSessionDBService'

export default class ChatSessionService {

    static async createSession(
        userId: string,
        userEmail?: string,
        browserId?: string
    ): Promise<StoredChatSession> {
        const chatSessionId = generateSessionId()
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
        pipeline.set(SESSION_KEY(chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL_SECONDS)
        pipeline.zadd(ACTIVE_SESSIONS, Date.now(), chatSessionId)
        pipeline.sadd(USER_SESSIONS(userId), chatSessionId)
        pipeline.expire(USER_SESSIONS(userId), SESSION_TTL_SECONDS)
        if (browserId) {
            pipeline.set(BROWSER_SESSION(browserId), chatSessionId, 'EX', SESSION_TTL_SECONDS)
        }
        await pipeline.exec()

        Logger.info(
            `[ChatSessionService] Session ${chatSessionId} created for user ${userId}${
                browserId ? ` (browser: ${browserId.slice(0, 8)}...)` : ''
            }`
        )

        ChatSessionDBService.upsertSession(session).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertSession (create) failed: ${e}`)
        )

        return session
    }

    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        const raw = await redis.get(SESSION_KEY(chatSessionId))
        if (raw) return JSON.parse(raw) as StoredChatSession

        const dbSession = await ChatSessionDBService.getSession(chatSessionId)
        if (dbSession) {
            await redis
                .set(SESSION_KEY(chatSessionId), JSON.stringify(dbSession), 'EX', SESSION_TTL_SECONDS)
                .catch(() => {})
        }
        return dbSession
    }

    static async updateSession(session: StoredChatSession): Promise<void> {
        session.updatedAt = new Date().toISOString()
        await redis.set(SESSION_KEY(session.chatSessionId), JSON.stringify(session), 'EX', SESSION_TTL_SECONDS)

        ChatSessionDBService.upsertSession(session).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertSession (update) failed: ${e}`)
        )
    }

    static async addMessage(chatSessionId: string, msg: StoredChatMessage): Promise<void> {
        await redis.rpush(MESSAGES_KEY(chatSessionId), JSON.stringify(msg))
        await redis.expire(MESSAGES_KEY(chatSessionId), SESSION_TTL_SECONDS)

        ChatSessionDBService.upsertMessage(chatSessionId, msg).catch((e) =>
            Logger.warn(`[ChatSessionService] DB upsertMessage failed: ${e}`)
        )
    }

    static async getMessages(chatSessionId: string): Promise<StoredChatMessage[]> {
        const raw = await redis.lrange(MESSAGES_KEY(chatSessionId), 0, -1)
        if (raw.length > 0) return raw.map((r) => JSON.parse(r) as StoredChatMessage)

        return ChatSessionDBService.getMessages(chatSessionId)
    }

    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
        search?: string
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        return ChatSessionDBService.listSessions(options)
    }

    static async getUserSessions(userId: string): Promise<StoredChatSession[]> {
        const ids = await redis.smembers(USER_SESSIONS(userId))
        const redisSessions: StoredChatSession[] = []
        for (const id of ids) {
            const s = await ChatSessionService.getSession(id)
            if (s) redisSessions.push(s)
        }

        const { sessions: dbSessions } = await ChatSessionDBService.listSessions()
        const dbFiltered = dbSessions.filter((s) => s.userId === userId)

        const merged = new Map<string, StoredChatSession>()
        for (const s of dbFiltered)       merged.set(s.chatSessionId, s)
        for (const s of redisSessions)    merged.set(s.chatSessionId, s)

        return Array.from(merged.values()).sort(
            (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
    }
}
