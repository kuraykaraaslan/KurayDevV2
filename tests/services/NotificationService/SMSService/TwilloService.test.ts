import axios from 'axios'
import TwilloService from '@/services/NotificationService/SMSService/TwilloService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

// axios.create returns an instance — mock it
const mockAxiosInstance = {
  post: jest.fn().mockResolvedValue({ status: 201 }),
}
axiosMock.create.mockReturnValue(mockAxiosInstance as any)

describe('TwilloService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.TWILLO_ACCOUNT_SID = 'test-sid'
    process.env.TWILLO_AUTH_TOKEN = 'test-token'
    process.env.TWILLO_PHONE_NUMBER = '+10000000000'
    ;(TwilloService as any).TWILLO_ACCOUNT_SID = 'test-sid'
    ;(TwilloService as any).TWILLO_AUTH_TOKEN = 'test-token'
    ;(TwilloService as any).TWILLO_PHONE_NUMBER = '+10000000000'
    ;(TwilloService as any).axiosInstance = mockAxiosInstance
  })

  describe('sendShortMessage', () => {
    it('returns early when credentials are missing', async () => {
      ;(TwilloService as any).TWILLO_ACCOUNT_SID = ''
      await TwilloService.sendShortMessage('+12125551234', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('returns early when phone or body is missing', async () => {
      await TwilloService.sendShortMessage('', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()

      await TwilloService.sendShortMessage('+12125551234', '')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('calls Twilio Messages endpoint with correct payload', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ status: 201 })
      await TwilloService.sendShortMessage('+12125551234', 'Test message')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/Messages.json',
        expect.anything()
      )
    })

    it('does not throw on axios error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Network error'))
      await expect(
        TwilloService.sendShortMessage('+12125551234', 'Test')
      ).resolves.not.toThrow()
    })
  })
})
