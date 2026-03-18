import axios from 'axios'
import TwitterService from '@/services/AuthService/SSOService/TwitterService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('TwitterService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    TwitterService.TWITTER_CLIENT_ID = 'test-twitter-client-id'
    TwitterService.TWITTER_CLIENT_SECRET = 'test-twitter-client-secret'
    TwitterService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Twitter authorize endpoint', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/twitter\.com\/i\/oauth2\/authorize/)
    })

    it('includes client_id in the query string', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('client_id=test-twitter-client-id')
    })

    it('includes response_type=code', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes the redirect_uri with the Twitter callback path', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('twitter')
    })

    it('includes PKCE code_challenge and code_challenge_method parameters', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('code_challenge=challenge')
      expect(url).toContain('code_challenge_method=plain')
    })

    it('includes required scopes', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('scope=')
      expect(decodeURIComponent(url)).toContain('tweet.read')
      expect(decodeURIComponent(url)).toContain('users.read')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token from Twitter token endpoint', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'twitter-access-token' },
      })

      const result = await TwitterService.getTokens('auth-code-twitter')
      expect(result.access_token).toBe('twitter-access-token')
    })

    it('posts to the Twitter token URL', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at' } })

      await TwitterService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://api.twitter.com/2/oauth2/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        })
      )
    })

    it('includes grant_type=authorization_code and code verifier in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at' } })

      await TwitterService.getTokens('my-twitter-code')
      const body: URLSearchParams = axiosMock.post.mock.calls[0][1] as URLSearchParams
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('my-twitter-code')
      expect(body.get('code_verifier')).toBe('challenge')
      expect(body.get('client_id')).toBe('test-twitter-client-id')
    })

    it('includes client_secret in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at' } })

      await TwitterService.getTokens('code')
      const body: URLSearchParams = axiosMock.post.mock.calls[0][1] as URLSearchParams
      expect(body.get('client_secret')).toBe('test-twitter-client-secret')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(TwitterService.getTokens('bad-code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps the Twitter user info response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'twitter-id-123',
          email: 'user@twitter.com',
          name: 'Twitter User',
          profile_image_url: 'https://pbs.twimg.com/profile_images/avatar.jpg',
        },
      })

      const profile = await TwitterService.getUserInfo('access-token-twitter')
      expect(profile.sub).toBe('twitter-id-123')
      expect(profile.email).toBe('user@twitter.com')
      expect(profile.name).toBe('Twitter User')
      expect(profile.picture).toBe('https://pbs.twimg.com/profile_images/avatar.jpg')
      expect(profile.provider).toBe('twitter')
    })

    it('sends Bearer authorization header to the user info endpoint', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'id', email: '', name: '', profile_image_url: '' },
      })

      await TwitterService.getUserInfo('my-twitter-token')
      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://api.twitter.com/2/users/me',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-twitter-token' }),
        })
      )
    })

    it('returns empty string for email when Twitter does not provide one', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'id-1', email: undefined, name: 'NoEmail', profile_image_url: '' },
      })

      const profile = await TwitterService.getUserInfo('tok')
      expect(profile.email).toBe('')
    })

    it('returns empty string for name and picture when not provided', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'id-2', email: 'a@b.com', name: undefined, profile_image_url: undefined },
      })

      const profile = await TwitterService.getUserInfo('tok')
      expect(profile.name).toBe('')
      expect(profile.picture).toBe('')
    })

    it('throws when the HTTP request fails', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('401 Unauthorized'))
      await expect(TwitterService.getUserInfo('bad-token')).rejects.toThrow('401 Unauthorized')
    })
  })
})
