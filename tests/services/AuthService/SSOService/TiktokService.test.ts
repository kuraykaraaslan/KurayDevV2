jest.mock('axios')

import axios from 'axios'
import TikTokService from '@/services/AuthService/SSOService/TiktokService'

const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
  TikTokService.TIKTOK_CLIENT_KEY = 'tiktok-key'
  TikTokService.TIKTOK_CLIENT_SECRET = 'tiktok-secret'
  TikTokService.NEXT_PUBLIC_APPLICATION_HOST = 'https://example.com'
})

describe('TikTokService', () => {
  describe('generateAuthUrl', () => {
    it('returns URL starting with TikTok auth URL', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('https://www.tiktok.com/auth/authorize')
    })

    it('includes client_key in params', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('client_key=tiktok-key')
    })

    it('includes redirect_uri and response_type=code', () => {
      const url = TikTokService.generateAuthUrl()
      expect(url).toContain('redirect_uri=')
      expect(url).toContain('response_type=code')
    })
  })

  describe('getTokens', () => {
    it('returns access_token and refresh_token', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'tt-access', refresh_token: 'tt-refresh' },
      })
      const tokens = await TikTokService.getTokens('tiktok-code')
      expect(tokens.access_token).toBe('tt-access')
      expect(tokens.refresh_token).toBe('tt-refresh')
    })

    it('propagates HTTP errors', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('TikTok API error'))
      await expect(TikTokService.getTokens('bad-code')).rejects.toThrow('TikTok API error')
    })
  })

  describe('getUserInfo', () => {
    it('maps open_id, nickname, avatar to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          data: {
            open_id: 'tt-uid-1',
            email: 'tiktok@example.com',
            nickname: 'TikUser',
            avatar: 'https://cdn.tiktok.com/avatar.jpg',
          },
        },
      })
      const info = await TikTokService.getUserInfo('tt-access-token')
      expect(info.sub).toBe('tt-uid-1')
      expect(info.email).toBe('tiktok@example.com')
      expect(info.name).toBe('TikUser')
      expect(info.picture).toBe('https://cdn.tiktok.com/avatar.jpg')
      expect(info.provider).toBe('tiktok')
    })

    it('falls back to empty string when email is absent', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { data: { open_id: 'tt-2', email: null, nickname: null, avatar: null } },
      })
      const info = await TikTokService.getUserInfo('token')
      expect(info.email).toBe('')
      expect(info.name).toBe('')
      expect(info.picture).toBe('')
    })
  })
})
