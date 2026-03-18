import axios from 'axios'
import LinkedInService from '@/services/AuthService/SSOService/LinkedInService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('LinkedInService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    LinkedInService.LINKEDIN_CLIENT_ID = 'test-linkedin-client-id'
    LinkedInService.LINKEDIN_CLIENT_SECRET = 'test-linkedin-client-secret'
    LinkedInService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the LinkedIn authorization endpoint', () => {
      const url = LinkedInService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/www\.linkedin\.com\/oauth\/v2\/authorization/)
    })

    it('includes client_id in query params', () => {
      const url = LinkedInService.generateAuthUrl()
      expect(url).toContain('client_id=test-linkedin-client-id')
    })

    it('includes response_type=code', () => {
      const url = LinkedInService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes openid, profile and email scopes', () => {
      const url = LinkedInService.generateAuthUrl()
      const params = new URLSearchParams(url.split('?')[1])
      const scope = params.get('scope') ?? ''
      expect(scope).toContain('openid')
      expect(scope).toContain('profile')
      expect(scope).toContain('email')
    })

    it('includes redirect_uri pointing to LinkedIn callback path', () => {
      const url = LinkedInService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(decodeURIComponent(url)).toContain('/api/v1/sso/callback/linkedin')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token from a successful LinkedIn token response', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'li-access-token' },
      })

      const result = await LinkedInService.getTokens('auth-code-123')
      expect(result.access_token).toBe('li-access-token')
    })

    it('posts to the LinkedIn token URL with form-encoded content', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'li-at' } })

      await LinkedInService.getTokens('code')

      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://www.linkedin.com/oauth/v2/accessToken',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )
    })

    it('includes grant_type=authorization_code in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'li-at' } })

      await LinkedInService.getTokens('code')

      const callArgs = axiosMock.post.mock.calls[0]
      const params = callArgs[1] as URLSearchParams
      expect(params.get('grant_type')).toBe('authorization_code')
    })

    it('throws when token exchange fails due to a network error', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(LinkedInService.getTokens('bad-code')).rejects.toThrow('Network error')
    })

    it('throws when LinkedIn returns an HTTP error response', async () => {
      axiosMock.post.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } })
      )

      await expect(LinkedInService.getTokens('invalid-code')).rejects.toThrow()
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps LinkedIn userinfo response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          sub: 'li-user-sub-42',
          email: 'user@linkedin.com',
          name: 'LinkedIn User',
          picture: 'https://media.licdn.com/picture.jpg',
        },
      })

      const profile = await LinkedInService.getUserInfo('li-access-token')

      expect(profile.sub).toBe('li-user-sub-42')
      expect(profile.email).toBe('user@linkedin.com')
      expect(profile.name).toBe('LinkedIn User')
      expect(profile.picture).toBe('https://media.licdn.com/picture.jpg')
      expect(profile.provider).toBe('linkedin')
    })

    it('sends the Bearer token in the Authorization header', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { sub: 'sub', email: 'e@e.com', name: 'N', picture: '' },
      })

      await LinkedInService.getUserInfo('my-bearer-token')

      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://api.linkedin.com/v2/userinfo',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-bearer-token' }),
        })
      )
    })

    it('throws when the user info request fails with an HTTP error', async () => {
      axiosMock.get.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 401'), { response: { status: 401 } })
      )

      await expect(LinkedInService.getUserInfo('expired-token')).rejects.toThrow()
    })

    it('throws when axios.get throws a network error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(LinkedInService.getUserInfo('token')).rejects.toThrow('ECONNREFUSED')
    })
  })
})
