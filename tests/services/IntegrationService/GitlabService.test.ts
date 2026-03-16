import GitlabService from '@/services/IntegrationService/GitlabService'
import redis from '@/libs/redis'

const redisMock = redis as jest.Mocked<typeof redis>

describe('GitlabService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getMockContributions ──────────────────────────────────────────────
  describe('getMockContributions', () => {
    it('returns fresh cached data when redis key exists', async () => {
      const cached = { user: { contributionsCollection: {} } }
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now(),
          data: cached,
        })
      )

      const result = await GitlabService.getMockContributions()
      expect(redisMock.set).not.toHaveBeenCalled()
      expect(result).toEqual(cached)
    })

    it('supports legacy cache format for backward compatibility', async () => {
      const cached = { user: { contributionsCollection: {} } }
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const result = await GitlabService.getMockContributions()
      expect(result).toEqual(cached)
      expect(redisMock.set).not.toHaveBeenCalled()
    })

    it('clears malformed cache and regenerates data', async () => {
      redisMock.get.mockResolvedValueOnce('not-json')
      redisMock.del.mockResolvedValueOnce(1)
      redisMock.set.mockResolvedValue('OK')

      const result = await GitlabService.getMockContributions()

      expect(redisMock.del).toHaveBeenCalledWith(GitlabService.REDIS_KEY)
      expect(result.user.contributionsCollection.contributionCalendar.weeks).toHaveLength(10)
    })

    it('generates mock data, caches it, and returns it when cache misses', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      const result = await GitlabService.getMockContributions()

      expect(redisMock.set).toHaveBeenCalledWith(
        GitlabService.REDIS_KEY,
        expect.any(String),
        'EX',
        GitlabService.STALE_CACHE_TTL_SECONDS
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

    it('is deterministic for same generated input shape', async () => {
      redisMock.get.mockResolvedValue(null)
      redisMock.set.mockResolvedValue('OK')

      const first = await GitlabService.getMockContributions()
      const second = await GitlabService.getMockContributions()

      expect(first).toEqual(second)
    })

    it('returns stale cache if generation fails', async () => {
      const stale = {
        user: {
          contributionsCollection: {
            contributionCalendar: {
              weeks: [{ firstDay: '2025-01-01', contributionDays: [] }],
            },
          },
        },
      }

      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now() - (GitlabService.CACHE_TTL_SECONDS + 10) * 1000,
          data: stale,
        })
      )

      const buildSpy = jest
        .spyOn(GitlabService as any, 'buildMockContributions')
        .mockImplementationOnce(() => {
          throw new Error('generation failed')
        })

      const result = await GitlabService.getMockContributions()
      expect(result).toEqual(stale)

      buildSpy.mockRestore()
    })
  })
})
