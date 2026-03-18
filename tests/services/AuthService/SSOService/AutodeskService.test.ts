jest.mock('axios')

import axios from 'axios'
import AutodeskService from '@/services/AuthService/SSOService/AutodeskService'

const axiosMock = axios as jest.Mocked<typeof axios>

beforeEach(() => {
  jest.clearAllMocks()
  AutodeskService.AUTODESK_CLIENT_ID = 'autodesk-client-id'
  AutodeskService.AUTODESK_CLIENT_SECRET = 'autodesk-secret'
  AutodeskService.NEXT_PUBLIC_APPLICATION_HOST = 'https://example.com'
})

describe('AutodeskService', () => {
  describe('generateAuthUrl', () => {
    it('returns URL starting with Autodesk auth base URL', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('https://developer.api.autodesk.com/authentication/v2/authorize')
    })

    it('includes client_id and redirect_uri', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('client_id=autodesk-client-id')
      expect(url).toContain('redirect_uri=')
    })

    it('includes data scope', () => {
      const url = AutodeskService.generateAuthUrl()
      expect(url).toContain('scope=')
    })
  })

  describe('getTokens', () => {
    it('returns access_token and refresh_token', async () => {
      axiosMock.post.mockResolvedValueOnce({
        data: { access_token: 'at-123', refresh_token: 'rt-456' },
      })
      const tokens = await AutodeskService.getTokens('code-abc')
      expect(tokens.access_token).toBe('at-123')
      expect(tokens.refresh_token).toBe('rt-456')
    })

    it('propagates network errors', async () => {
      axiosMock.post.mockRejectedValueOnce(new Error('Autodesk server error'))
      await expect(AutodeskService.getTokens('bad')).rejects.toThrow('Autodesk server error')
    })
  })

  describe('getUserInfo', () => {
    it('maps userId, emailId, firstName, lastName to SSOProfileResponse', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          userId: 'adesk-uid',
          emailId: 'user@autodesk.com',
          firstName: 'John',
          lastName: 'Doe',
          profileImages: { size48: 'https://example.com/avatar.jpg' },
        },
      })
      const info = await AutodeskService.getUserInfo('bearer-token')
      expect(info.sub).toBe('adesk-uid')
      expect(info.email).toBe('user@autodesk.com')
      expect(info.name).toBe('John Doe')
      expect(info.picture).toBe('https://example.com/avatar.jpg')
      expect(info.provider).toBe('autodesk')
    })

    it('returns null picture when profileImages is missing', async () => {
      axiosMock.get.mockResolvedValueOnce({
        data: {
          userId: 'u1',
          emailId: 'u1@autodesk.com',
          firstName: 'Jane',
          lastName: 'Smith',
          profileImages: null,
        },
      })
      const info = await AutodeskService.getUserInfo('token')
      expect(info.picture).toBeNull()
    })
  })
})
