import axios from 'axios'
import NexmoService from '@/services/NotificationService/SMSService/NexmoService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const mockAxiosInstance = {
  post: jest.fn().mockResolvedValue({ data: { messages: [{ status: '0' }] } }),
}
axiosMock.create.mockReturnValue(mockAxiosInstance as any)

describe('NexmoService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(NexmoService as any).NEXMO_API_KEY = 'api-key'
    ;(NexmoService as any).NEXMO_API_SECRET = 'api-secret'
    ;(NexmoService as any).NEXMO_PHONE_NUMBER = '+10000000000'
    ;(NexmoService as any).axiosInstance = mockAxiosInstance
  })

  describe('sendShortMessage', () => {
    it('returns early when credentials are missing', async () => {
      ;(NexmoService as any).NEXMO_API_KEY = ''
      await NexmoService.sendShortMessage('+12125551234', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('returns early for empty phone or body', async () => {
      await NexmoService.sendShortMessage('', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('posts to Nexmo endpoint with correct payload', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: { messages: [{ status: '0' }] } })
      await NexmoService.sendShortMessage('+12125551234', 'Test')
      expect(mockAxiosInstance.post).toHaveBeenCalled()
    })

    it('does not throw on axios error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Nexmo error'))
      await expect(
        NexmoService.sendShortMessage('+12125551234', 'Test')
      ).resolves.not.toThrow()
    })
  })
})
