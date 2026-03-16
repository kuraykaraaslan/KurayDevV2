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

describe('GithubService', () => {
  beforeEach(() => jest.clearAllMocks())

  describe('getContributionCalendar', () => {
    it('returns cached data when redis key exists', async () => {
      const cached = makeResponse().data.data
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      const result = await GithubService.getContributionCalendar()
      expect(axiosMock.post).not.toHaveBeenCalled()
      expect(result).toEqual(cached)
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
        GithubService.CACHE_TTL_SECONDS
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
  })
})
