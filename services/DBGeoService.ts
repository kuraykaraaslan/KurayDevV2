import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'

const CACHE_KEY = 'geo:all'
const CACHE_TTL = 60 * 5 // 5 minutes

export default class DBGeoService {
  /**
   * Upsert a geo analytics record. Increments count for existing city entries.
   * Invalidates the Redis cache after write.
   */
  static async saveOrUpdateGeo(
    country: string,
    countryCode: string,
    city: string,
    lat: number,
    lon: number,
    count: number
  ) {
    try {
      await prisma.geoAnalytics.upsert({
        where: {
          country_city: { country, city },
        },
        create: {
          country,
          countryCode,
          city,
          lat,
          lon,
          count,
        },
        update: {
          // only increment count and refresh countryCode; keep coordinates unchanged
          count: { increment: count },
          countryCode,
        },
      })

      await redis.del(CACHE_KEY)
    } catch (error) {
      console.error('Geo upsert ERROR:', error)
    }
  }

  /**
   * Returns all geo records ordered by visit count descending.
   * Result is cached in Redis for 5 minutes.
   */
  static async getAll() {
    const cached = await redis.get(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached) as {
        id: string
        country: string
        countryCode: string
        city: string
        lat: number
        lon: number
        count: number
      }[]
    }

    const data = await prisma.geoAnalytics.findMany({
      orderBy: { count: 'desc' },
    })

    await redis.set(CACHE_KEY, JSON.stringify(data), 'EX', CACHE_TTL)

    return data
  }
}
