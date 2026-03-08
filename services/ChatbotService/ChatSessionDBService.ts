import { prisma } from '@/libs/prisma'
import { Prisma } from '@/generated/prisma'
import Logger from '@/libs/logger'
import { StoredChatMessage, StoredChatSession, ChatSessionStatus } from '@/dtos/ChatbotDTO'
import { ChatbotStats } from '@/types/features/ChatbotTypes'
import type { ChatSessionStatus as PrismaStatus } from '@/generated/prisma'


export default class ChatSessionDBService {

    static async upsertSession(session: StoredChatSession): Promise<void> {
        try {
            await prisma.chatSession.upsert({
                where: { chatSessionId: session.chatSessionId },
                create: {
                    chatSessionId: session.chatSessionId,
                    userId:        session.userId,
                    userEmail:     session.userEmail,
                    browserId:     session.browserId,
                    status:        session.status as PrismaStatus,
                    title:         session.title,
                    takenOverBy:   session.takenOverBy,
                    summary:       session.summary,
                    updatedAt:     new Date(session.updatedAt),
                    createdAt:     new Date(session.createdAt),
                },
                update: {
                    status:      session.status as PrismaStatus,
                    title:       session.title,
                    takenOverBy: session.takenOverBy,
                    summary:     session.summary,
                    updatedAt:   new Date(session.updatedAt),
                },
            })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] upsertSession failed: ${err}`)
        }
    }

    static async getSession(chatSessionId: string): Promise<StoredChatSession | undefined> {
        try {
            const row = await prisma.chatSession.findUnique({
                where: { chatSessionId },
            })
            if (!row) return undefined
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
        } catch (err) {
            Logger.error(`[ChatSessionDBService] getSession failed: ${err}`)
            return undefined
        }
    }


    static async upsertMessage(chatSessionId: string, msg: StoredChatMessage): Promise<void> {
        try {
            await prisma.chatMessage.upsert({
                where:  { id: msg.id },
                create: {
                    id:           msg.id,
                    chatSessionId,
                    role:         msg.role,
                    content:      msg.content,
                    sources:      (msg.sources ?? undefined) as Prisma.InputJsonValue,
                    adminUserId:  msg.adminUserId ?? undefined,
                    createdAt:    new Date(msg.createdAt),
                },
                update: {},
            })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] upsertMessage failed: ${err}`)
        }
    }

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
            return rows.map((row) => ({
                id:          row.id,
                role:        row.role as StoredChatMessage['role'],
                content:     row.content,
                sources:     Array.isArray(row.sources) ? (row.sources as StoredChatMessage['sources']) : undefined,
                adminUserId: row.adminUserId ?? undefined,
                createdAt:   row.createdAt.toISOString(),
            }))
        } catch (err) {
            Logger.error(`[ChatSessionDBService] getMessages failed: ${err}`)
            return []
        }
    }


    static async listSessions(options?: {
        status?: ChatSessionStatus
        page?: number
        pageSize?: number
        search?: string
        sortKey?: string
        sortDir?: 'asc' | 'desc'
    }): Promise<{ sessions: StoredChatSession[]; total: number }> {
        const page     = options?.page     ?? 0
        const pageSize = options?.pageSize ?? 20

        const ALLOWED_SORT_KEYS: Record<string, string> = { title: 'title', userEmail: 'userEmail', status: 'status', createdAt: 'createdAt', updatedAt: 'updatedAt' }
        const resolvedSortKey = (options?.sortKey && ALLOWED_SORT_KEYS[options.sortKey]) ?? 'updatedAt'
        const resolvedSortDir: 'asc' | 'desc' = options?.sortDir === 'asc' ? 'asc' : 'desc'

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
                    orderBy: { [resolvedSortKey]: resolvedSortDir },
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

            return {
                sessions: rows.map((row) => ({
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
                })),
                total,
            }
        } catch (err) {
            Logger.error(`[ChatSessionDBService] listSessions failed: ${err}`)
            return { sessions: [], total: 0 }
        }
    }

    static async getStats(): Promise<ChatbotStats> {
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
                recentSessions: recentRows.map((row) => ({
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
                })),
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

    static async deleteSession(chatSessionId: string): Promise<void> {
        try {
            await prisma.chatSession.delete({ where: { chatSessionId } })
        } catch (err) {
            Logger.error(`[ChatSessionDBService] deleteSession failed: ${err}`)
        }
    }
}
