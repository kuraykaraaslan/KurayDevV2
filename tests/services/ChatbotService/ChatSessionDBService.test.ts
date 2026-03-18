jest.mock('@/libs/prisma', () => ({
  prisma: {
    chatSession: {
      upsert:   jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count:    jest.fn(),
      groupBy:  jest.fn(),
      delete:   jest.fn(),
    },
    chatMessage: {
      upsert:   jest.fn(),
      findMany: jest.fn(),
      count:    jest.fn(),
    },
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

import { prisma } from '@/libs/prisma'
import ChatSessionDBService from '@/services/ChatbotService/ChatSessionDBService'

const prismaMock = prisma as jest.Mocked<typeof prisma>

const DB_SESSION = {
  chatSessionId: 'sess-1',
  userId: 'user-1',
  userEmail: 'u@example.com',
  browserId: null,
  status: 'ACTIVE' as any,
  title: 'Test session',
  takenOverBy: null,
  summary: null,
  createdAt: new Date('2026-01-01'),
  updatedAt: new Date('2026-01-02'),
}

const STORED_SESSION = {
  chatSessionId: 'sess-1',
  userId: 'user-1',
  userEmail: 'u@example.com',
  browserId: undefined,
  status: 'ACTIVE' as const,
  title: 'Test session',
  takenOverBy: undefined,
  summary: undefined,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
}

const DB_MESSAGE = {
  id: 'msg-1',
  chatSessionId: 'sess-1',
  role: 'USER' as any,
  content: 'Hello',
  sources: null,
  adminUserId: null,
  createdAt: new Date('2026-01-01'),
}

describe('ChatSessionDBService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── upsertSession ─────────────────────────────────────────────────────────
  describe('upsertSession', () => {
    it('calls prisma.chatSession.upsert with correct data', async () => {
      ;(prismaMock.chatSession.upsert as jest.Mock).mockResolvedValueOnce(DB_SESSION)
      await ChatSessionDBService.upsertSession(STORED_SESSION)
      expect(prismaMock.chatSession.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { chatSessionId: 'sess-1' } })
      )
    })

    it('logs error and does not throw when upsert fails', async () => {
      ;(prismaMock.chatSession.upsert as jest.Mock).mockRejectedValueOnce(new Error('DB error'))
      await expect(ChatSessionDBService.upsertSession(STORED_SESSION)).resolves.not.toThrow()
    })
  })

  // ── getSession ────────────────────────────────────────────────────────────
  describe('getSession', () => {
    it('returns mapped StoredChatSession for existing record', async () => {
      ;(prismaMock.chatSession.findUnique as jest.Mock).mockResolvedValueOnce(DB_SESSION)
      const result = await ChatSessionDBService.getSession('sess-1')
      expect(result?.chatSessionId).toBe('sess-1')
      expect(result?.userId).toBe('user-1')
      expect(result?.status).toBe('ACTIVE')
    })

    it('returns undefined when session not found', async () => {
      ;(prismaMock.chatSession.findUnique as jest.Mock).mockResolvedValueOnce(null)
      const result = await ChatSessionDBService.getSession('unknown')
      expect(result).toBeUndefined()
    })

    it('returns undefined and logs error on DB failure', async () => {
      ;(prismaMock.chatSession.findUnique as jest.Mock).mockRejectedValueOnce(new Error('DB failure'))
      const result = await ChatSessionDBService.getSession('sess-1')
      expect(result).toBeUndefined()
    })
  })

  // ── upsertMessage ─────────────────────────────────────────────────────────
  describe('upsertMessage', () => {
    it('calls prisma.chatMessage.upsert with correct id', async () => {
      ;(prismaMock.chatMessage.upsert as jest.Mock).mockResolvedValueOnce(DB_MESSAGE)
      const msg = {
        id: 'msg-1',
        role: 'USER' as const,
        content: 'Hello',
        createdAt: new Date().toISOString(),
      }
      await ChatSessionDBService.upsertMessage('sess-1', msg)
      expect(prismaMock.chatMessage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'msg-1' } })
      )
    })

    it('logs error without throwing on upsert failure', async () => {
      ;(prismaMock.chatMessage.upsert as jest.Mock).mockRejectedValueOnce(new Error('msg error'))
      const msg = { id: 'msg-2', role: 'USER' as const, content: 'hi', createdAt: new Date().toISOString() }
      await expect(ChatSessionDBService.upsertMessage('sess-1', msg)).resolves.not.toThrow()
    })
  })

  // ── getMessages ───────────────────────────────────────────────────────────
  describe('getMessages', () => {
    it('returns mapped messages ordered by createdAt', async () => {
      ;(prismaMock.chatMessage.findMany as jest.Mock).mockResolvedValueOnce([DB_MESSAGE])
      const msgs = await ChatSessionDBService.getMessages('sess-1')
      expect(msgs).toHaveLength(1)
      expect(msgs[0].id).toBe('msg-1')
      expect(msgs[0].role).toBe('USER')
    })

    it('returns empty array on DB failure', async () => {
      ;(prismaMock.chatMessage.findMany as jest.Mock).mockRejectedValueOnce(new Error('fail'))
      const msgs = await ChatSessionDBService.getMessages('sess-1')
      expect(msgs).toEqual([])
    })
  })

  // ── listSessions ──────────────────────────────────────────────────────────
  describe('listSessions', () => {
    it('returns sessions and total', async () => {
      ;(prismaMock.chatSession.findMany as jest.Mock).mockResolvedValueOnce([DB_SESSION])
      ;(prismaMock.chatSession.count as jest.Mock).mockResolvedValueOnce(1)
      const result = await ChatSessionDBService.listSessions()
      expect(result.sessions).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it('filters by status when provided', async () => {
      ;(prismaMock.chatSession.findMany as jest.Mock).mockResolvedValueOnce([])
      ;(prismaMock.chatSession.count as jest.Mock).mockResolvedValueOnce(0)
      await ChatSessionDBService.listSessions({ status: 'CLOSED' })
      expect(prismaMock.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ status: 'CLOSED' }) })
      )
    })

    it('applies search query to OR filter when provided', async () => {
      ;(prismaMock.chatSession.findMany as jest.Mock).mockResolvedValueOnce([])
      ;(prismaMock.chatSession.count as jest.Mock).mockResolvedValueOnce(0)
      await ChatSessionDBService.listSessions({ search: 'test-search' })
      const call = (prismaMock.chatSession.findMany as jest.Mock).mock.calls[0][0]
      expect(call.where).toHaveProperty('OR')
    })

    it('returns empty result on DB failure', async () => {
      ;(prismaMock.chatSession.findMany as jest.Mock).mockRejectedValueOnce(new Error('fail'))
      ;(prismaMock.chatSession.count as jest.Mock).mockResolvedValueOnce(0)
      const result = await ChatSessionDBService.listSessions()
      expect(result.sessions).toEqual([])
      expect(result.total).toBe(0)
    })
  })

  // ── getStats ──────────────────────────────────────────────────────────────
  describe('getStats', () => {
    it('returns aggregated stats with correct calculations', async () => {
      ;(prismaMock.chatSession.groupBy as jest.Mock)
        .mockResolvedValueOnce([
          { status: 'ACTIVE', _count: { _all: 3 } },
          { status: 'CLOSED', _count: { _all: 2 } },
          { status: 'TAKEN_OVER', _count: { _all: 1 } },
        ])
        .mockResolvedValueOnce([{ userId: 'u1', _count: { _all: 3 } }]) // uniqueUsers
      ;(prismaMock.chatMessage.count as jest.Mock).mockResolvedValueOnce(30)
      ;(prismaMock.chatSession.findMany as jest.Mock).mockResolvedValueOnce([DB_SESSION])

      const stats = await ChatSessionDBService.getStats()
      expect(stats.totalSessions).toBe(6)
      expect(stats.activeSessions).toBe(3)
      expect(stats.closedSessions).toBe(2)
      expect(stats.takenOverSessions).toBe(1)
      expect(stats.totalMessages).toBe(30)
      expect(stats.uniqueUsers).toBe(1)
    })

    it('returns zero stats on DB failure', async () => {
      ;(prismaMock.chatSession.groupBy as jest.Mock).mockRejectedValueOnce(new Error('fail'))
      const stats = await ChatSessionDBService.getStats()
      expect(stats.totalSessions).toBe(0)
    })
  })

  // ── deleteSession ─────────────────────────────────────────────────────────
  describe('deleteSession', () => {
    it('calls prisma.chatSession.delete with chatSessionId', async () => {
      ;(prismaMock.chatSession.delete as jest.Mock).mockResolvedValueOnce(DB_SESSION)
      await ChatSessionDBService.deleteSession('sess-1')
      expect(prismaMock.chatSession.delete).toHaveBeenCalledWith({ where: { chatSessionId: 'sess-1' } })
    })

    it('logs error without throwing on delete failure', async () => {
      ;(prismaMock.chatSession.delete as jest.Mock).mockRejectedValueOnce(new Error('not found'))
      await expect(ChatSessionDBService.deleteSession('ghost')).resolves.not.toThrow()
    })
  })
})
