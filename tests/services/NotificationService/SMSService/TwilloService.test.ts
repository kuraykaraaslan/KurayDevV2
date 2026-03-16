import axios from 'axios'

jest.mock('@/libs/logger', () => ({
  __esModule: true,
  default: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}))

import TwilloService from '@/services/NotificationService/SMSService/TwilloService'
import Logger from '@/libs/logger'

jest.mock('axios')
const axiosMock = axios as jest.Mocked<typeof axios>

// axios.create returns an instance — mock it
const mockAxiosInstance = {
  post: jest.fn().mockResolvedValue({ status: 201 }),
}
axiosMock.create.mockReturnValue(mockAxiosInstance as any)
const loggerMock = Logger as jest.Mocked<typeof Logger>

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

    it('maps invalid credential errors from provider response', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce({
        response: { data: { message: 'Invalid credentials' } },
      })

      await TwilloService.sendShortMessage('+12125551234', 'Test')
      await new Promise((resolve) => setImmediate(resolve))

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('Invalid credentials')
      )
    })

    it('maps timeout errors from transport layer', async () => {
      mockAxiosInstance.post.mockRejectedValueOnce(new Error('timeout of 10000ms exceeded'))

      await TwilloService.sendShortMessage('+12125551234', 'Test')
      await new Promise((resolve) => setImmediate(resolve))

      expect(loggerMock.error).toHaveBeenCalledWith(
        expect.stringContaining('timeout of 10000ms exceeded')
      )
    })
  })
})
