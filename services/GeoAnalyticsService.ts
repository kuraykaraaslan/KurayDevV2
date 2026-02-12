import redis from '@/libs/redis'
import UserAgentService from '@/services/UserAgentService'
import DBGeoService from '@/services/DBGeoService'

export default class GeoAnalyticsService {
  private static userKeyPrefix = 'seen-user:'
  private static cityKeyPrefix = 'geo-city:'

  // Kullanıcıyı bir kez saymak için
  static async hasSeenUser(fingerprint: string) {
    return (await redis.exists(this.userKeyPrefix + fingerprint)) === 1
  }

  static async markUserSeen(fingerprint: string) {
    await redis.set(this.userKeyPrefix + fingerprint, '1', 'EX', 60 * 60 * 24 * 90)
  }

  // Ana iş mantığı: hem şehir analytics hem unique user
  static async process(ip: string) {
    const ua = await UserAgentService.parse(undefined, ip)
    const fingerprint = ua.deviceFingerprint

    if (!fingerprint) {
      return { ok: false, error: 'No fingerprint' }
    }

    // Eğer kullanıcı daha önce sayılmışsa şehir sayısı artmasın
    const alreadySeen = await this.hasSeenUser(fingerprint)
    if (alreadySeen) {
      return { ok: true, skipped: true }
    }

    // Kullanıcıyı tekrar saymamak için işaretle
    await this.markUserSeen(fingerprint)

    // Geo konum al
    const geo = await UserAgentService.getGeoLocationFromMaxMind(ip)
    if (!geo.latitude || !geo.longitude) {
      return { ok: true, skipped: true }
    }

    const country = geo.country || 'Unknown'
    const city = geo.city || 'Unknown'

    // Şehir bazlı Redis counter
    const redisKey = `${this.cityKeyPrefix}${country}:${city}`
    const newCount = await redis.incr(redisKey)

    // DB güncelle
    await DBGeoService.saveOrUpdateGeo(
      country,
      city,
      geo.latitude,
      geo.longitude,
      1 // her yeni user için +1
    )

    return {
      ok: true,
      country,
      city,
      count: newCount,
    }
  }
}
