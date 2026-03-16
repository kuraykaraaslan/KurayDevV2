import axios from 'axios'
import UserAgentService from '@/services/UserAgentService'
import redis from '@/libs/redis'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>
const redisMock = redis as jest.Mocked<typeof redis>

describe('UserAgentService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getOS ─────────────────────────────────────────────────────────────
  describe('getOS', () => {
    it.each([
      ['Windows NT 10.0', 'Windows'],
      ['Mac OS X 14.0', 'macOS'],
      ['Android 13', 'Android'],
      ['iPhone OS 17', 'iOS'],
      ['CrOS x86_64', 'Chrome OS'],
      ['Linux x86_64', 'Linux'],
      ['UnknownAgent', 'Unknown'],
    ])('detects %s as %s', (ua, expected) => {
      expect(UserAgentService.getOS(ua)).toBe(expected)
    })
  })

  // ── getDeviceType ─────────────────────────────────────────────────────
  describe('getDeviceType', () => {
    it('returns Tablet for iPad', () => {
      expect(UserAgentService.getDeviceType('iPad Safari')).toBe('Tablet')
    })

    it('returns Tablet for Android non-mobile', () => {
      expect(UserAgentService.getDeviceType('Android 13 Chrome')).toBe('Tablet')
    })

    it('returns Mobile for iPhone', () => {
      expect(UserAgentService.getDeviceType('iPhone OS 17 Safari')).toBe('Mobile')
    })

    it('returns Desktop for standard browser', () => {
      expect(UserAgentService.getDeviceType('Mozilla/5.0 Windows NT Chrome')).toBe('Desktop')
    })
  })

  // ── getBrowser ────────────────────────────────────────────────────────
  describe('getBrowser', () => {
    it.each([
      ['Mozilla/5.0 Edg/120', 'Edge'],
      ['Mozilla/5.0 OPR/105', 'Opera'],
      ['Mozilla/5.0 Chrome/120', 'Chrome'],
      ['Mozilla/5.0 Safari/537', 'Safari'],
      ['Mozilla/5.0 Firefox/120', 'Firefox'],
      ['Mozilla/5.0 MSIE 11', 'IE'],
      ['PostmanRuntime/7', 'Postman'],
      ['UnknownBrowser/1.0', 'Unknown'],
    ])('identifies %s as %s', (ua, expected) => {
      expect(UserAgentService.getBrowser(ua)).toBe(expected)
    })
  })

  // ── generateDeviceFingerprint ─────────────────────────────────────────
  describe('generateDeviceFingerprint', () => {
    it('returns a 64-char hex SHA-256 hash', async () => {
      const fp = await UserAgentService.generateDeviceFingerprint('1.1.1.1', 'Mozilla/5.0', 'en-US')
      expect(fp).toMatch(/^[a-f0-9]{64}$/)
    })

    it('is deterministic for same inputs', async () => {
      const a = await UserAgentService.generateDeviceFingerprint('1.1.1.1', 'ua', 'en')
      const b = await UserAgentService.generateDeviceFingerprint('1.1.1.1', 'ua', 'en')
      expect(a).toBe(b)
    })

    it('differs for different inputs', async () => {
      const a = await UserAgentService.generateDeviceFingerprint('1.1.1.1', 'ua', 'en')
      const b = await UserAgentService.generateDeviceFingerprint('2.2.2.2', 'ua', 'en')
      expect(a).not.toBe(b)
    })
  })

  // ── getGeoLocationFromMaxMind ─────────────────────────────────────────
  describe('getGeoLocationFromMaxMind', () => {
    it('returns cached geo when redis key exists', async () => {
      const geo = { city: 'Istanbul', state: 'IST', country: 'Turkey' }
      redisMock.get.mockResolvedValueOnce(JSON.stringify(geo))
      const result = await UserAgentService.getGeoLocationFromMaxMind('1.2.3.4')
      expect(result.city).toBe('Istanbul')
      expect(axiosMock.get).not.toHaveBeenCalled()
    })

    it('throws when MaxMind credentials are missing', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      delete process.env.MAXMIND_ACCOUNT_ID
      delete process.env.MAXMIND_API_KEY
      await expect(
        UserAgentService.getGeoLocationFromMaxMind('1.2.3.4')
      ).rejects.toThrow('MaxMind credentials are missing')
    })
  })

  // ── getGeoLocation (with fallback) ────────────────────────────────────
  describe('getGeoLocation', () => {
    it('falls back to ip-api when MaxMind not configured', async () => {
      redisMock.get.mockResolvedValue(null)
      redisMock.set.mockResolvedValue('OK')
      delete process.env.MAXMIND_ACCOUNT_ID
      delete process.env.MAXMIND_API_KEY
      axiosMock.get.mockResolvedValueOnce({
        data: { status: 'success', city: 'Ankara', country: 'Turkey', countryCode: 'TR', regionName: 'Ankara', lat: 39.9, lon: 32.8 },
      })

      const result = await UserAgentService.getGeoLocation('5.5.5.5')
      expect(result.city).toBe('Ankara')
    })
  })
})
