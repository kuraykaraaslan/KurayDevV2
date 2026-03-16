import axios from 'axios'
import NetGSMService from '@/services/NotificationService/SMSService/NetGSMService'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

const mockAxiosInstance = { post: jest.fn().mockResolvedValue({ data: '00 123456789' }) }
axiosMock.create.mockReturnValue(mockAxiosInstance as any)

describe('NetGSMService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(NetGSMService as any).NETGSM_USER_CODE = 'user123'
    ;(NetGSMService as any).NETGSM_PASSWORD = 'pass123'
    ;(NetGSMService as any).NETGSM_PHONE_NUMBER = 'SENDER'
    ;(NetGSMService as any).axiosInstance = mockAxiosInstance
  })

  describe('sendShortMessage', () => {
    it('returns early when credentials are missing', async () => {
      ;(NetGSMService as any).NETGSM_USER_CODE = ''
      await NetGSMService.sendShortMessage('+905551234567', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('returns early for empty phone or body', async () => {
      await NetGSMService.sendShortMessage('', 'Hello')
      expect(mockAxiosInstance.post).not.toHaveBeenCalled()
    })

    it('posts FormData to NetGSM endpoint', async () => {
      mockAxiosInstance.post.mockResolvedValueOnce({ data: '00 123456789' })
      await NetGSMService.sendShortMessage('+905551234567', 'Test')
      expect(mockAxiosInstance.post).toHaveBeenCalled()
    })

    it('does not throw on axios error', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('NetGSM error'))
      await expect(
        NetGSMService.sendShortMessage('+905551234567', 'Test')
      ).resolves.not.toThrow()
    })
  })
})
