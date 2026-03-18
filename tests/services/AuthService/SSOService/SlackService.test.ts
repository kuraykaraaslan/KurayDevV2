import axios from 'axios'
import SlackService from '@/services/AuthService/SSOService/SlackService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('SlackService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    SlackService.CLIENT_ID = 'test-slack-client-id'
    SlackService.CLIENT_SECRET = 'test-slack-client-secret'
    SlackService.CALLBACK_URL = 'https://localhost/api/auth/callback/slack'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to the Slack authorization endpoint', () => {
      const url = SlackService.generateAuthUrl('state-abc')
      expect(url).toMatch(/^https:\/\/slack\.com\/oauth\/v2\/authorize/)
    })

    it('includes client_id in query params', () => {
      const url = SlackService.generateAuthUrl('state-abc')
      expect(url).toContain('client_id=test-slack-client-id')
    })

    it('includes identity.basic and identity.email scopes', () => {
      const url = SlackService.generateAuthUrl('state-abc')
      const params = new URLSearchParams(url.split('?')[1])
      const scope = params.get('scope') ?? ''
      expect(scope).toContain('identity.basic')
      expect(scope).toContain('identity.email')
    })

    it('includes the provided state parameter', () => {
      const url = SlackService.generateAuthUrl('my-csrf-state')
      const params = new URLSearchParams(url.split('?')[1])
      expect(params.get('state')).toBe('my-csrf-state')
    })

    it('includes redirect_uri pointing to the Slack callback URL', () => {
      const url = SlackService.generateAuthUrl('state')
      expect(url).toContain('redirect_uri=')
      expect(decodeURIComponent(url)).toContain('/api/auth/callback/slack')
    })
  })

  // ── getAccessToken ───────────────────────────────────────────────────
  describe('getAccessToken', () => {
    it('returns the authed_user access_token on success', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: {
          ok: true,
          authed_user: { access_token: 'slack-user-access-token' },
        },
      })

      const token = await SlackService.getAccessToken('slack-code')
      expect(token).toBe('slack-user-access-token')
    })

    it('posts to the Slack token URL with form-encoded content', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: true, authed_user: { access_token: 'token' } },
      })

      await SlackService.getAccessToken('code')

      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://slack.com/api/oauth.v2.access',
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/x-www-form-urlencoded',
          }),
        })
      )
    })

    it('throws when Slack returns ok=false with an error field', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: false, error: 'invalid_code' },
      })

      await expect(SlackService.getAccessToken('bad-code')).rejects.toThrow('invalid_code')
    })

    it('throws with generic message when ok=false and no error field', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: false },
      })

      await expect(SlackService.getAccessToken('bad-code')).rejects.toThrow(
        'Slack token fetch failed'
      )
    })

    it('throws on network-level failure', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))

      await expect(SlackService.getAccessToken('code')).rejects.toThrow('Network error')
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps Slack users.identity response to expected profile shape', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          user: {
            id: 'USLACK123',
            name: 'slack_user',
            email: 'user@slack.com',
            image_192: 'https://avatars.slack-edge.com/pic.jpg',
          },
        },
      })

      const profile = await SlackService.getUserInfo('slack-access-token')

      expect(profile.id).toBe('USLACK123')
      expect(profile.name).toBe('slack_user')
      expect(profile.email).toBe('user@slack.com')
      expect(profile.avatar).toBe('https://avatars.slack-edge.com/pic.jpg')
      expect(profile.provider).toBe('slack')
    })

    it('sends the Bearer token in the Authorization header', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          user: { id: 'U1', name: 'n', email: 'e@e.com', image_192: '' },
        },
      })

      await SlackService.getUserInfo('my-slack-token')

      expect(axiosMock.get).toHaveBeenCalledWith(
        'https://slack.com/api/users.identity',
        expect.objectContaining({
          headers: expect.objectContaining({ Authorization: 'Bearer my-slack-token' }),
        })
      )
    })

    it('throws when Slack returns ok=false with an error field', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { ok: false, error: 'not_authed' },
      })

      await expect(SlackService.getUserInfo('bad-token')).rejects.toThrow('not_authed')
    })

    it('throws with generic message when ok=false and no error field', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { ok: false },
      })

      await expect(SlackService.getUserInfo('bad-token')).rejects.toThrow(
        'Slack user info fetch failed'
      )
    })

    it('throws on network-level failure', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('ECONNREFUSED'))

      await expect(SlackService.getUserInfo('token')).rejects.toThrow('ECONNREFUSED')
    })
  })

  // ── authCallback ─────────────────────────────────────────────────────
  describe('authCallback', () => {
    it('returns user profile after exchanging code for token and fetching user info', async () => {
      // First call: getAccessToken
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: true, authed_user: { access_token: 'slack-at' } },
      })
      // Second call: getUserInfo
      axiosMock.get.mockResolvedValueOnce({
        data: {
          ok: true,
          user: {
            id: 'UABC',
            name: 'callback_user',
            email: 'callback@slack.com',
            image_192: 'https://pic.slack.com/img.jpg',
          },
        },
      })

      const profile = await SlackService.authCallback('slack-code')

      expect(profile.id).toBe('UABC')
      expect(profile.email).toBe('callback@slack.com')
      expect(profile.provider).toBe('slack')
    })

    it('throws when token exchange fails during authCallback', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: false, error: 'code_already_used' },
      })

      await expect(SlackService.authCallback('used-code')).rejects.toThrow('code_already_used')
    })

    it('throws when user info fetch fails during authCallback', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { ok: true, authed_user: { access_token: 'slack-at' } },
      })
      axiosMock.get.mockResolvedValueOnce({
        data: { ok: false, error: 'token_revoked' },
      })

      await expect(SlackService.authCallback('code')).rejects.toThrow('token_revoked')
    })
  })
})
