import OTPService from '@/services/AuthService/OTPService'
import { OTPMethod } from '@/generated/prisma'
import AuthMessages from '@/messages/AuthMessages'

// --- Mocklar ---
jest.mock('@/libs/redis', () => ({
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
}))
jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: {
      update: jest.fn(),
    },
  },
}))
jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendOTPEmail: jest.fn(),
  },
}))
jest.mock('@/services/NotificationService/SMSService', () => ({
  __esModule: true,
  default: {
    sendShortMessage: jest.fn(),
  },
}))

import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import MailService from '@/services/NotificationService/MailService'
import SMSService from '@/services/NotificationService/SMSService'

describe('OTPService', () => {
  const mockUser = {
    userId: 'u123',
    name: 'Test User',
    email: 'test@example.com',
    phone: '+905551112233',
    otpMethods: [],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // -------------------------------------------------------------
  describe('generateToken', () => {
    it('should generate a token with correct length', () => {
      const token = OTPService.generateToken(6)
      expect(token).toHaveLength(6)
      expect(/^\d{6}$/.test(token)).toBe(true)
    })
  })

  // -------------------------------------------------------------
  describe('requestOTP', () => {
    it('should send OTP via email', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce(null)
      ;(redis.set as jest.Mock).mockResolvedValue(true)

      await OTPService.requestOTP({ user: mockUser, method: OTPMethod.EMAIL })

      expect(redis.set).toHaveBeenCalledTimes(2)
      expect(MailService.sendOTPEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: mockUser.email,
          name: mockUser.name,
          otpToken: expect.any(String),
        })
      )
    })

    it('should send OTP via SMS', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce(null)
      ;(redis.set as jest.Mock).mockResolvedValue(true)

      await OTPService.requestOTP({ user: mockUser, method: OTPMethod.SMS })

      expect(SMSService.sendShortMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          to: mockUser.phone,
          body: expect.stringContaining('Your OTP code'),
        })
      )
    })

    it('should throw if OTP already sent', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce('1')
      await expect(
        OTPService.requestOTP({ user: mockUser, method: OTPMethod.EMAIL })
      ).rejects.toThrow(AuthMessages.OTP_ALREADY_SENT)
    })

    it('should throw for invalid method (TOTP_APP)', async () => {
      await expect(
        OTPService.requestOTP({ user: mockUser, method: OTPMethod.TOTP_APP })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })
  })

  // -------------------------------------------------------------
  describe('verifyOTPAndActivate', () => {
    it('should verify valid OTP and activate method', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce('123456')

      const updatedUser = { ...mockUser, otpMethods: [OTPMethod.EMAIL] }
      ;(prisma.user.update as jest.Mock).mockResolvedValue(updatedUser)

      await OTPService.verifyOTPAndActivate({
        user: mockUser,
        method: OTPMethod.EMAIL,
        otpToken: '123456',
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: mockUser.userId },
          data: expect.any(Object),
        })
      )
      expect(redis.del).toHaveBeenCalledTimes(2)
    })

    it('should throw if token is invalid', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce('999999')
      await expect(
        OTPService.verifyOTPAndActivate({
          user: mockUser,
          method: OTPMethod.EMAIL,
          otpToken: '123456',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })
  })

  // -------------------------------------------------------------
  describe('requestDeactivation', () => {
    const activeUser = { ...mockUser, otpMethods: [OTPMethod.EMAIL] }

    it('should send OTP for deactivation via email', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce(null)
      ;(redis.set as jest.Mock).mockResolvedValue(true)

      await OTPService.requestDeactivation({ user: activeUser, method: OTPMethod.EMAIL })

      expect(MailService.sendOTPEmail).toHaveBeenCalledWith(
        expect.objectContaining({
          email: activeUser.email,
          otpToken: expect.any(String),
        })
      )
    })

    it('should throw if method not active', async () => {
      await expect(
        OTPService.requestDeactivation({ user: mockUser, method: OTPMethod.EMAIL })
      ).rejects.toThrow(`This method (${OTPMethod.EMAIL}) is not currently active.`)
    })
  })

  // -------------------------------------------------------------
  describe('verifyDeactivation', () => {
    const activeUser = { ...mockUser, otpMethods: [OTPMethod.SMS] }

    it('should verify and deactivate OTP method', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce('999999')

      await OTPService.verifyDeactivation({
        user: activeUser,
        method: OTPMethod.SMS,
        otpToken: '999999',
      })

      expect(prisma.user.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            otpMethods: expect.objectContaining({
              set: [],
            }),
          }),
        })
      )
      expect(redis.del).toHaveBeenCalledTimes(2)
    })

    it('should throw for invalid token', async () => {
      ;(redis.get as jest.Mock).mockResolvedValueOnce('123')
      await expect(
        OTPService.verifyDeactivation({
          user: activeUser,
          method: OTPMethod.SMS,
          otpToken: '999999',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })
  })
})
