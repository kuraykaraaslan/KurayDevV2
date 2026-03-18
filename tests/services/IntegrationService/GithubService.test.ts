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

    it('maps 403 response to GITHUB_FORBIDDEN', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(403))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_FORBIDDEN')
    })

    it('maps 404 response to GITHUB_NOT_FOUND', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(404))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_NOT_FOUND')
    })

    it('maps 403 response to GITHUB_FORBIDDEN', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(403))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_FORBIDDEN')
    })

    it('maps 404 response to GITHUB_NOT_FOUND', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(404))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_NOT_FOUND')
    })

    it('does not retry for non-retryable client errors', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post.mockRejectedValueOnce(makeAxiosError(400))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_REQUEST_FAILED')
      expect(axiosMock.post).toHaveBeenCalledTimes(1)
    })

    it('maps exhausted 429 retries to GITHUB_RATE_LIMITED', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post
        .mockRejectedValueOnce(makeAxiosError(429))
        .mockRejectedValueOnce(makeAxiosError(429))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_RATE_LIMITED')
      expect(axiosMock.post).toHaveBeenCalledTimes(2)
    })

    it('maps exhausted 5xx retries to GITHUB_UPSTREAM_ERROR', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post
        .mockRejectedValueOnce(makeAxiosError(502))
        .mockRejectedValueOnce(makeAxiosError(502))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_UPSTREAM_ERROR')
      expect(axiosMock.post).toHaveBeenCalledTimes(2)
    })

    it('maps unknown non-axios failures to GITHUB_REQUEST_FAILED', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      ;(axiosMock.isAxiosError as any) = () => false
      axiosMock.post.mockRejectedValueOnce({ foo: 'bar' })

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_REQUEST_FAILED')
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

// ── Phase 22: GithubService integration extensions ────────────────────────

describe('GithubService — Phase 22 integration extensions', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    process.env.GITHUB_TOKEN = 'test-github-token'
    process.env.GITHUB_USER = 'test-user'
    ;(axiosMock.isAxiosError as any) = (error: unknown) => Boolean((error as any)?.isAxiosError)
  })

  // ── malformed webhook payload (response without expected shape) ───────
  describe('getContributionCalendar — malformed response payload', () => {
    it('falls back to stale cache when API response is missing user.contributionsCollection', async () => {
      const stale = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now() - (GithubService.CACHE_TTL_SECONDS + 300) * 1000,
          data: stale,
        })
      )

      // API returns a malformed response that throws during normalization
      axiosMock.post.mockResolvedValueOnce({
        data: { data: { user: null } },
      })

      // normalizeContributionCalendar will throw accessing .contributionsCollection on null
      // service catches upstream error and returns stale cache
      const result = await GithubService.getContributionCalendar()
      expect(result).toEqual(stale)
    })

    it('throws when API returns malformed data and no stale cache exists', async () => {
      redisMock.get.mockResolvedValueOnce(null)

      // Axios response missing the .data.data.user path causes TypeError
      axiosMock.post.mockResolvedValueOnce({
        data: { data: null },
      })

      await expect(GithubService.getContributionCalendar()).rejects.toThrow()
    })
  })

  // ── signature mismatch / missing required fields (GITHUB_TOKEN absent) ─
  describe('getContributionCalendar — missing required configuration', () => {
    it('throws GITHUB_TOKEN is required when env var is an empty string', async () => {
      process.env.GITHUB_TOKEN = '   '
      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_TOKEN is required')
    })

    it('throws GITHUB_USER is required when env var is an empty string', async () => {
      process.env.GITHUB_USER = '   '
      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_USER is required')
    })
  })

  // ── API rate limit response handled ──────────────────────────────────
  describe('getContributionCalendar — rate limit response handling', () => {
    it('maps 429 rate limit after retry exhaustion to GITHUB_RATE_LIMITED', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      axiosMock.post
        .mockRejectedValueOnce(makeAxiosError(429))
        .mockRejectedValueOnce(makeAxiosError(429))

      await expect(GithubService.getContributionCalendar()).rejects.toThrow('GITHUB_RATE_LIMITED')
      expect(axiosMock.post).toHaveBeenCalledTimes(2) // initial + 1 retry
    })

    it('falls back to stale cache on 429 when stale data exists', async () => {
      const stale = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(
        JSON.stringify({
          fetchedAt: Date.now() - (GithubService.CACHE_TTL_SECONDS + 300) * 1000,
          data: stale,
        })
      )
      axiosMock.post
        .mockRejectedValueOnce(makeAxiosError(429))
        .mockRejectedValueOnce(makeAxiosError(429))

      const result = await GithubService.getContributionCalendar()
      expect(result).toEqual(stale)
    })
  })
})
