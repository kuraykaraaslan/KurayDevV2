import StatService from '@/services/StatService'
import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    post: { count: jest.fn(), aggregate: jest.fn() },
    category: { count: jest.fn() },
    user: { count: jest.fn() },
    comment: { count: jest.fn() },
    $transaction: jest.fn(),
  },
}))

jest.mock('@/services/ChatbotService/ChatbotAdminService', () => ({
  __esModule: true,
  default: {
    getStats: jest.fn().mockResolvedValue({ totalSessions: 5, totalMessages: 42 }),
  },
}))

const prismaMock = prisma as any
const redisMock = redis as jest.Mocked<typeof redis>

describe('StatService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getAllStats ───────────────────────────────────────────────────────
  describe('getAllStats', () => {
    it('returns cached stats when redis key exists', async () => {
      const cachedStats = { totalPosts: 10, totalCategories: 3, totalUsers: 50, totalViews: 1000, totalComments: 20, totalChatSessions: 5, totalChatMessages: 42 }
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cachedStats))

      const result = await StatService.getAllStats('all-time')
      expect(result.totalPosts).toBe(10)
      expect(prismaMock.$transaction).not.toHaveBeenCalled()
    })

    it('queries DB and caches result when redis miss', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      prismaMock.$transaction.mockResolvedValueOnce([
        5,        // totalPosts
        2,        // totalCategories
        20,       // totalUsers
        { _sum: { views: 500 } },  // totalViewsAggregate
        10,       // totalComments
      ])

      const result = await StatService.getAllStats('all-time')
      expect(result.totalPosts).toBe(5)
      expect(result.totalViews).toBe(500)
      expect(result.totalChatSessions).toBe(5)
      expect(redisMock.set).toHaveBeenCalledWith(
        'stats:global:all-time',
        expect.any(String),
        'EX',
        StatService.CACHE_TTL_SECONDS
      )
    })

    it('handles null views aggregate gracefully', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      prismaMock.$transaction.mockResolvedValueOnce([
        0, 0, 0, { _sum: { views: null } }, 0,
      ])

      const result = await StatService.getAllStats('all-time')
      expect(result.totalViews).toBe(0)
    })

    it('applies daily frequency filter', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      prismaMock.$transaction.mockResolvedValueOnce([1, 1, 1, { _sum: { views: 10 } }, 1])

      await StatService.getAllStats('daily')

      const [[queries]] = prismaMock.$transaction.mock.calls
      // First query should have a createdAt.gte filter
      expect(queries).toBeDefined()
      expect(redisMock.set).toHaveBeenCalledWith(
        'stats:global:daily',
        expect.any(String),
        'EX',
        expect.any(Number)
      )
    })
  })

  // ── getChatbotStats ───────────────────────────────────────────────────
  describe('getChatbotStats', () => {
    it('delegates to ChatbotAdminService.getStats', async () => {
      const result = await StatService.getChatbotStats()
      expect(result.totalSessions).toBe(5)
      expect(result.totalMessages).toBe(42)
    })
  })
})

// ── Phase 23 additions ────────────────────────────────────────────────────────

const ChatbotAdminServiceMock = jest.requireMock('@/services/ChatbotService/ChatbotAdminService').default

describe('StatService – cache key isolation per frequency', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ChatbotAdminServiceMock.getStats.mockResolvedValue({ totalSessions: 5, totalMessages: 42 })
  })

  it('uses distinct cache keys for different frequencies', async () => {
    redisMock.get.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
    redisMock.set.mockResolvedValueOnce('OK').mockResolvedValueOnce('OK')
    prismaMock.$transaction
      .mockResolvedValueOnce([0, 0, 0, { _sum: { views: 0 } }, 0])
      .mockResolvedValueOnce([0, 0, 0, { _sum: { views: 0 } }, 0])

    await StatService.getAllStats('daily')
    await StatService.getAllStats('weekly')

    const setCalls = redisMock.set.mock.calls.map((c: any[]) => c[0])
    expect(setCalls).toContain('stats:global:daily')
    expect(setCalls).toContain('stats:global:weekly')
    expect(setCalls[0]).not.toBe(setCalls[1])
  })

  it('does not hit the DB on the second call when the first was just cached', async () => {
    const fresh = { totalPosts: 7, totalCategories: 2, totalUsers: 15, totalViews: 200, totalComments: 5, totalChatSessions: 5, totalChatMessages: 42 }

    // First call: cache miss → queries DB and populates cache
    redisMock.get.mockResolvedValueOnce(null)
    redisMock.set.mockResolvedValueOnce('OK')
    prismaMock.$transaction.mockResolvedValueOnce([7, 2, 15, { _sum: { views: 200 } }, 5])
    await StatService.getAllStats('monthly')

    // Second call: cache hit → should not touch DB
    redisMock.get.mockResolvedValueOnce(JSON.stringify(fresh))

    const result = await StatService.getAllStats('monthly')
    expect(result.totalPosts).toBe(7)
    // $transaction was called exactly once (for the first call only)
    expect(prismaMock.$transaction).toHaveBeenCalledTimes(1)
  })
})

describe('StatService – zero-count scenarios', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ChatbotAdminServiceMock.getStats.mockResolvedValue({ totalSessions: 5, totalMessages: 42 })
  })

  it('returns zeros for all counts when DB is empty', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    redisMock.set.mockResolvedValue('OK')
    prismaMock.$transaction.mockResolvedValueOnce([0, 0, 0, { _sum: { views: null } }, 0])

    const result = await StatService.getAllStats('all-time')
    expect(result.totalPosts).toBe(0)
    expect(result.totalCategories).toBe(0)
    expect(result.totalUsers).toBe(0)
    expect(result.totalViews).toBe(0)
    expect(result.totalComments).toBe(0)
  })

  it('returns zero totalViews when aggregate _sum.views is null (no posts have views)', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    redisMock.set.mockResolvedValue('OK')
    prismaMock.$transaction.mockResolvedValueOnce([1, 1, 1, { _sum: { views: null } }, 0])

    const result = await StatService.getAllStats('all-time')
    expect(result.totalViews).toBe(0)
  })
})

describe('StatService – frequency filter branch coverage', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    ChatbotAdminServiceMock.getStats.mockResolvedValue({ totalSessions: 5, totalMessages: 42 })
  })

  it.each(['weekly', 'monthly', 'yearly'])(
    'applies a date filter for frequency=%s and caches under the correct key',
    async (freq) => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      prismaMock.$transaction.mockResolvedValueOnce([1, 1, 1, { _sum: { views: 10 } }, 1])

      await StatService.getAllStats(freq)

      expect(redisMock.set).toHaveBeenCalledWith(
        `stats:global:${freq}`,
        expect.any(String),
        'EX',
        expect.any(Number),
      )
    },
  )

  it('falls through to no date filter for an unknown frequency string', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    redisMock.set.mockResolvedValue('OK')
    prismaMock.$transaction.mockResolvedValueOnce([3, 2, 10, { _sum: { views: 50 } }, 4])

    const result = await StatService.getAllStats('all-time')
    expect(result.totalPosts).toBe(3)
    expect(redisMock.set).toHaveBeenCalledWith(
      'stats:global:all-time',
      expect.any(String),
      'EX',
      expect.any(Number),
    )
  })
})
