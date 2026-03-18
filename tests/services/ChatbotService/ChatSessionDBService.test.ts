import Logger from '@/libs/logger'
import ChatSessionDBService from '@/services/ChatbotService/ChatSessionDBService'

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('@/libs/prisma', () => ({
  __esModule: true,
  prisma: {
    chatSession: {
      upsert:   jest.fn(),
      findUnique: jest.fn(),
      findMany:  jest.fn(),
      count:     jest.fn(),
      delete:    jest.fn(),
      groupBy:   jest.fn(),
    },
    chatMessage: {
      upsert:   jest.fn(),
      findMany:  jest.fn(),
      count:     jest.fn(),
    },
  },
}))

// ── Typed references ──────────────────────────────────────────────────────────

import { prisma } from '@/libs/prisma'
const prismaMock = prisma as jest.Mocked<typeof prisma>

// ── Helpers ───────────────────────────────────────────────────────────────────

const makeStoredSession = (overrides: Record<string, unknown> = {}) => ({
  chatSessionId: 'session-abc',
  userId: 'user-123',
  userEmail: 'user@example.com',
  browserId: 'browser-xyz',
  status: 'ACTIVE' as const,
  title: 'Test Session',
  takenOverBy: undefined,
  summary: undefined,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  ...overrides,
})

const makePrismaSessionRow = (overrides: Record<string, unknown> = {}) => ({
  chatSessionId: 'session-abc',
  userId: 'user-123',
  userEmail: 'user@example.com',
  browserId: 'browser-xyz',
  status: 'ACTIVE',
  title: 'Test Session',
  takenOverBy: null,
  summary: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-02T00:00:00.000Z'),
  ...overrides,
})

const makeStoredMessage = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg-001',
  role: 'USER' as const,
  content: 'Hello there',
  sources: undefined,
  adminUserId: undefined,
  createdAt: '2026-01-01T00:01:00.000Z',
  ...overrides,
})

const makePrismaMessageRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'msg-001',
  chatSessionId: 'session-abc',
  role: 'USER',
  content: 'Hello there',
  sources: null,
  adminUserId: null,
  createdAt: new Date('2026-01-01T00:01:00.000Z'),
  ...overrides,
})

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatSessionDBService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  // ── upsertSession ────────────────────────────────────────────────────────────

  describe('upsertSession', () => {
    it('calls prisma.chatSession.upsert with the correct create/update data', async () => {
      prismaMock.chatSession.upsert.mockResolvedValue(makePrismaSessionRow() as any)

      const session = makeStoredSession()
      await ChatSessionDBService.upsertSession(session)

      expect(prismaMock.chatSession.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { chatSessionId: 'session-abc' },
          create: expect.objectContaining({
            chatSessionId: 'session-abc',
            userId: 'user-123',
            status: 'ACTIVE',
          }),
          update: expect.objectContaining({
            status: 'ACTIVE',
          }),
        })
      )
    })

    it('logs error silently when prisma.chatSession.upsert throws', async () => {
      prismaMock.chatSession.upsert.mockRejectedValue(new Error('DB write error'))

      const session = makeStoredSession()
      await expect(ChatSessionDBService.upsertSession(session)).resolves.toBeUndefined()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] upsertSession failed')
      )
    })
  })

  // ── getSession ───────────────────────────────────────────────────────────────

  describe('getSession', () => {
    it('returns undefined when session is not found (findUnique returns null)', async () => {
      prismaMock.chatSession.findUnique.mockResolvedValue(null)

      const result = await ChatSessionDBService.getSession('session-abc')

      expect(result).toBeUndefined()
    })

    it('returns a mapped StoredChatSession when the row exists', async () => {
      prismaMock.chatSession.findUnique.mockResolvedValue(makePrismaSessionRow() as any)

      const result = await ChatSessionDBService.getSession('session-abc')

      expect(result).toEqual(
        expect.objectContaining({
          chatSessionId: 'session-abc',
          userId: 'user-123',
          userEmail: 'user@example.com',
          status: 'ACTIVE',
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-02T00:00:00.000Z',
        })
      )
    })

    it('maps null nullable fields to undefined', async () => {
      prismaMock.chatSession.findUnique.mockResolvedValue(
        makePrismaSessionRow({ userEmail: null, browserId: null, takenOverBy: null, summary: null }) as any
      )

      const result = await ChatSessionDBService.getSession('session-abc')

      expect(result?.userEmail).toBeUndefined()
      expect(result?.browserId).toBeUndefined()
      expect(result?.takenOverBy).toBeUndefined()
      expect(result?.summary).toBeUndefined()
    })

    it('returns undefined and logs error when prisma throws', async () => {
      prismaMock.chatSession.findUnique.mockRejectedValue(new Error('DB read error'))

      const result = await ChatSessionDBService.getSession('session-abc')

      expect(result).toBeUndefined()
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] getSession failed')
      )
    })
  })

  // ── upsertMessage ────────────────────────────────────────────────────────────

  describe('upsertMessage', () => {
    it('calls prisma.chatMessage.upsert with the correct data', async () => {
      prismaMock.chatMessage.upsert.mockResolvedValue(makePrismaMessageRow() as any)

      const msg = makeStoredMessage()
      await ChatSessionDBService.upsertMessage('session-abc', msg)

      expect(prismaMock.chatMessage.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'msg-001' },
          create: expect.objectContaining({
            id: 'msg-001',
            chatSessionId: 'session-abc',
            role: 'USER',
            content: 'Hello there',
          }),
          update: {},
        })
      )
    })

    it('logs error silently when prisma.chatMessage.upsert throws', async () => {
      prismaMock.chatMessage.upsert.mockRejectedValue(new Error('Message write error'))

      const msg = makeStoredMessage()
      await expect(ChatSessionDBService.upsertMessage('session-abc', msg)).resolves.toBeUndefined()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] upsertMessage failed')
      )
    })
  })

  // ── getMessages ──────────────────────────────────────────────────────────────

  describe('getMessages', () => {
    it('returns a mapped array of StoredChatMessage when rows exist', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([
        makePrismaMessageRow(),
        makePrismaMessageRow({ id: 'msg-002', role: 'ASSISTANT', content: 'Hi!' }),
      ] as any)

      const result = await ChatSessionDBService.getMessages('session-abc')

      expect(result).toHaveLength(2)
      expect(result[0]).toEqual(
        expect.objectContaining({
          id: 'msg-001',
          role: 'USER',
          content: 'Hello there',
          createdAt: '2026-01-01T00:01:00.000Z',
        })
      )
      expect(result[1].role).toBe('ASSISTANT')
    })

    it('maps null sources to undefined', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([
        makePrismaMessageRow({ sources: null }),
      ] as any)

      const result = await ChatSessionDBService.getMessages('session-abc')

      expect(result[0].sources).toBeUndefined()
    })

    it('maps null adminUserId to undefined', async () => {
      prismaMock.chatMessage.findMany.mockResolvedValue([
        makePrismaMessageRow({ adminUserId: null }),
      ] as any)

      const result = await ChatSessionDBService.getMessages('session-abc')

      expect(result[0].adminUserId).toBeUndefined()
    })

    it('returns an empty array and logs error when prisma throws', async () => {
      prismaMock.chatMessage.findMany.mockRejectedValue(new Error('Read error'))

      const result = await ChatSessionDBService.getMessages('session-abc')

      expect(result).toEqual([])
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] getMessages failed')
      )
    })
  })

  // ── deleteSession ────────────────────────────────────────────────────────────

  describe('deleteSession', () => {
    it('calls prisma.chatSession.delete with correct where clause', async () => {
      prismaMock.chatSession.delete.mockResolvedValue(makePrismaSessionRow() as any)

      await ChatSessionDBService.deleteSession('session-abc')

      expect(prismaMock.chatSession.delete).toHaveBeenCalledWith({
        where: { chatSessionId: 'session-abc' },
      })
    })

    it('logs error silently when prisma.chatSession.delete throws', async () => {
      prismaMock.chatSession.delete.mockRejectedValue(new Error('Delete error'))

      await expect(ChatSessionDBService.deleteSession('session-abc')).resolves.toBeUndefined()

      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] deleteSession failed')
      )
    })
  })

  // ── listSessions ─────────────────────────────────────────────────────────────

  describe('listSessions', () => {
    it('returns paginated sessions and total when called without options', async () => {
      prismaMock.chatSession.findMany.mockResolvedValue([makePrismaSessionRow()] as any)
      prismaMock.chatSession.count.mockResolvedValue(1)

      const result = await ChatSessionDBService.listSessions()

      expect(result.total).toBe(1)
      expect(result.sessions).toHaveLength(1)
      expect(result.sessions[0].chatSessionId).toBe('session-abc')
    })

    it('passes status filter to the where clause when provided', async () => {
      prismaMock.chatSession.findMany.mockResolvedValue([] as any)
      prismaMock.chatSession.count.mockResolvedValue(0)

      await ChatSessionDBService.listSessions({ status: 'ACTIVE' })

      expect(prismaMock.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'ACTIVE' }),
        })
      )
    })

    it('passes search OR filter when search string is provided', async () => {
      prismaMock.chatSession.findMany.mockResolvedValue([] as any)
      prismaMock.chatSession.count.mockResolvedValue(0)

      await ChatSessionDBService.listSessions({ search: 'john' })

      expect(prismaMock.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ OR: expect.any(Array) }),
        })
      )
    })

    it('uses custom page and pageSize for pagination', async () => {
      prismaMock.chatSession.findMany.mockResolvedValue([] as any)
      prismaMock.chatSession.count.mockResolvedValue(0)

      await ChatSessionDBService.listSessions({ page: 2, pageSize: 5 })

      expect(prismaMock.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 10, take: 5 })
      )
    })

    it('returns { sessions: [], total: 0 } and logs error on prisma failure', async () => {
      prismaMock.chatSession.findMany.mockRejectedValue(new Error('List error'))

      const result = await ChatSessionDBService.listSessions()

      expect(result).toEqual({ sessions: [], total: 0 })
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] listSessions failed')
      )
    })

    it('falls back to sortKey=updatedAt when an invalid sortKey is provided', async () => {
      prismaMock.chatSession.findMany.mockResolvedValue([] as any)
      prismaMock.chatSession.count.mockResolvedValue(0)

      await ChatSessionDBService.listSessions({ sortKey: 'injectedField', sortDir: 'asc' })

      expect(prismaMock.chatSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { updatedAt: 'asc' },
        })
      )
    })
  })

  // ── getStats ─────────────────────────────────────────────────────────────────

  describe('getStats', () => {
    it('returns correctly computed stats from prisma results', async () => {
      prismaMock.chatSession.groupBy
        .mockResolvedValueOnce([
          { status: 'ACTIVE',     _count: { _all: 3 } },
          { status: 'CLOSED',     _count: { _all: 2 } },
          { status: 'TAKEN_OVER', _count: { _all: 1 } },
        ] as any)
        .mockResolvedValueOnce([
          { userId: 'user-1', _count: { _all: 3 } },
          { userId: 'user-2', _count: { _all: 3 } },
        ] as any)

      prismaMock.chatMessage.count.mockResolvedValue(12)
      prismaMock.chatSession.findMany.mockResolvedValue([makePrismaSessionRow()] as any)

      const result = await ChatSessionDBService.getStats()

      expect(result.totalSessions).toBe(6)
      expect(result.activeSessions).toBe(3)
      expect(result.closedSessions).toBe(2)
      expect(result.takenOverSessions).toBe(1)
      expect(result.totalMessages).toBe(12)
      expect(result.uniqueUsers).toBe(2)
      expect(result.avgMessagesPerSession).toBe(2)
      expect(result.recentSessions).toHaveLength(1)
    })

    it('returns avgMessagesPerSession=0 when totalSessions is 0', async () => {
      prismaMock.chatSession.groupBy
        .mockResolvedValueOnce([] as any)
        .mockResolvedValueOnce([] as any)
      prismaMock.chatMessage.count.mockResolvedValue(0)
      prismaMock.chatSession.findMany.mockResolvedValue([] as any)

      const result = await ChatSessionDBService.getStats()

      expect(result.totalSessions).toBe(0)
      expect(result.avgMessagesPerSession).toBe(0)
    })

    it('returns zeroed stats and logs error on prisma failure', async () => {
      prismaMock.chatSession.groupBy.mockRejectedValue(new Error('Stats error'))

      const result = await ChatSessionDBService.getStats()

      expect(result).toEqual({
        totalSessions: 0,
        activeSessions: 0,
        closedSessions: 0,
        takenOverSessions: 0,
        totalMessages: 0,
        avgMessagesPerSession: 0,
        uniqueUsers: 0,
        recentSessions: [],
      })
      expect(Logger.error).toHaveBeenCalledWith(
        expect.stringContaining('[ChatSessionDBService] getStats failed')
      )
    })
  })
})
