import axios from 'axios'
import FacebookService from '@/services/AuthService/SSOService/FacebookService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('FacebookService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    FacebookService.META_CLIENT_ID = 'test-meta-client-id'
    FacebookService.META_CLIENT_SECRET = 'test-meta-client-secret'
    FacebookService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Facebook/Meta authorization endpoint', () => {
      const url = FacebookService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/www\.facebook\.com\/v17\.0\/dialog\/oauth/)
    })

    it('includes client_id in query params', () => {
      const url = FacebookService.generateAuthUrl()
      expect(url).toContain('client_id=test-meta-client-id')
    })

    it('includes response_type=code', () => {
      const url = FacebookService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes email and public_profile scopes', () => {
      const url = FacebookService.generateAuthUrl()
      const params = new URLSearchParams(url.split('?')[1])
      const scope = params.get('scope') ?? ''
      expect(scope).toContain('email')
      expect(scope).toContain('public_profile')
    })

    it('includes redirect_uri pointing to the Facebook callback path', () => {
      const url = FacebookService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(decodeURIComponent(url)).toContain('/api/auth/callback/facebook')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token from a successful Facebook token response', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { access_token: 'fb-access-token' },
      })

      const result = await FacebookService.getTokens('fb-auth-code')
      expect(result.access_token).toBe('fb-access-token')
    })

    it('uses HTTP GET (not POST) to the Facebook token URL', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { access_token: 'fb-at' } })

      await FacebookService.getTokens('code')

      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://graph.facebook.com/v17.0/oauth/access_token',
        expect.objectContaining({ params: expect.any(Object) })
      )
      expect(axiosMock.post).not.toHaveBeenCalled()
    })

    it('passes client credentials and code as query params', async () => {
      axiosMock.get.mockResolvedValueOnce({ data: { access_token: 'fb-at' } })

      await FacebookService.getTokens('my-code')

      const callArgs = axiosMock.get.mock.calls[0]
      const params = callArgs[1].params
      expect(params.client_id).toBe('test-meta-client-id')
      expect(params.client_secret).toBe('test-meta-client-secret')
      expect(params.code).toBe('my-code')
    })

    it('throws when the token exchange fails with a network error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Connection refused'))

      await expect(FacebookService.getTokens('bad-code')).rejects.toThrow('Connection refused')
    })

    it('throws when Facebook returns an HTTP error response', async () => {
      axiosMock.get.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } })
      )

      await expect(FacebookService.getTokens('invalid-code')).rejects.toThrow()
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps Facebook Graph API response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'fb-user-id-123',
          name: 'Facebook User',
          email: 'user@facebook.com',
          picture: { data: { url: 'https://graph.facebook.com/picture.jpg' } },
        },
      })

      const profile = await FacebookService.getUserInfo('fb-access-token')

      expect(profile.sub).toBe('fb-user-id-123')
      expect(profile.email).toBe('user@facebook.com')
      expect(profile.name).toBe('Facebook User')
      expect(profile.picture).toBe('https://graph.facebook.com/picture.jpg')
      expect(profile.provider).toBe('facebook')
    })

    it('returns empty string for email when not provided by Facebook', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'fb-no-email',
          name: 'No Email User',
          email: undefined,
          picture: { data: { url: '' } },
        },
      })

      const profile = await FacebookService.getUserInfo('fb-access-token')
      expect(profile.email).toBe('')
    })

    it('returns empty string for picture when no picture data URL is provided', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'fb-no-pic',
          name: 'No Pic',
          email: 'nopic@example.com',
          picture: { data: { url: '' } },
        },
      })

      const profile = await FacebookService.getUserInfo('fb-access-token')
      expect(profile.picture).toBe('')
    })

    it('requests specific fields (id, name, email, picture) from the Graph API', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'i', name: 'N', email: 'e@e.com', picture: { data: { url: '' } } },
      })

      await FacebookService.getUserInfo('fb-access-token')

      const callArgs = axiosMock.get.mock.calls[0]
      const params = callArgs[1].params
      expect(params.fields).toContain('id')
      expect(params.fields).toContain('name')
      expect(params.fields).toContain('email')
      expect(params.fields).toContain('picture')
    })

    it('passes access_token as a query param to the Graph API', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'i', name: 'N', email: 'e@e.com', picture: { data: { url: '' } } },
      })

      await FacebookService.getUserInfo('bearer-fb-token')

      const callArgs = axiosMock.get.mock.calls[0]
      expect(callArgs[1].params.access_token).toBe('bearer-fb-token')
    })

    it('throws when the user info request fails with an HTTP error', async () => {
      axiosMock.get.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 403'), { response: { status: 403 } })
      )

      await expect(FacebookService.getUserInfo('bad-token')).rejects.toThrow()
    })

    it('throws when axios.get throws a network error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Network timeout'))

      await expect(FacebookService.getUserInfo('token')).rejects.toThrow('Network timeout')
    })
  })
})
