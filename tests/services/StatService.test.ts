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
