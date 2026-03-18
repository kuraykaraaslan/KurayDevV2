import axios from 'axios'
import AutodeskService from '@/services/AuthService/SSOService/AutodeskService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('AutodeskService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AutodeskService.AUTODESK_CLIENT_ID = 'test-autodesk-client-id'
    AutodeskService.AUTODESK_CLIENT_SECRET = 'test-autodesk-client-secret'
    AutodeskService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Autodesk authorize endpoint', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/developer\.api\.autodesk\.com\/authentication\/v2\/authorize/)
    })

    it('includes client_id in the query string', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('client_id=test-autodesk-client-id')
    })

    it('includes response_type=code', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes the redirect_uri with the callback path', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('autodesk')
    })

    it('includes required scopes in the query string', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('scope=')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token and refresh_token from Autodesk token endpoint', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'autodesk-access-token', refresh_token: 'autodesk-refresh-token' },
      })

      const result = await AutodeskService.getTokens('auth-code-abc')
      expect(result.access_token).toBe('autodesk-access-token')
      expect(result.refresh_token).toBe('autodesk-refresh-token')
    })

    it('posts to the Autodesk token URL', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'at', refresh_token: 'rt' },
      })

      await AutodeskService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://developer.api.autodesk.com/authentication/v2/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        })
      )
    })

    it('includes grant_type=authorization_code and the code in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at', refresh_token: 'rt' } })

      await AutodeskService.getTokens('my-code')
      const body: URLSearchParams = axiosMock.post.mock.calls[0][1] as URLSearchParams
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('my-code')
      expect(body.get('client_id')).toBe('test-autodesk-client-id')
      expect(body.get('client_secret')).toBe('test-autodesk-client-secret')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(AutodeskService.getTokens('bad-code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps the Autodesk user profile response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          userId: 'autodesk-user-42',
          emailId: 'dev@autodesk.com',
          firstName: 'John',
          lastName: 'Doe',
          profileImages: { size48: 'https://cdn.autodesk.com/avatar.png' },
        },
      })

      const profile = await AutodeskService.getUserInfo('access-token-xyz')
      expect(profile.sub).toBe('autodesk-user-42')
      expect(profile.email).toBe('dev@autodesk.com')
      expect(profile.name).toBe('John Doe')
      expect(profile.picture).toBe('https://cdn.autodesk.com/avatar.png')
      expect(profile.provider).toBe('autodesk')
    })

    it('sends Bearer authorization header', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { userId: 'u1', emailId: 'e@a.com', firstName: 'A', lastName: 'B', profileImages: null },
      })

      await AutodeskService.getUserInfo('my-token')
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://developer.api.autodesk.com/userprofile/v1/users/@me',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-token' }),
        })
      )
    })

    it('returns null picture when profileImages is null', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { userId: 'u2', emailId: 'e@b.com', firstName: 'Jane', lastName: 'Smith', profileImages: null },
      })

      const profile = await AutodeskService.getUserInfo('tok')
      expect(profile.picture).toBeNull()
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('401 Unauthorized'))
      await expect(AutodeskService.getUserInfo('bad-token')).rejects.toThrow('401 Unauthorized')
    })
  })
})
