import axios from 'axios'
import GithubService from '@/services/AuthService/SSOService/GithubService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

describe('GithubService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Static properties are set at class load time; reassign for tests
    GithubService.GITHUB_CLIENT_ID = 'test-github-client-id'
    GithubService.GITHUB_CLIENT_SECRET = 'test-github-client-secret'
    GithubService.NEXT_PUBLIC_APPLICATION_HOST = 'https://localhost'
  })

  // ── generateAuthUrl ──────────────────────────────────────────────────
  describe('generateAuthUrl', () => {
    it('returns a URL pointing to GitHub authorize endpoint', () => {
      const url = GithubService.generateAuthUrl()
      expect(url).toMatch(/^https:\/\/github\.com\/login\/oauth\/authorize/)
    })

    it('includes client_id', () => {
      const url = GithubService.generateAuthUrl()
      expect(url).toContain('client_id=test-github-client-id')
    })

    it('includes scope=user', () => {
      const url = GithubService.generateAuthUrl()
      expect(url).toContain('scope=user')
    })
  })

  // ── getTokens ────────────────────────────────────────────────────────
  describe('getTokens', () => {
    it('returns access_token from GitHub token response', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'gh-access' } })
      const result = await GithubService.getTokens('code-abc')
      expect(result.access_token).toBe('gh-access')
    })

    it('posts to GitHub token URL with Accept: application/json', async () => {
      axiosMock.post.mockResolvedValueOnce({ data: { access_token: 'at' } })
      await GithubService.getTokens('code')
      expect(axiosMock.post).toHaveBeenCalledWith(
        'https://github.com/login/oauth/access_token',
        expect.any(URLSearchParams),
        expect.objectContaining({ headers: expect.objectContaining({ Accept: 'application/json' }) })
      )
    })

    it('throws on network error', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(GithubService.getTokens('bad')).rejects.toThrow()
    })
  })

  // ── getUserInfo ──────────────────────────────────────────────────────
  describe('getUserInfo', () => {
    it('maps GitHub user API response to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 42,
          email: 'dev@github.com',
          name: 'GH User',
          avatar_url: 'https://avatars.github.com/u/42',
        },
      })

      const profile = await GithubService.getUserInfo('gh-token')
      expect(profile.sub).toBe('42')
      expect(profile.email).toBe('dev@github.com')
      expect(profile.provider).toBe('github')
      expect(profile.picture).toBe('https://avatars.github.com/u/42')
    })

    it('handles missing email gracefully (returns empty string)', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 1, email: null, name: 'NoEmail', avatar_url: '' },
      })
      const profile = await GithubService.getUserInfo('tok')
      expect(profile.email).toBe('')
    })

    it('throws on HTTP error', async () => {
      axiosMock.get.mockRejectedValueOnce(new Error('401 Unauthorized'))
      await expect(GithubService.getUserInfo('bad-token')).rejects.toThrow()
    })
  })
})
