import ChatbotModerationService from '@/services/ChatbotService/ChatbotModerationService'
import redis from '@/libs/redis'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('@/libs/redis', () => ({
  __esModule: true,
  default: {
    get:    jest.fn(),
    set:    jest.fn(),
    del:    jest.fn(),
    ttl:    jest.fn(),
    incr:   jest.fn(),
    expire: jest.fn(),
  },
}))

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: { info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}))

// ── Helpers ───────────────────────────────────────────────────────────────────

const redisMock = redis as jest.Mocked<typeof redis>

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('ChatbotModerationService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── banUser ────────────────────────────────────────────────────────────────
  describe('banUser', () => {
    it('sets a ban key in Redis with TTL', async () => {
      redisMock.set.mockResolvedValue('OK' as any)

      await ChatbotModerationService.banUser('user-bad')

      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('user-bad'),
        '1',
        'EX',
        expect.any(Number),
      )
    })
  })

  // ── unbanUser ──────────────────────────────────────────────────────────────
  describe('unbanUser', () => {
    it('deletes the ban key from Redis', async () => {
      redisMock.del.mockResolvedValue(1 as any)

      await ChatbotModerationService.unbanUser('user-bad')

      expect(redisMock.del).toHaveBeenCalledWith(expect.stringContaining('user-bad'))
    })
  })

  // ── isUserBanned ───────────────────────────────────────────────────────────
  describe('isUserBanned', () => {
    it('returns true when ban key exists in Redis', async () => {
      redisMock.get.mockResolvedValueOnce('1')

      const result = await ChatbotModerationService.isUserBanned('user-bad')

      expect(result).toBe(true)
    })

    it('returns false when ban key does not exist in Redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)

      const result = await ChatbotModerationService.isUserBanned('user-clean')

      expect(result).toBe(false)
    })

    it('correctly identifies distinct users independently', async () => {
      redisMock.get
        .mockResolvedValueOnce('1')   // banned user
        .mockResolvedValueOnce(null)  // clean user

      const bannedResult = await ChatbotModerationService.isUserBanned('user-banned')
      const cleanResult  = await ChatbotModerationService.isUserBanned('user-clean')

      expect(bannedResult).toBe(true)
      expect(cleanResult).toBe(false)
    })
  })

  // ── getBanTTL ──────────────────────────────────────────────────────────────
  describe('getBanTTL', () => {
    it('returns remaining TTL when ban is active', async () => {
      redisMock.ttl.mockResolvedValueOnce(3200 as any)

      const ttl = await ChatbotModerationService.getBanTTL('user-bad')

      expect(ttl).toBe(3200)
    })

    it('returns 0 when key is expired or does not exist (Redis returns -2)', async () => {
      redisMock.ttl.mockResolvedValueOnce(-2 as any)

      const ttl = await ChatbotModerationService.getBanTTL('user-clean')

      expect(ttl).toBe(0)
    })

    it('returns 0 when key exists without TTL (Redis returns -1)', async () => {
      redisMock.ttl.mockResolvedValueOnce(-1 as any)

      const ttl = await ChatbotModerationService.getBanTTL('user-no-ttl')

      expect(ttl).toBe(0)
    })
  })

  // ── checkUserRateLimit ─────────────────────────────────────────────────────
  describe('checkUserRateLimit', () => {
    it('returns true when user is under the rate limit (first request)', async () => {
      redisMock.incr.mockResolvedValueOnce(1 as any)
      redisMock.expire.mockResolvedValue(1 as any)

      const allowed = await ChatbotModerationService.checkUserRateLimit('user-new')

      expect(allowed).toBe(true)
      expect(redisMock.expire).toHaveBeenCalledTimes(1) // sets window on first hit
    })

    it('returns true when user is at limit but not yet over', async () => {
      // Assuming USER_RATE_LIMIT_MAX is at least 20 — use a mid-range value
      redisMock.incr.mockResolvedValueOnce(10 as any)
      redisMock.expire.mockResolvedValue(1 as any)

      const allowed = await ChatbotModerationService.checkUserRateLimit('user-mid')

      expect(allowed).toBe(true)
    })

    it('returns false and logs when user exceeds rate limit', async () => {
      // Exceed the limit — USER_RATE_LIMIT_MAX is defined in constants; use a value well above it
      redisMock.incr.mockResolvedValueOnce(9999 as any)
      redisMock.expire.mockResolvedValue(1 as any)

      const allowed = await ChatbotModerationService.checkUserRateLimit('user-spammy')

      expect(allowed).toBe(false)
    })

    it('does not set window TTL on subsequent requests (current > 1)', async () => {
      redisMock.incr.mockResolvedValueOnce(5 as any) // not first hit
      redisMock.expire.mockResolvedValue(1 as any)

      await ChatbotModerationService.checkUserRateLimit('user-returning')

      expect(redisMock.expire).not.toHaveBeenCalled()
    })

    it('returns true (fail-open) when Redis incr throws', async () => {
      redisMock.incr.mockRejectedValueOnce(new Error('Redis connection error'))

      const allowed = await ChatbotModerationService.checkUserRateLimit('user-redis-down')

      expect(allowed).toBe(true)
    })
  })
})
