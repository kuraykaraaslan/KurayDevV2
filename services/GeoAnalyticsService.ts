import redis from '@/libs/redis'
import UserAgentService from '@/services/UserAgentService'
import DBGeoService from '@/services/DBGeoService'

export default class GeoAnalyticsService {
  private static userKeyPrefix = 'seen-user:'
  private static cityKeyPrefix = 'geo-city:'

  // To count each user only once
  static async hasSeenUser(fingerprint: string) {
    return (await redis.exists(this.userKeyPrefix + fingerprint)) === 1
  }

  static async markUserSeen(fingerprint: string) {
    await redis.set(this.userKeyPrefix + fingerprint, '1', 'EX', 60 * 60 * 24 * 90)
  }

  // Main logic: both city analytics and unique user tracking
  static async process(ip: string) {
    const ua = await UserAgentService.parse(undefined, ip)
    const fingerprint = ua.deviceFingerprint

    if (!fingerprint) {
      return { ok: false, error: 'No fingerprint' }
    }

    // If user was already counted, don't increment city count
    const alreadySeen = await this.hasSeenUser(fingerprint)
    if (alreadySeen) {
      return { ok: true, skipped: true }
    }

    // Mark user as seen to avoid counting again
    await this.markUserSeen(fingerprint)

    // Geo konum al
    const geo = await UserAgentService.getGeoLocationFromMaxMind(ip)
    if (!geo.latitude || !geo.longitude) {
      return { ok: true, skipped: true }
    }

    const country = geo.country || 'Unknown'
    const city = geo.city || 'Unknown'

    // City-based Redis counter
    const redisKey = `${this.cityKeyPrefix}${country}:${city}`
    const newCount = await redis.incr(redisKey)

    // Update DB
    await DBGeoService.saveOrUpdateGeo(
      country,
      city,
      geo.latitude,
      geo.longitude,
      1 // +1 for each new user
    )

    return {
      ok: true,
      country,
      city,
      count: newCount,
    }
  }
}
