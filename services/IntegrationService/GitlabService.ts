import redis from '@/libs/redis'

interface CachedGitlabContributions {
  fetchedAt: number
  data: any
}

export default class GitlabService {
  static REDIS_KEY = 'gitlab:contributions'
  static CACHE_TTL_SECONDS = 60 * 60 * 24 // 1 day (fresh cache)
  static STALE_CACHE_TTL_SECONDS = 60 * 60 * 24 * 7 // 7 days (stale fallback window)

  private static parseCache(payload: string): CachedGitlabContributions | null {
    try {
      const parsed = JSON.parse(payload)

      if (parsed?.data?.user?.contributionsCollection && typeof parsed?.fetchedAt === 'number') {
        return parsed as CachedGitlabContributions
      }

      // Backward compatibility for old cache format
      if (parsed?.user?.contributionsCollection) {
        return {
          fetchedAt: Date.now(),
          data: parsed,
        }
      }

      return null
    } catch {
      return null
    }
  }

  private static buildMockContributions(): any {
    return {
      user: {
        contributionsCollection: {
          contributionCalendar: {
            weeks: Array.from({ length: 10 }).map((_, i) => ({
              firstDay: `2025-06-${(i + 1).toString().padStart(2, '0')}`,
              contributionDays: Array.from({ length: 7 }).map((__, j) => ({
                date: `2025-06-${(i + 1).toString().padStart(2, '0')}`,
                weekday: j,
                contributionCount: ((i + 3) * (j + 5)) % 10,
                color: '#c6e48b',
              })),
            })),
          },
        },
      },
    }
  }

  static async getMockContributions(): Promise<any> {
    let staleCache: CachedGitlabContributions | null = null

    const cachedRaw = await redis.get(this.REDIS_KEY)
    if (cachedRaw) {
      const parsed = this.parseCache(cachedRaw)

      if (!parsed) {
        await redis.del(this.REDIS_KEY)
      } else {
        staleCache = parsed
        const ageSeconds = Math.floor((Date.now() - parsed.fetchedAt) / 1000)
        if (ageSeconds <= this.CACHE_TTL_SECONDS) {
          return parsed.data
        }
      }
    }

    try {
      const mock = this.buildMockContributions()
      await redis.set(
        this.REDIS_KEY,
        JSON.stringify({ fetchedAt: Date.now(), data: mock }),
        'EX',
        this.STALE_CACHE_TTL_SECONDS
      )
      return mock
    } catch (error) {
      if (staleCache) return staleCache.data
      throw error
    }
  }
}
