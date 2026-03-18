import axios from 'axios'
import MicrosoftService from '@/services/AuthService/SSOService/MicrosoftService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('MicrosoftService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    MicrosoftService.MICROSOFT_CLIENT_ID = 'test-microsoft-client-id'
    MicrosoftService.MICROSOFT_CLIENT_SECRET = 'test-microsoft-client-secret'
    MicrosoftService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Microsoft authorization endpoint', () => {
      const url = MicrosoftService.generateAuthUrl()
      expect(url).toMatch(
        /^https:\/\/login\.microsoftonline\.com\/common\/oauth2\/v2\.0\/authorize/
      )
    })

    it('includes client_id in query params', () => {
      const url = MicrosoftService.generateAuthUrl()
      expect(url).toContain('client_id=test-microsoft-client-id')
    })

    it('includes response_type=code', () => {
      const url = MicrosoftService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })

    it('includes profile and email scopes', () => {
      const url = MicrosoftService.generateAuthUrl()
      const params = new URLSearchParams(url.split('?')[1])
      const scope = params.get('scope') ?? ''
      expect(scope).toContain('profile')
      expect(scope).toContain('email')
    })

    it('includes prompt=consent to force the consent screen', () => {
      const url = MicrosoftService.generateAuthUrl()
      expect(url).toContain('prompt=consent')
    })

    it('includes redirect_uri pointing to the Microsoft callback path', () => {
      const url = MicrosoftService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(decodeURIComponent(url)).toContain('/api/v1/sso/callback/microsoft')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token and refresh_token from a successful response', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: {
          access_token: 'ms-access-token',
          refresh_token: 'ms-refresh-token',
        },
      })

      const result = await MicrosoftService.getTokens('auth-code-xyz')
      expect(result.access_token).toBe('ms-access-token')
      expect(result.refresh_token).toBe('ms-refresh-token')
    })

    it('posts to the Microsoft token URL with form-encoded content', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'ms-at', refresh_token: 'ms-rt' },
      })

      await MicrosoftService.getTokens('code')

      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        expect.any(URLSearchParams),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )
    })

    it('includes grant_type=authorization_code in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'ms-at', refresh_token: 'ms-rt' },
      })

      await MicrosoftService.getTokens('code')

      const callArgs = axiosMock.post.mock.calls[0]
      const params = callArgs[1] as URLSearchParams
      expect(params.get('grant_type')).toBe('authorization_code')
    })

    it('includes the code in the request body', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'ms-at', refresh_token: 'ms-rt' },
      })

      await MicrosoftService.getTokens('my-auth-code')

      const callArgs = axiosMock.post.mock.calls[0]
      const params = callArgs[1] as URLSearchParams
      expect(params.get('code')).toBe('my-auth-code')
    })

    it('throws when token exchange fails with a network error', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(MicrosoftService.getTokens('bad-code')).rejects.toThrow('Network error')
    })

    it('throws when Microsoft returns an HTTP 400 error', async () => {
      axiosMock.post.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 400'), { response: { status: 400 } })
      )

      await expect(MicrosoftService.getTokens('invalid-code')).rejects.toThrow()
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps Microsoft Graph response to SSOProfileResponse using mail field', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'ms-user-id-99',
          mail: 'user@outlook.com',
          displayName: 'Microsoft User',
          photo: null,
        },
      })

      const profile = await MicrosoftService.getUserInfo('ms-access-token')

      expect(profile.sub).toBe('ms-user-id-99')
      expect(profile.email).toBe('user@outlook.com')
      expect(profile.name).toBe('Microsoft User')
      expect(profile.provider).toBe('microsoft')
    })

    it('falls back to userPrincipalName when mail is not set', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'ms-upn-user',
          mail: null,
          userPrincipalName: 'upn@tenant.onmicrosoft.com',
          displayName: 'UPN User',
          photo: null,
        },
      })

      const profile = await MicrosoftService.getUserInfo('ms-access-token')
      expect(profile.email).toBe('upn@tenant.onmicrosoft.com')
    })

    it('includes photo URL when photo is present', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'ms-photo-user',
          mail: 'photo@outlook.com',
          displayName: 'Photo User',
          photo: 'some-photo-data',
        },
      })

      const profile = await MicrosoftService.getUserInfo('ms-access-token')
      expect(profile.picture).toBe(
        'https://graph.microsoft.com/v1.0/users/ms-photo-user/photo/$value'
      )
    })

    it('returns undefined picture when photo is null', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'ms-no-photo',
          mail: 'nophoto@outlook.com',
          displayName: 'No Photo',
          photo: null,
        },
      })

      const profile = await MicrosoftService.getUserInfo('ms-access-token')
      expect(profile.picture).toBeUndefined()
    })

    it('sends the Bearer token in the Authorization header', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'id', mail: 'e@e.com', displayName: 'N', photo: null },
      })

      await MicrosoftService.getUserInfo('my-ms-token')

      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://graph.microsoft.com/v1.0/me',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-ms-token' }),
        })
      )
    })

    it('throws when the user info request fails with an HTTP 401 error', async () => {
      axiosMock.get.mockRejectedValueOnce(
        Object.assign(new Error('Request failed with status code 401'), { response: { status: 401 } })
      )

      await expect(MicrosoftService.getUserInfo('expired-token')).rejects.toThrow()
    })

    it('throws when axios.get throws a network error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('Socket hang up'))

      await expect(MicrosoftService.getUserInfo('token')).rejects.toThrow('Socket hang up')
    })
  })
})
