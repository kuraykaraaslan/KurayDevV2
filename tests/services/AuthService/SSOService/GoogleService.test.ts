import axios from 'axios'
import GoogleService from '@/services/AuthService/SSOService/GoogleService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('GoogleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // generateAuthUrl reads process.env directly; static props used in getTokens
    process.env.GOOGLE_CLIENT_ID = 'test-google-client-id'
    process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    process.env.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
    GoogleService.GOOGLE_CLIENT_ID = 'test-google-client-id'
    GoogleService.GOOGLE_CLIENT_SECRET = 'test-google-client-secret'
    GoogleService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL starting with Google auth endpoint', () => {
      const url = GoogleService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/accounts\.google\.com\/o\/oauth2\/v2\/auth/)
    })

    it('includes client_id in query params', () => {
      const url = GoogleService.generateAuthUrl()
      expect(url).toContain('client_id=test-google-client-id')
    })

    it('includes response_type=code', () => {
      const url = GoogleService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes profile and email scopes', () => {
      const url = GoogleService.generateAuthUrl()
      const params = new URLSearchParams(url.split('?')[1])
      expect(params.get('scope')).toContain('profile')
      expect(params.get('scope')).toContain('email')
    })

    it('includes redirect_uri pointing to callback path', () => {
      const url = GoogleService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(decodeURIComponent(url)).toContain('/api/auth/callback/google')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token and refresh_token from provider response', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'g-access', refresh_token: 'g-refresh' },
      })

      const result = await GoogleService.getTokens('auth-code-123')
      expect(result.access_token).toBe('g-access')
      expect(result.refresh_token).toBe('g-refresh')
    })

    it('posts to correct Google token endpoint', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at', refresh_token: 'rt' } })
      await GoogleService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://oauth2.googleapis.com/token',
        expect.any(URLSearchParams),
        expect.any(Object)
      )
    })

    it('throws when axios.post fails', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(GoogleService.getTokens('bad-code')).rejects.toThrow()
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps Google userinfo response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          sub: 'google-sub-123',
          email: 'user@gmail.com',
          name: 'Google User',
          picture: 'https://picture.url',
        },
      })

      const profile = await GoogleService.getUserInfo('access-token')
      expect(profile.email).toBe('user@gmail.com')
      expect(profile.sub).toBe('google-sub-123')
      expect(profile.name).toBe('Google User')
      expect(profile.provider).toBe('google')
    })

    it('throws when axios.get fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Unauthorized'))
      await expect(GoogleService.getUserInfo('bad-token')).rejects.toThrow()
    })
  })
})
