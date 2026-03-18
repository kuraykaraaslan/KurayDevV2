import redis from '@/libs/redis'
import UserAgentService from '@/services/UserAgentService'
import DBGeoService from '@/services/DBGeoService'

export default class GeoAnalyticsService {
  private static userKeyPrefix = 'seen-user:'
  private static cityKeyPrefix = 'geo-city:'

  /** Returns true if this device fingerprint has already been counted. */
  static async hasSeenUser(fingerprint: string) {
    return (await redis.exists(this.userKeyPrefix + fingerprint)) === 1
  }

  /** Marks a device fingerprint as seen for 90 days. */
  static async markUserSeen(fingerprint: string) {
    await redis.set(this.userKeyPrefix + fingerprint, '1', 'EX', 60 * 60 * 24 * 90)
  }

  /**
   * Main entry point: resolves IP → geo location, deduplicates by device
   * fingerprint, and persists an incremented visit count per city to the DB.
   */
  static async process(ip: string) {
    const ua = await UserAgentService.parse(undefined, ip)
    const fingerprint = ua.deviceFingerprint

    if (!fingerprint) {
      return { ok: false, error: 'No fingerprint' }
    }

    const alreadySeen = await this.hasSeenUser(fingerprint)
    if (alreadySeen) {
      return { ok: true, skipped: true }
    }

    await this.markUserSeen(fingerprint)

    const geo = await UserAgentService.getGeoLocationFromMaxMind(ip)
    if (geo.latitude == null || geo.longitude == null) {
      return { ok: true, skipped: true }
    }

    const country = geo.country || 'Unknown'
    const countryCode = geo.countryCode || ''
    const city = geo.city || 'Unknown'

    const redisKey = `${this.cityKeyPrefix}${country}:${city}`
    const newCount = await redis.incr(redisKey)

    await DBGeoService.saveOrUpdateGeo(country, countryCode, city, geo.latitude, geo.longitude, 1)

    return { ok: true, country, countryCode, city, count: newCount }
  }
}
