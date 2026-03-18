
import GeoAnalyticsService from '@/services/GeoAnalyticsService'
import redis from '@/libs/redis'

jest.mock('@/services/UserAgentService', () => ({
  parse: jest.fn(),
  getGeoLocationFromMaxMind: jest.fn(),
}))
jest.mock('@/services/DBGeoService', () => ({
  saveOrUpdateGeo: jest.fn(),
}))
jest.mock('@/libs/redis', () => ({
  exists: jest.fn(),
  set: jest.fn(),
  incr: jest.fn(),
}))

const UserAgentServiceMock = require('@/services/UserAgentService')
const DBGeoServiceMock = require('@/services/DBGeoService')
const redisMock = require('@/libs/redis')

describe('GeoAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('skips if fingerprint missing', async () => {
    UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: null })
    const result = await GeoAnalyticsService.process('1.2.3.4')
    expect(result).toEqual({ ok: false, error: 'No fingerprint' })
  })

  it('skips if already seen', async () => {
    redisMock.exists.mockResolvedValueOnce(1)
    UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: 'fp' })
    const result = await GeoAnalyticsService.process('1.2.3.4')
    expect(result).toEqual({ ok: true, skipped: true })
  })

  it('increments city count and persists', async () => {
    redisMock.exists.mockResolvedValueOnce(0)
    redisMock.set.mockResolvedValueOnce(undefined)
    redisMock.incr.mockResolvedValueOnce(2)
    UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: 'fp' })
    UserAgentServiceMock.getGeoLocationFromMaxMind.mockResolvedValue({ city: 'Ankara', country: 'Turkey', countryCode: 'TR', latitude: 39.9, longitude: 32.8 })
    DBGeoServiceMock.saveOrUpdateGeo.mockResolvedValue(undefined)
    const result = await GeoAnalyticsService.process('1.2.3.4')
    expect(result).toEqual({ ok: true, country: 'Turkey', countryCode: 'TR', city: 'Ankara', count: 2 })
  })

  // ── Phase 27 boundary / edge-case additions ─────────────────────────────

  describe('process – missing geo coordinates', () => {
    it('skips when latitude is missing from MaxMind response', async () => {
      redisMock.exists.mockResolvedValueOnce(0)
      redisMock.set.mockResolvedValueOnce(undefined)
      UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: 'fp-no-lat' })
      UserAgentServiceMock.getGeoLocationFromMaxMind.mockResolvedValue({
        city: 'Unknown',
        country: 'Unknown',
        countryCode: '',
        latitude: null,
        longitude: 32.8,
      })

      const result = await GeoAnalyticsService.process('1.2.3.4')

      expect(result).toEqual({ ok: true, skipped: true })
      expect(DBGeoServiceMock.saveOrUpdateGeo).not.toHaveBeenCalled()
    })

    it('skips when longitude is missing from MaxMind response', async () => {
      redisMock.exists.mockResolvedValueOnce(0)
      redisMock.set.mockResolvedValueOnce(undefined)
      UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: 'fp-no-lon' })
      UserAgentServiceMock.getGeoLocationFromMaxMind.mockResolvedValue({
        city: 'Unknown',
        country: 'Unknown',
        countryCode: '',
        latitude: 51.5,
        longitude: null,
      })

      const result = await GeoAnalyticsService.process('192.168.1.1')

      expect(result).toEqual({ ok: true, skipped: true })
    })
  })

  describe('process – unknown country / city fallbacks', () => {
    it('falls back to "Unknown" country and empty countryCode when geo returns nulls', async () => {
      redisMock.exists.mockResolvedValueOnce(0)
      redisMock.set.mockResolvedValueOnce(undefined)
      redisMock.incr.mockResolvedValueOnce(1)
      UserAgentServiceMock.parse.mockResolvedValue({ deviceFingerprint: 'fp-unknown' })
      UserAgentServiceMock.getGeoLocationFromMaxMind.mockResolvedValue({
        city: null,
        country: null,
        countryCode: null,
        latitude: 0,
        longitude: 0,
      })
      DBGeoServiceMock.saveOrUpdateGeo.mockResolvedValue(undefined)

      const result = await GeoAnalyticsService.process('10.0.0.1')

      expect(result).toMatchObject({
        ok: true,
        country: 'Unknown',
        countryCode: '',
        city: 'Unknown',
      })
      expect(DBGeoServiceMock.saveOrUpdateGeo).toHaveBeenCalledWith(
        'Unknown',
        '',
        'Unknown',
        0,
        0,
        1
      )
    })
  })

  describe('hasSeenUser / markUserSeen', () => {
    it('hasSeenUser returns false when redis.exists returns 0', async () => {
      redisMock.exists.mockResolvedValueOnce(0)
      const result = await GeoAnalyticsService.hasSeenUser('new-fp')
      expect(result).toBe(false)
    })

    it('hasSeenUser returns true when redis.exists returns 1', async () => {
      redisMock.exists.mockResolvedValueOnce(1)
      const result = await GeoAnalyticsService.hasSeenUser('existing-fp')
      expect(result).toBe(true)
    })

    it('markUserSeen calls redis.set with the correct key prefix and TTL', async () => {
      redisMock.set.mockResolvedValueOnce(undefined)
      await GeoAnalyticsService.markUserSeen('my-fp')
      expect(redisMock.set).toHaveBeenCalledWith(
        'seen-user:my-fp',
        '1',
        'EX',
        expect.any(Number)
      )
    })
  })
})
