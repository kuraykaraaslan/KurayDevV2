import GitlabService from '@/services/IntegrationService/GitlabService'
import redis from '@/libs/redis'

const redisMock = redis as jest.Mocked<typeof redis>

describe('GitlabService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getMockContributions ──────────────────────────────────────────────
  describe('getMockContributions', () => {
    it('returns cached data when redis key exists', async () => {
      const cached = { user: { contributionsCollection: {} } }
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const result = await GitlabService.getMockContributions()
      expect(redisMock.set).not.toHaveBeenCalled()
      expect(result).toEqual(cached)
    })

    it('generates mock data, caches it, and returns it when cache misses', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      const result = await GitlabService.getMockContributions()

      expect(redisMock.set).toHaveBeenCalledWith(
        GitlabService.REDIS_KEY,
        expect.any(String),
        'EX',
        GitlabService.CACHE_TTL_SECONDS
      )
      expect(result.user.contributionsCollection.contributionCalendar.weeks).toHaveLength(10)
    })

    it('each generated week has 7 contribution days', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      const result = await GitlabService.getMockContributions()
      for (const week of result.user.contributionsCollection.contributionCalendar.weeks) {
        expect(week.contributionDays).toHaveLength(7)
      }
    })
  })
})
