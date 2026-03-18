
import DBGeoService from '@/services/DBGeoService'
import redis from '@/libs/redis'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    geoAnalytics: {
      upsert: jest.fn(),
      findMany: jest.fn(),
    },
  },
}))
jest.mock('@/libs/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}))

const prismaMock = require('@/libs/prisma').prisma.geoAnalytics
const redisMock = require('@/libs/redis')

describe('DBGeoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('upserts geo and invalidates cache', async () => {
    prismaMock.upsert.mockResolvedValueOnce(undefined)
    redisMock.del.mockResolvedValueOnce(undefined)
    await DBGeoService.saveOrUpdateGeo('TR', 'TR', 'Ankara', 39.9, 32.8, 1)
    expect(prismaMock.upsert).toHaveBeenCalled()
    expect(redisMock.del).toHaveBeenCalledWith('geo:all')
  })

  it('returns cached geo if exists', async () => {
    redisMock.get.mockResolvedValueOnce(JSON.stringify([{ city: 'Ankara', count: 5 }]))
    const result = await DBGeoService.getAll()
    expect(result).toEqual([{ city: 'Ankara', count: 5 }])
  })

  it('fetches geo from DB and caches', async () => {
    redisMock.get.mockResolvedValueOnce(null)
    prismaMock.findMany.mockResolvedValueOnce([{ city: 'Ankara', count: 5 }])
    redisMock.set.mockResolvedValueOnce(undefined)
    const result = await DBGeoService.getAll()
    expect(prismaMock.findMany).toHaveBeenCalled()
    expect(result).toEqual([{ city: 'Ankara', count: 5 }])
  })

  // ── Phase 27 boundary / edge-case additions ─────────────────────────────

  describe('saveOrUpdateGeo – error handling', () => {
    it('swallows DB upsert errors gracefully (does not throw)', async () => {
      prismaMock.upsert.mockRejectedValueOnce(new Error('DB connection lost'))
      // Should resolve without throwing even when the DB call fails
      await expect(
        DBGeoService.saveOrUpdateGeo('Unknown', '', 'Unknown', 0, 0, 1)
      ).resolves.toBeUndefined()
    })

    it('does not call redis.del when the DB upsert throws', async () => {
      prismaMock.upsert.mockRejectedValueOnce(new Error('unique constraint'))
      await DBGeoService.saveOrUpdateGeo('DE', 'DE', 'Berlin', 52.5, 13.4, 1)
      expect(redisMock.del).not.toHaveBeenCalled()
    })
  })

  describe('saveOrUpdateGeo – special / boundary inputs', () => {
    it('accepts an unknown country code (empty string) without throwing', async () => {
      prismaMock.upsert.mockResolvedValueOnce(undefined)
      redisMock.del.mockResolvedValueOnce(undefined)
      await expect(
        DBGeoService.saveOrUpdateGeo('Unknown', '', 'Unknown', 0, 0, 1)
      ).resolves.toBeUndefined()
      expect(prismaMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({ countryCode: '', country: 'Unknown' }),
        })
      )
    })

    it('passes coordinates correctly to the upsert call', async () => {
      prismaMock.upsert.mockResolvedValueOnce(undefined)
      redisMock.del.mockResolvedValueOnce(undefined)
      await DBGeoService.saveOrUpdateGeo('Japan', 'JP', 'Tokyo', 35.6762, 139.6503, 3)
      expect(prismaMock.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          create: expect.objectContaining({
            lat: 35.6762,
            lon: 139.6503,
            count: 3,
          }),
        })
      )
    })
  })

  describe('getAll – cache miss with empty dataset', () => {
    it('returns an empty array and still writes the empty result to cache', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      prismaMock.findMany.mockResolvedValueOnce([])
      redisMock.set.mockResolvedValueOnce(undefined)

      const result = await DBGeoService.getAll()

      expect(result).toEqual([])
      expect(redisMock.set).toHaveBeenCalledWith(
        'geo:all',
        JSON.stringify([]),
        'EX',
        expect.any(Number)
      )
    })
  })

  describe('getAll – cache hit', () => {
    it('does not call DB when cache is populated', async () => {
      const cached = [{ id: '1', country: 'US', city: 'NY', count: 10 }]
      redisMock.get.mockResolvedValueOnce(JSON.stringify(cached))

      await DBGeoService.getAll()

      expect(prismaMock.findMany).not.toHaveBeenCalled()
    })
  })
})
