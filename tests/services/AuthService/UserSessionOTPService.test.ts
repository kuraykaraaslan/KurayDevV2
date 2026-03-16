import UserSessionOTPService from '@/services/AuthService/UserSessionOTPService'
import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import AuthMessages from '@/messages/AuthMessages'
import { OTPMethod } from '@/generated/prisma'
import type { SafeUser } from '@/types/user/UserTypes'
import type { SafeUserSession } from '@/types/user/UserSessionTypes'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn() },
    userSession: { update: jest.fn() },
  },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendOTPEmail: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/NotificationService/SMSService', () => ({
  __esModule: true,
  default: {
    sendShortMessage: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/AuthService/SecurityService', () => ({
  __esModule: true,
  default: {
    getUserSecurity: jest.fn(),
    updateUserSecurity: jest.fn(),
  },
}))

import MailService from '@/services/NotificationService/MailService'
import SMSService from '@/services/NotificationService/SMSService'
import SecurityService from '@/services/AuthService/SecurityService'

const redisMock = redis as jest.Mocked<typeof redis>
const prismaMock = prisma as any
const mailMock = MailService as jest.Mocked<typeof MailService>
const smsMock = SMSService as jest.Mocked<typeof SMSService>
const securityMock = SecurityService as jest.Mocked<typeof SecurityService>

const mockUser: SafeUser = {
  userId: 'user-1',
  email: 'user@example.com',
  name: 'Test User',
  phone: null,
} as unknown as SafeUser

const activeSession: SafeUserSession = {
  userSessionId: 'session-1',
  userId: 'user-1',
  otpVerifyNeeded: true,
  sessionExpiry: new Date(Date.now() + 3_600_000),
}

const expiredSession: SafeUserSession = {
  ...activeSession,
  sessionExpiry: new Date(Date.now() - 1000),
}

describe('UserSessionOTPService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateToken ────────────────────────────────────────────────────
  describe('generateToken', () => {
    it('returns a numeric string of the specified length', () => {
      const token = UserSessionOTPService.generateToken(6)
      expect(token).toMatch(/^\d{6}$/)
    })
  })

  // ── hashToken / compareToken ─────────────────────────────────────────
  describe('hashToken / compareToken', () => {
    it('hashes a token and compareToken returns true for correct raw value', async () => {
      const raw = '123456'
      const hashed = await UserSessionOTPService.hashToken(raw)
      const match = await UserSessionOTPService.compareToken(raw, hashed)
      expect(match).toBe(true)
    })

    it('compareToken returns false for wrong raw value', async () => {
      const hashed = await UserSessionOTPService.hashToken('123456')
      const match = await UserSessionOTPService.compareToken('999999', hashed)
      expect(match).toBe(false)
    })
  })

  // ── rateLimitGuard ───────────────────────────────────────────────────
  describe('rateLimitGuard', () => {
    it('throws OTP_ALREADY_SENT when rate key exists', async () => {
      redisMock.get.mockResolvedValueOnce('1')
      await expect(
        UserSessionOTPService.rateLimitGuard('session-1', OTPMethod.EMAIL)
      ).rejects.toThrow(AuthMessages.OTP_ALREADY_SENT)
    })

    it('sets rate key when it does not exist', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      await UserSessionOTPService.rateLimitGuard('session-1', OTPMethod.EMAIL)
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('session-1'),
        '1',
        'EX',
        expect.any(Number)
      )
    })
  })

  // ── sendOTP ──────────────────────────────────────────────────────────
  describe('sendOTP', () => {
    it('throws OTP_NOT_NEEDED when session does not require OTP', async () => {
      const noOTPSession = { ...activeSession, otpVerifyNeeded: false }
      await expect(
        UserSessionOTPService.sendOTP({ user: mockUser, userSession: noOTPSession, method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.OTP_NOT_NEEDED)
    })

    it('throws SESSION_NOT_FOUND when session is expired', async () => {
      await expect(
        UserSessionOTPService.sendOTP({ user: mockUser, userSession: expiredSession, method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.SESSION_NOT_FOUND)
    })

    it('throws INVALID_OTP_METHOD for TOTP_APP', async () => {
      await expect(
        UserSessionOTPService.sendOTP({ user: mockUser, userSession: activeSession, method: OTPMethod.TOTP_APP, action: 'login' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })

    it('throws RATE_LIMIT_EXCEEDED when max rate reached', async () => {
      redisMock.get.mockResolvedValueOnce('5') // rate count >= OTP_RATE_LIMIT_MAX(5)
      await expect(
        UserSessionOTPService.sendOTP({ user: mockUser, userSession: activeSession, method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.RATE_LIMIT_EXCEEDED)
    })

    it('sends OTP via email for EMAIL method', async () => {
      redisMock.get.mockResolvedValueOnce(null) // no rate key
      redisMock.set.mockResolvedValue('OK')
      redisMock.del.mockResolvedValue(1)

      await UserSessionOTPService.sendOTP({
        user: mockUser,
        userSession: activeSession,
        method: OTPMethod.EMAIL,
        action: 'login',
      })

      expect(mailMock.sendOTPEmail).toHaveBeenCalledWith(
        expect.objectContaining({ email: mockUser.email })
      )
    })

    it('sends OTP via SMS for SMS method when phone exists', async () => {
      const userWithPhone = { ...mockUser, phone: '+901234567890' }
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      redisMock.del.mockResolvedValue(1)

      await UserSessionOTPService.sendOTP({
        user: userWithPhone as SafeUser,
        userSession: activeSession,
        method: OTPMethod.SMS,
        action: 'login',
      })

      expect(smsMock.sendShortMessage).toHaveBeenCalledWith(
        expect.objectContaining({ to: userWithPhone.phone })
      )
    })

    it('throws INVALID_OTP_METHOD for SMS when user has no phone', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      await expect(
        UserSessionOTPService.sendOTP({
          user: mockUser, // phone: null
          userSession: activeSession,
          method: OTPMethod.SMS,
          action: 'login',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })
  })

  // ── validateOTP ──────────────────────────────────────────────────────
  describe('validateOTP', () => {
    it('throws OTP_NOT_NEEDED when session does not require OTP', async () => {
      const noOTPSession = { ...activeSession, otpVerifyNeeded: false }
      await expect(
        UserSessionOTPService.validateOTP({ user: mockUser, userSession: noOTPSession, otpToken: '123456', method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.OTP_NOT_NEEDED)
    })

    it('throws SESSION_NOT_FOUND for expired session', async () => {
      await expect(
        UserSessionOTPService.validateOTP({ user: mockUser, userSession: expiredSession, otpToken: '123456', method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.SESSION_NOT_FOUND)
    })

    it('throws OTP_EXPIRED when EMAIL OTP key not in redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      await expect(
        UserSessionOTPService.validateOTP({ user: mockUser, userSession: activeSession, otpToken: '123456', method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.OTP_EXPIRED)
    })

    it('throws INVALID_OTP when token does not match hashed value', async () => {
      const hashed = await UserSessionOTPService.hashToken('111111')
      redisMock.get.mockResolvedValueOnce(hashed)
      await expect(
        UserSessionOTPService.validateOTP({ user: mockUser, userSession: activeSession, otpToken: '999999', method: OTPMethod.EMAIL, action: 'login' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })

    it('updates session otpVerifyNeeded=false on success', async () => {
      const token = '654321'
      const hashed = await UserSessionOTPService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashed)
      redisMock.del.mockResolvedValue(1)
      prismaMock.userSession.update.mockResolvedValueOnce({} as any)

      await UserSessionOTPService.validateOTP({ user: mockUser, userSession: activeSession, otpToken: token, method: OTPMethod.EMAIL, action: 'login' })

      expect(prismaMock.userSession.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userSessionId: activeSession.userSessionId },
          data: { otpVerifyNeeded: false },
        })
      )
    })

    it('uses TOTP_APP path: throws INVALID_OTP_METHOD when no secret found', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        email: 'user@example.com',
        userRole: 'USER',
        userStatus: 'ACTIVE',
        userProfile: null,
        userPreferences: null,
        userSecurity: null,
        password: 'password12345678',
        phone: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
      } as any)
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: { otpMethods: ['TOTP_APP'] as any, otpSecret: null, otpBackupCodes: [] } as any,
      })
      await expect(
        UserSessionOTPService.validateOTP({ user: mockUser, userSession: activeSession, otpToken: '123456', method: OTPMethod.TOTP_APP, action: 'login' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })
  })
})
