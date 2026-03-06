import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession, ChatSessionStatus } from '@/dtos/ChatbotDTO'
import type { ChatSessionStatus as PrismaStatus } from '@/generated/prisma'

// ── Type helpers ─────────────────────────────────────────────────────────

/**
 * Convert a DTO `StoredChatSession` (string dates, string status) into
 * Prisma-compatible input for upsert operations.
 */
function sessionToDB(s: StoredChatSession) {
    return {
        chatSessionId: s.chatSessionId,
        userId:        s.userId,
        userEmail:     s.userEmail,
        browserId:     s.browserId,
        status:        s.status as PrismaStatus,
        title:         s.title,
        takenOverBy:   s.takenOverBy,
        summary:       s.summary,
        updatedAt:     new Date(s.updatedAt),
        createdAt:     new Date(s.createdAt),
    }
}

/** Convert a Prisma ChatSession row back to the shared DTO shape. */
function sessionFromDB(row: {
    chatSessionId: string
    userId:        string
    userEmail:     string | null
    browserId:     string | null
    status:        PrismaStatus
    title:         string | null
    takenOverBy:   string | null
    summary:       string | null
    createdAt:     Date
    updatedAt:     Date
}): StoredChatSession {
    return {
        chatSessionId: row.chatSessionId,
        userId:        row.userId,
        userEmail:     row.userEmail    ?? undefined,
        browserId:     row.browserId    ?? undefined,
        status:        row.status       as ChatSessionStatus,
        title:         row.title        ?? undefined,
        takenOverBy:   row.takenOverBy  ?? undefined,
        summary:       row.summary      ?? undefined,
        createdAt:     row.createdAt.toISOString(),
        updatedAt:     row.updatedAt.toISOString(),
    }
}

/** Convert a Prisma ChatMessage row to the shared DTO shape. */
function messageFromDB(row: {
    id:           string
    chatSessionId: string
    role:         string
    content:      string
    sources:      unknown
    adminUserId:  string | null
    createdAt:    Date
}): StoredChatMessage {
    return {
        id:          row.id,
        role:        row.role as StoredChatMessage['role'],
        content:     row.content,
        sources:     Array.isArray(row.sources) ? (row.sources as StoredChatMessage['sources']) : undefined,
        adminUserId: row.adminUserId ?? undefined,
        createdAt:   row.createdAt.toISOString(),
    }
}

// ── Service ───────────────────────────────────────────────────────────────

export default class ChatSessionDBService {
    // ─────────────────────────── Session ──────────────────────────────

    /**
     * Create or update a ChatSession in PostgreSQL.
     * Called on every write in ChatSessionService (dual-write pattern).
     */
    static async upsertSession(session: StoredChatSession): Promise<void> {
        try {
            const data = sessionToDB(session)
            await prisma.chatSession.upsert({
                where:  { chatSessionId: data.chatSessionId },
                create: data,
                update: {
                    status:      data.status,
                    title:       data.title,
                    takenOverBy: data.takenOverBy,
                    summary:     data.summary,
                    updatedAt:   data.updatedAt,
                },
            })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] upsertSession failed: ${err}`)
        }
    }

    /**
     * Retrieve a session from PostgreSQL by ID.
     * Used as Redis-miss fallback.
     */
    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        try {
            const row = await prisma.chatSession.findUnique({
                where: { chatSessionId },
            })
            if (!row) return undefined
            return sessionFromDB(row)
        } catch (err) {
            Logger.error(`[ChatSessionDBService] getSession failed: ${err}`)
            return undefined
        }
    }

    // ─────────────────────────── Messages ─────────────────────────────

    /**
     * Persist a single message to PostgreSQL.
     * Uses upsert to be safe against duplicate message IDs.
     */
    static async upsertMessage(chatSessionId: string, msg: StoredChatMessage): Promise<void> {
        try {
            await prisma.chatMessage.upsert({
                where:  { id: msg.id },
                create: {
                    id:           msg.id,
                    chatSessionId,
                    role:         msg.role,
                    content:      msg.content,
                    sources:      (msg.sources ?? null) as object | null,
                    adminUserId:  msg.adminUserId,
                    createdAt:    new Date(msg.createdAt),
                },
                update: {}, // message content is immutable — never overwrite
            })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] upsertMessage failed: ${err}`)
        }
    }

    /**
     * Get all messages for a session from PostgreSQL, ordered chronologically.
     * Used as Redis-miss fallback and for admin export.
     */
    static async getMessages(chatSessionId: string): Promise<StoredChatMessage[]> {
        try {
            const rows = await prisma.chatMessage.findMany({
                where:   { chatSessionId },
                orderBy: { createdAt: 'asc' },
                select: {
                    id:           true,
                    chatSessionId: true,
                    role:         true,
                    content:      true,
                    sources:      true,
                    adminUserId:  true,
                    createdAt:    true,
                },
            })
            return rows.map(messageFromDB)
        } catch (err) {
            Logger.error(`[ChatSessionDBService] getMessages failed: ${err}`)
            return []
        }
    }

    // ─────────────────────────── Admin queries ─────────────────────────

    /**
     * List chat sessions from PostgreSQL with pagination and optional status filter.
     * Authoritative source for the admin panel (handles expired Redis sessions).
     */
    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
        search?: string
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        const page     = options?.page     ?? 0
        const pageSize = options?.pageSize ?? 20

        try {
            const where = {
                ...(options?.status ? { status: options.status as PrismaStatus } : {}),
                ...(options?.search
                    ? {
                          OR: [
                              { title:     { contains: options.search, mode: 'insensitive' as const } },
                              { userEmail: { contains: options.search, mode: 'insensitive' as const } },
                              { userId:    { contains: options.search, mode: 'insensitive' as const } },
                          ],
                      }
                    : {}),
            }

            const [rows, total] = await Promise.all([
                prisma.chatSession.findMany({
                    where,
                    orderBy: { updatedAt: 'desc' },
                    skip:    page * pageSize,
                    take:    pageSize,
                    select: {
                        chatSessionId: true,
                        userId:        true,
                        userEmail:     true,
                        browserId:     true,
                        status:        true,
                        title:         true,
                        takenOverBy:   true,
                        summary:       true,
                        createdAt:     true,
                        updatedAt:     true,
                    },
                }),
                prisma.chatSession.count({ where }),
            ])

            return { sessions: rows.map(sessionFromDB), total }
        } catch (err) {
            Logger.error(`[ChatSessionDBService] listSessions failed: ${err}`)
            return { sessions: [], total: 0 }
        }
    }

    /**
     * Aggregate stats from PostgreSQL for the admin dashboard.
     */
    static async getStats(): Promise<{
        totalSessions:        number
        activeSessions:       number
        closedSessions:       number
        takenOverSessions:    number
        totalMessages:        number
        avgMessagesPerSession: number
        uniqueUsers:          number
        recentSessions:       StoredChatSession[]
    }> {
        try {
            const [statusCounts, totalMessages, uniqueUsersResult, recentRows] = await Promise.all([
                prisma.chatSession.groupBy({
                    by:     ['status'],
                    _count: { _all: true },
                }),
                prisma.chatMessage.count(),
                prisma.chatSession.groupBy({
                    by:      ['userId'],
                    _count:  { _all: true },
                }) ,
                prisma.chatSession.findMany({
                    orderBy: { updatedAt: 'desc' },
                    take: 5,
                    select: {
                        chatSessionId: true,
                        userId:        true,
                        userEmail:     true,
                        browserId:     true,
                        status:        true,
                        title:         true,
                        takenOverBy:   true,
                        summary:       true,
                        createdAt:     true,
                        updatedAt:     true,
                    },
                }),
            ])

            const totalSessions     = statusCounts.reduce((s, g) => s + g._count._all, 0)
            const activeSessions    = statusCounts.find((g) => g.status === 'ACTIVE')     ?._count._all ?? 0
            const closedSessions    = statusCounts.find((g) => g.status === 'CLOSED')     ?._count._all ?? 0
            const takenOverSessions = statusCounts.find((g) => g.status === 'TAKEN_OVER') ?._count._all ?? 0
            const avgMessagesPerSession =
                totalSessions > 0
                    ? Math.round((totalMessages / totalSessions) * 10) / 10
                    : 0

            return {
                totalSessions,
                activeSessions,
                closedSessions,
                takenOverSessions,
                totalMessages,
                avgMessagesPerSession,
                uniqueUsers:    uniqueUsersResult.length,
                recentSessions: recentRows.map(sessionFromDB),
            }
        } catch (err) {
            Logger.error(`[ChatSessionDBService] getStats failed: ${err}`)
            return {
                totalSessions:        0,
                activeSessions:       0,
                closedSessions:       0,
                takenOverSessions:    0,
                totalMessages:        0,
                avgMessagesPerSession: 0,
                uniqueUsers:          0,
                recentSessions:       [],
            }
        }
    }

    /**
     * Delete all DB data for a session (messages cascade via FK).
     */
    static async deleteSession(chatSessionId: string): Promise<void> {
        try {
            await prisma.chatSession.delete({ where: { chatSessionId } })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] deleteSession failed: ${err}`)
        }
    }
}
