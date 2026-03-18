jest.mock('axios')
jest.mock('jsonwebtoken')

import axios from 'axios'
import jwt from 'jsonwebtoken'
import AppleService from '@/services/AuthService/SSOService/AppleService'

const axiosMock = axios as jest.Mocked<typeof axios>
const jwtMock = jwt as jest.Mocked<typeof jwt>

beforeEach(() => {
  jest.clearAllMocks()
  AppleService.APPLE_CLIENT_ID = 'test-client-id'
  AppleService.APPLE_TEAM_ID = 'test-team-id'
  AppleService.APPLE_KEY_ID = 'test-key-id'
  AppleService.APPLE_PRIVATE_KEY = 'test-private-key'
  AppleService.NEXT_PUBLIC_APPLICATION_HOST = 'https://example.com'
})

describe('AppleService', () => {
  describe('generateAuthUrl', () => {
    it('returns a URL starting with the Apple auth URL', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('https://appleid.apple.com/auth/authorize')
    })

    it('includes client_id and redirect_uri in the query string', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('client_id=test-client-id')
      expect(url).toContain('redirect_uri=')
    })

    it('includes response_type=code', () => {
      const url = AppleService.generateAuthUrl()
      expect(url).toContain('response_type=code')
    })
  })

  describe('generateClientSecret', () => {
    it('calls jwt.sign with ES256 and correct keyid', () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValue('signed-jwt')
      const secret = AppleService.generateClientSecret()
      expect(jwtMock.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          iss: 'test-team-id',
          sub: 'test-client-id',
          aud: 'https://appleid.apple.com',
        }),
        'test-private-key',
        expect.objectContaining({ algorithm: 'ES256', keyid: 'test-key-id' })
      )
      expect(secret).toBe('signed-jwt')
    })
  })

  describe('getTokens', () => {
    it('returns access_token and refresh_token on success', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValue('client-secret')
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'acc-tok', refresh_token: 'ref-tok' },
      })

      const tokens = await AppleService.getTokens('auth-code')
      expect(tokens.access_token).toBe('acc-tok')
      expect(tokens.refresh_token).toBe('ref-tok')
    })

    it('propagates axios error when token exchange fails', async () => {
      ;(jwtMock.sign as jest.Mock).mockReturnValue('client-secret')
      axiosMock.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(AppleService.getTokens('bad-code')).rejects.toThrow('Network error')
    })
  })

  describe('getUserInfo', () => {
    it('decodes the JWT and returns email and sub', async () => {
      ;(jwtMock.decode as jest.Mock).mockReturnValue({
        email: 'apple@example.com',
        sub: 'apple-sub-123',
      })

      const info = await AppleService.getUserInfo('some.jwt.token')
      expect(info.email).toBe('apple@example.com')
      expect(info.sub).toBe('apple-sub-123')
      expect(info.provider).toBe('apple')
    })
  })
})
