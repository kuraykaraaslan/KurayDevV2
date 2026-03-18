import SitemapService from '@/services/SitemapService'

// ── Mocks ────────────────────────────────────────────────────────────────────

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}))

// ── Imports after mocking ─────────────────────────────────────────────────────

import axios from 'axios'

const axiosMock = axios as jest.Mocked<typeof axios>

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SitemapService', () => {
  const originalEnv = process.env.NEXT_PUBLIC_BASE_URL

  beforeAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_BASE_URL = originalEnv
  })

  beforeEach(() => jest.clearAllMocks())

  // ── pingGoogleSitemap ──────────────────────────────────────────────────────
  describe('pingGoogleSitemap', () => {
    it('returns true when Google responds with a 2xx status', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      const result = await SitemapService.pingGoogleSitemap('blog')

      expect(result).toBe(true)
    })

    it('constructs the correct ping URL with the sitemap URL encoded', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      await SitemapService.pingGoogleSitemap('blog')

      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(calledUrl).toContain('https://www.google.com/ping')
      expect(calledUrl).toContain('sitemap=')
      expect(decodeURIComponent(calledUrl)).toContain('https://example.com')
    })

    it('includes the correct sitemap filename for the blog type', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      await SitemapService.pingGoogleSitemap('blog')

      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(decodeURIComponent(calledUrl)).toContain('blog/sitemap.xml')
    })

    it('includes the correct sitemap filename for the static type', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      await SitemapService.pingGoogleSitemap('static')

      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(decodeURIComponent(calledUrl)).toContain('sitemap-static.xml')
    })

    it('includes the correct sitemap filename for the projects type', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      await SitemapService.pingGoogleSitemap('projects')

      const calledUrl: string = axiosMock.get.mock.calls[0][0] as string
      expect(decodeURIComponent(calledUrl)).toContain('projects/sitemap.xml')
    })

    it('returns false when Google responds with a non-2xx status (e.g. 404)', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 404, data: '' })

      const result = await SitemapService.pingGoogleSitemap('blog')

      expect(result).toBe(false)
    })

    it('returns false when Google responds with a 5xx error', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 500, data: '' })

      const result = await SitemapService.pingGoogleSitemap('blog')

      expect(result).toBe(false)
    })

    it('returns false when the HTTP call throws a network error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Network Error'))

      const result = await SitemapService.pingGoogleSitemap('blog')

      expect(result).toBe(false)
    })

    it('uses validateStatus that accepts any response code', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 301, data: '' })

      // 301 is a redirect — validateStatus: () => true means axios won't throw
      // The service should still return false as 3xx is not 2xx
      const result = await SitemapService.pingGoogleSitemap('blog')
      expect(result).toBe(false)
    })

    it('calls axios.get with a validateStatus function', async () => {
      axiosMock.get.mockResolvedValueOnce({ status: 200, data: '' })

      await SitemapService.pingGoogleSitemap('static')

      const config = axiosMock.get.mock.calls[0][1]
      expect(typeof config?.validateStatus).toBe('function')
      // validateStatus should always return true (to prevent axios from throwing on any status)
      expect(config?.validateStatus!(200)).toBe(true)
      expect(config?.validateStatus!(500)).toBe(true)
    })
  })
})
