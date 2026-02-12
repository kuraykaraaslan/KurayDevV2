import { prisma } from '@/libs/prisma'

export default class DBGeoService {
  static async saveOrUpdateGeo(
    country: string,
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
          city,
          lat,
          lon,
          count,
        },
        update: {
          // only increment count, keep coordinates unchanged
          count: { increment: count },
        },
      })
    } catch (error) {
      console.error('Geo upsert ERROR:', error)
    }
  }

  static async getAll() {
    return prisma.geoAnalytics.findMany({
      orderBy: { count: 'desc' },
    })
  }
}
