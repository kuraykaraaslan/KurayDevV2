import axios from 'axios'
import GithubService from '@/services/IntegrationService/GithubService'
import redis from '@/libs/redis'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>
const redisMock = redis as jest.Mocked<typeof redis>

// axios response shape: response.data.data (GraphQL envelope)
const makeResponse = (days = 7) => ({
  data: {
    data: {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: [{
              firstDay: '2024-01-01',
              contributionDays: Array.from({ length: days }, (_, i) => ({
                color: '#ebedf0', contributionCount: i, date: `2024-01-0${i + 1}`, weekday: i,
              })),
            }],
          },
        },
      },
    },
  },
})

const makeAxiosError = (status?: number, code?: string) => {
  const err = new Error('axios error') as any
  err.isAxiosError = true
  err.code = code
  if (status) {
    err.response = { status }
  }
  return err
}

describe('GithubService', () => {
  const originalGithubToken = process.env.GITHUB_TOKEN
  const originalGithubUser = process.env.GITHUB_USER

  beforeEach(() => {
    jest.resetAllMocks()
    process.env.GITHUB_TOKEN = 'test-github-token'
    process.env.GITHUB_USER = 'test-user'
    ;(axiosMock.isAxiosError as any) = (error: unknown) => Boolean((error as any)?.isAxiosError)
  })

  afterAll(() => {
    process.env.GITHUB_TOKEN = originalGithubToken
    process.env.GITHUB_USER = originalGithubUser
  })

  describe('getContributionCalendar', () => {
    it('returns fresh cached data when redis key exists', async () => {
      const cached = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now(),
          data: cached,
        })
      )

      const result = await GithubService.getContributionCalendar()
      expect(axiosMock.post).not.toHaveBeenCalled()
      expect(result).toEqual(cached)
    })

    it('supports legacy cache format for backward compatibility', async () => {
      const cached = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const result = await GithubService.getContributionCalendar()
      expect(result).toEqual(cached)
      expect(axiosMock.post).not.toHaveBeenCalled()
    })

    it('clears malformed cache and fetches from API', async () => {
      redisMock.get.mockResolvedValueOnce('not-a-json')
      redisMock.del.mockResolvedValueOnce(1)
      redisMock.set.mockResolvedValue('OK')
      axiosMock.post.mockResolvedValueOnce(makeResponse())

      await GithubService.getContributionCalendar()

      expect(redisMock.del).toHaveBeenCalledWith(GithubService.REDIS_KEY)
      expect(axiosMock.post).toHaveBeenCalledTimes(1)
    })

    it('fetches from GitHub API when cache misses and caches result', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      axiosMock.post.mockResolvedValueOnce(makeResponse())

      const result = await GithubService.getContributionCalendar()

      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://api.github.com/graphql',
        expect.any(Object),
        expect.any(Object)
      )
      expect(redisMock.set).toHaveBeenCalledWith(
        GithubService.REDIS_KEY,
        expect.any(String),
        'EX',
        GithubService.STALE_CACHE_TTL_SECONDS
      )
      expect(result.user).toBeDefined()
    })

    it('pads last week to 7 days when incomplete', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      axiosMock.post.mockResolvedValueOnce(makeResponse(5))

      const result = await GithubService.getContributionCalendar()
      const lastWeek = result.user.contributionsCollection.contributionCalendar.weeks[0]
      expect(lastWeek.contributionDays).toHaveLength(7)
    })

    it('uses stale cache fallback when upstream fails', async () => {
      const stale = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now() - (GithubService.CACHE_TTL_SECONDS + 120) * 1000,
          data: stale,
        })
      )
      axiosMock.post.mockRejectedValue(makeAxiosError(500))

      const result = await GithubService.getContributionCalendar()
      expect(result).toEqual(stale)
    })

    it('retries once for retryable errors (429) and succeeds', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      axiosMock.post
        .mockRejectedValueOnce(makeAxiosError(429))
        .mockResolvedValueOnce(makeResponse())

      const result = await GithubService.getContributionCalendar()

      expect(axiosMock.post).toHaveBeenCalledTimes(2)
      expect(result.user).toBeDefined()
    })

    it('maps 401 response to GITHUB_UNAUTHORIZED', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(401))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_UNAUTHORIZED')
    })

    it('maps timeout errors to GITHUB_TIMEOUT', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValue(makeAxiosError(undefined, 'ECONNABORTED'))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_TIMEOUT')
    })

    it('throws explicit error when GITHUB_TOKEN is missing', async () => {
      delete process.env.GITHUB_TOKEN
      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_TOKEN is required')
    })

    it('throws explicit error when GITHUB_USER is missing', async () => {
      delete process.env.GITHUB_USER
      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_USER is required')
    })
  })
})
