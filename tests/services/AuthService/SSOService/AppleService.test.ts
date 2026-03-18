import axios from 'axios'
import jwt from 'jsonwebtoken'
import AppleService from '@/services/AuthService/SSOService/AppleService'

jest.mock('axios')
jest.mock('jsonwebtoken')

const axiosMock = axios as jest.Mocked<typeof axios>
const jwtMock = jwt as jest.Mocked<typeof jwt>

describe('AppleService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    AppleService.APPLE_CLIENT_ID = 'test-apple-client-id'
    AppleService.APPLE_TEAM_ID = 'test-team-id'
    AppleService.APPLE_KEY_ID = 'test-key-id'
    AppleService.APPLE_PRIVATE_KEY = '-----BEGIN EC PRIVATE KEY-----\ntest\n-----END EC PRIVATE KEY-----'
    AppleService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  afterAll(() => {
    jest.restoreAllMocks()
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Apple authorize endpoint', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/appleid\.apple\.com\/auth\/authorize/)
    })

    it('includes client_id in the query string', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('client_id=test-apple-client-id')
    })

    it('includes response_type=code', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes the redirect_uri with the callback path', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('apple')
    })

    it('includes scope=profile+email', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('scope=')
      expect(url).toContain('email')
    })
  })

  // ── generateClientSecret ─────────────────────────────────────────────
  describe('generateClientSecret', () => {
    it('returns the signed JWT string from jwt.sign', () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('signed-client-secret-jwt')
      const secret = AppleService.generateClientSecret()
      expect(secret).toBe('signed-client-secret-jwt')
    })

    it('calls jwt.sign with ES256 algorithm and the configured keyid', () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('jwt-token')
      AppleService.generateClientSecret()
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'test-team-id',
          aud: 'https://appleid.apple.com',
          sub: 'test-apple-client-id',
        }),
        AppleService.APPLE_PRIVATE_KEY,
        expect.objectContaining({ algorithm: 'ES256', keyid: 'test-key-id' })
      )
    })

    it('includes iat and exp in the JWT payload', () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('jwt')
      AppleService.generateClientSecret()
      const payload = (jwtMock.sign as jest.Mock).mock.calls[0][0] as Record<string, number>
      expect(payload.iat).toBeDefined()
      expect(payload.exp).toBeGreaterThan(payload.iat)
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token and refresh_token from Apple token endpoint', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('client-secret')
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'apple-access-token', refresh_token: 'apple-refresh-token' },
      })

      const result = await AppleService.getTokens('auth-code-123')
      expect(result.access_token).toBe('apple-access-token')
      expect(result.refresh_token).toBe('apple-refresh-token')
    })

    it('posts to the Apple token URL with correct content-type header', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('client-secret')
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'at', refresh_token: 'rt' },
      })

      await AppleService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://appleid.apple.com/auth/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({ 'Content-Type': 'application/x-www-form-urlencoded' }),
        })
      )
    })

    it('includes grant_type=authorization_code in the request body', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('client-secret')
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at', refresh_token: 'rt' } })

      await AppleService.getTokens('my-code')
      const body: URLSearchParams = axiosMock.post.mock.calls[0][1] as URLSearchParams
      expect(body.get('grant_type')).toBe('authorization_code')
      expect(body.get('code')).toBe('my-code')
    })

    it('throws when the HTTP request fails', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValueOnce('client-secret')
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(AppleService.getTokens('bad-code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('decodes the id token and returns email and sub', async () => {
      ;(jwtMock.decode as jest.Mock).mockReturnValueOnce({
        email: 'user@apple.com',
        sub: 'apple-unique-user-id',
      })

      const profile = await AppleService.getUserInfo('apple-id-token')
      expect(profile.email).toBe('user@apple.com')
      expect(profile.sub).toBe('apple-unique-user-id')
    })

    it('sets provider to "apple"', async () => {
      ;(jwtMock.decode as jest.Mock).mockReturnValueOnce({ email: 'a@b.com', sub: 'id-123' })
      const profile = await AppleService.getUserInfo('some-token')
      expect(profile.provider).toBe('apple')
    })

    it('calls jwt.decode with the provided access token', async () => {
      ;(jwtMock.decode as jest.Mock).mockReturnValueOnce({ email: 'x@y.com', sub: 'xyz' })
      await AppleService.getUserInfo('token-to-decode')
      expect(jwtMock.decode).toHaveBeenCalledWith('token-to-decode')
    })

    it('does not make any HTTP GET call (decodes locally)', async () => {
      ;(jwtMock.decode as jest.Mock).mockReturnValueOnce({ email: 'a@b.com', sub: 'sub' })
      await AppleService.getUserInfo('tok')
      expect(axiosMock.get).not.toHaveBeenCalled()
    })
  })
})
