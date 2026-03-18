import axios from 'axios'
import TikTokService from '@/services/AuthService/SSOService/TiktokService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('TikTokService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    TikTokService.TIKTOK_CLIENT_KEY = 'test-tiktok-client-key'
    TikTokService.TIKTOK_CLIENT_SECRET = 'test-tiktok-client-secret'
    TikTokService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the TikTok authorize endpoint', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/www\.tiktok\.com\/auth\/authorize/)
    })

    it('includes client_key in the query string', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('client_key=test-tiktok-client-key')
    })

    it('includes response_type=code', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes the redirect_uri with the TikTok callback path', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('tiktok')
    })

    it('includes scope in the query string', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('scope=')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token and refresh_token from TikTok token endpoint', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'tiktok-access-token', refresh_token: 'tiktok-refresh-token' },
      })

      const result = await TikTokService.getTokens('auth-code-tiktok')
      expect(result.access_token).toBe('tiktok-access-token')
      expect(result.refresh_token).toBe('tiktok-refresh-token')
    })

    it('posts to the TikTok token URL', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'at', refresh_token: 'rt' },
      })

      await TikTokService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/oauth/token/',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        })
      )
    })

    it('includes Accept: application/json header', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at', refresh_token: 'rt' } })

      await TikTokService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({ Accept: 'application/json' }),
        })
      )
    })

    it('includes grant_type=authorization_code and the code in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at', refresh_token: 'rt' } })

      await TikTokService.getTokens('my-code')
      const body: URLSearchParams = axiosMock.post.mock.calls[0][1] as URLSearchParams
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('my-code')
      expect(body.get('client_key')).toBe('test-tiktok-client-key')
      expect(body.get('client_secret')).toBe('test-tiktok-client-secret')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(TikTokService.getTokens('bad-code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps the TikTok user info response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          data: {
            open_id: 'tiktok-open-id-99',
            email: 'user@tiktok.com',
            nickname: 'CoolCreator',
            avatar: 'https://tiktok.com/avatar.jpg',
          },
        },
      })

      const profile = await TikTokService.getUserInfo('access-token-tiktok')
      expect(profile.sub).toBe('tiktok-open-id-99')
      expect(profile.email).toBe('user@tiktok.com')
      expect(profile.name).toBe('CoolCreator')
      expect(profile.picture).toBe('https://tiktok.com/avatar.jpg')
      expect(profile.provider).toBe('tiktok')
    })

    it('sends Bearer authorization header to the user info endpoint', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { data: { open_id: 'id', email: '', nickname: '', avatar: '' } },
      })

      await TikTokService.getUserInfo('my-tiktok-token')
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://open.tiktokapis.com/v2/user/info/',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-tiktok-token' }),
        })
      )
    })

    it('returns empty string for email when TikTok does not provide one', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { data: { open_id: 'id-1', email: undefined, nickname: 'NoEmail', avatar: '' } },
      })

      const profile = await TikTokService.getUserInfo('tok')
      expect(profile.email).toBe('')
    })

    it('returns empty string for nickname and avatar when not provided', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { data: { open_id: 'id-2', email: 'a@b.com', nickname: undefined, avatar: undefined } },
      })

      const profile = await TikTokService.getUserInfo('tok')
      expect(profile.name).toBe('')
      expect(profile.picture).toBe('')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('403 Forbidden'))
      await expect(TikTokService.getUserInfo('bad-token')).rejects.toThrow('403 Forbidden')
    })
  })
})
