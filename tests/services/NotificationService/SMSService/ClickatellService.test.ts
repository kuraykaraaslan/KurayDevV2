import axios from 'axios'
import ClickatellService from '@/services/NotificationService/SMSService/ClickatellService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const mockAxiosInstance = { post: jest.fn().mockResolvedValue({ status: 202 }) }
axiosMock.create.mockReturnValue(mockAxiosInstance as any)

describe('ClickatellService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(ClickatellService as any).CLICKATELL_API_KEY = 'api-key'
    ;(ClickatellService as any).CLICKATELL_PHONE_NUMBER = '+10000000000'
    ;(ClickatellService as any).axiosInstance = mockAxiosInstance
  })

  describe('sendShortMessage', () => {
    it('returns early when credentials are missing', async () => {
      ;(ClickatellService as any).CLICKATELL_API_KEY = ''
      await ClickatellService.sendShortMessage('+12125551234', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('returns early for empty phone or body', async () => {
      await ClickatellService.sendShortMessage('', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('posts JSON payload to /chat endpoint', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ status: 202 })
      await ClickatellService.sendShortMessage('+12125551234', 'Test')
      expect(mockAxiosInstance.post).toHaveBeenCalledWith(
        '/chat',
        expect.objectContaining({ content: 'Test', to: ['+12125551234'] })
      )
    })

    it('does not throw on axios error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('Clickatell error'))
      await expect(
        ClickatellService.sendShortMessage('+12125551234', 'Test')
      ).resolves.not.toThrow()
    })
  })
})
