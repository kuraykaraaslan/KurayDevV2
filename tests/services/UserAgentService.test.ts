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

    it('calls MaxMind API and caches result when credentials are present', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      process.env.MAXMIND_ACCOUNT_ID = 'acct-123'
      process.env.MAXMIND_API_KEY = 'key-abc'
      axiosMock.get.mockResolvedValueOnce({
        data: {
          city: { names: { en: 'London' } },
          subdivisions: [{ names: { en: 'England' } }],
          country: { names: { en: 'United Kingdom' }, iso_code: 'GB' },
          location: { latitude: 51.5, longitude: -0.1 },
        },
      })

      const result = await UserAgentService.getGeoLocationFromMaxMind('8.8.8.8')

      expect(result.city).toBe('London')
      expect(result.country).toBe('United Kingdom')
      expect(result.countryCode).toBe('GB')
      expect(result.latitude).toBe(51.5)
      expect(redisMock.set).toHaveBeenCalledWith('geo:location:8.8.8.8', expect.any(String), 'EX', 86400)

      delete process.env.MAXMIND_ACCOUNT_ID
      delete process.env.MAXMIND_API_KEY
    })

    it('returns null fields when MaxMind API call fails', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      process.env.MAXMIND_ACCOUNT_ID = 'acct-123'
      process.env.MAXMIND_API_KEY = 'key-abc'
      axiosMock.get.mockRejectedValueOnce(new Error('Network error'))

      const result = await UserAgentService.getGeoLocationFromMaxMind('8.8.8.8')
      expect(result).toEqual({ city: null, state: null, country: null })

      delete process.env.MAXMIND_ACCOUNT_ID
      delete process.env.MAXMIND_API_KEY
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

    it('falls back to ip-api when MaxMind returns no country', async () => {
      process.env.MAXMIND_ACCOUNT_ID = 'acct-123'
      process.env.MAXMIND_API_KEY = 'key-abc'
      // MaxMind cache miss, then ip-api cache miss
      redisMock.get.mockResolvedValueOnce(null).mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      axiosMock.get
        // MaxMind returns data but no country
        .mockResolvedValueOnce({ data: { city: null, subdivisions: [], country: null, location: null } })
        // ip-api returns full data
        .mockResolvedValueOnce({
          data: { status: 'success', city: 'Paris', country: 'France', countryCode: 'FR', regionName: 'Ile-de-France', lat: 48.8, lon: 2.3 },
        })

      const result = await UserAgentService.getGeoLocation('9.9.9.9')
      expect(result.city).toBe('Paris')

      delete process.env.MAXMIND_ACCOUNT_ID
      delete process.env.MAXMIND_API_KEY
    })
  })

  // ── parseRequest ──────────────────────────────────────────────────────
  describe('parseRequest', () => {
    it('extracts userAgent and IP from request headers', async () => {
      const geoSpy = jest
        .spyOn(UserAgentService, 'getGeoLocation')
        .mockResolvedValue({ city: 'NYC', state: 'NY', country: 'USA', countryCode: 'US', latitude: 40.7, longitude: -74.0 })

      const mockRequest = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'user-agent': 'Mozilla/5.0 Chrome/120',
              'x-forwarded-for': '203.0.113.1, 10.0.0.1',
            }
            return headers[name] ?? null
          },
        },
      } as any

      const result = await UserAgentService.parseRequest(mockRequest)

      expect(result.browser).toBe('Chrome')
      expect(result.ip).toBe('203.0.113.1')
      expect(result.city).toBe('NYC')

      geoSpy.mockRestore()
    })

    it('uses x-real-ip when x-forwarded-for is absent', async () => {
      const geoSpy = jest
        .spyOn(UserAgentService, 'getGeoLocation')
        .mockResolvedValue({ city: 'Berlin', state: null, country: 'Germany', countryCode: 'DE', latitude: 52.5, longitude: 13.4 })

      const mockRequest = {
        headers: {
          get: (name: string) => {
            const headers: Record<string, string> = {
              'user-agent': 'Mozilla/5.0 Firefox/120',
              'x-real-ip': '198.51.100.1',
            }
            return headers[name] ?? null
          },
        },
      } as any

      const result = await UserAgentService.parseRequest(mockRequest)

      expect(result.browser).toBe('Firefox')
      expect(result.ip).toBe('198.51.100.1')

      geoSpy.mockRestore()
    })
  })

  // ── parse boundary/fallback/determinism ───────────────────────────────
  describe('parse boundary/fallback/determinism', () => {
    it('gracefully handles nullish input without throwing', async () => {
      await expect(UserAgentService.parse(undefined, undefined)).resolves.toEqual(
        expect.objectContaining({
          os: 'Unknown',
          device: 'Desktop',
          city: 'Unknown',
          country: 'Unknown',
          ip: 'Unknown',
          browser: 'Unknown',
          deviceFingerprint: null,
        })
      )
    })

    it('returns deterministic output for same long input', async () => {
      const geoSpy = jest
        .spyOn(UserAgentService, 'getGeoLocation')
        .mockResolvedValue({ city: 'Berlin', state: 'Berlin', country: 'Germany', countryCode: 'DE', latitude: 1, longitude: 1 })

      const longUA = `Mozilla/5.0 ${'A'.repeat(4000)} Chrome/120.0`
      const first = await UserAgentService.parse(longUA, '9.9.9.9')
      const second = await UserAgentService.parse(longUA, '9.9.9.9')

      expect(first).toEqual(second)
      expect(first.browser).toBe('Chrome')
      expect(first.os).toBe('Unknown')

      geoSpy.mockRestore()
    })
  })
})
