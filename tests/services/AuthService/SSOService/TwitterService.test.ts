jest.mock('axios')

import axios from 'axios'
import TwitterService from '@/services/AuthService/SSOService/TwitterService'

const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
  TwitterService.TWITTER_CLIENT_ID = 'twitter-client-id'
  TwitterService.TWITTER_CLIENT_SECRET = 'twitter-secret'
  TwitterService.NEXT_PUBLIC_APPLICATION_HOST = 'https://example.com'
})

describe('TwitterService', () => {
  describe('generateAuthUrl', () => {
    it('returns URL starting with Twitter auth URL', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('https://twitter.com/i/oauth2/authorize')
    })

    it('includes client_id, response_type=code, and code_challenge', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('client_id=twitter-client-id')
      expect(url).toContain('response_type=code')
      expect(url).toContain('code_challenge=challenge')
    })

    it('includes tweet.read scope', () => {
      const url = TwitterService.generateAuthUrl()
      expect(url).toContain('scope=')
    })
  })

  describe('getTokens', () => {
    it('returns access_token from Twitter response', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'tw-access-token' },
      })
      const tokens = await TwitterService.getTokens('tw-code')
      expect(tokens.access_token).toBe('tw-access-token')
    })

    it('propagates network errors', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Twitter down'))
      await expect(TwitterService.getTokens('bad')).rejects.toThrow('Twitter down')
    })
  })

  describe('getUserInfo', () => {
    it('maps id, name, profile_image_url to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          id: 'tw-uid-99',
          name: 'TwitterUser',
          profile_image_url: 'https://pbs.twimg.com/profile.jpg',
          email: 'tw@example.com',
        },
      })
      const info = await TwitterService.getUserInfo('tw-token')
      expect(info.sub).toBe('tw-uid-99')
      expect(info.name).toBe('TwitterUser')
      expect(info.picture).toBe('https://pbs.twimg.com/profile.jpg')
      expect(info.provider).toBe('twitter')
    })

    it('defaults email and picture to empty string when absent', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: { id: 'tw-2', name: null, profile_image_url: null, email: null },
      })
      const info = await TwitterService.getUserInfo('token')
      expect(info.email).toBe('')
      expect(info.picture).toBe('')
    })
  })
})
