import OTPService from '@/services/AuthService/OTPService'
import redis from '@/libs/redis'
import AuthMessages from '@/messages/AuthMessages'
import { OTPMethodEnum } from '@/types/user/UserSecurityTypes'
import { OTP_EXPIRY_SECONDS } from '@/services/AuthService/constants'
import type { SafeUser } from '@/types/user/UserTypes'
import type { SafeUserSession } from '@/types/user/UserSessionTypes'

const redisMock = redis as jest.Mocked<typeof redis>

const mockUser: SafeUser = {
  userId: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  phone: null,
  role: 'USER',
  status: 'ACTIVE',
  userProfile: { name: 'Test User' } as any,
  createdAt: new Date(),
  updatedAt: new Date(),
} as unknown as SafeUser

const mockSession: SafeUserSession = {
  userSessionId: 'session-1',
  userId: 'user-1',
  otpVerifyNeeded: true,
  sessionExpiry: new Date(Date.now() + 1000 * 60 * 60),
}

describe('OTPService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateToken ────────────────────────────────────────────────────
  describe('generateToken', () => {
    it('returns a string of exactly OTP_LENGTH digits', () => {
      const token = OTPService.generateToken(6)
      expect(token).toMatch(/^\d{6}$/)
    })

    it('length defaults to OTP_LENGTH (6)', () => {
      const token = OTPService.generateToken()
      expect(token).toMatch(/^\d{6}$/)
    })

    it('generates tokens of custom length', () => {
      const token = OTPService.generateToken(8)
      expect(token).toMatch(/^\d{8}$/)
    })
  })

  // ── getRedisKey ──────────────────────────────────────────────────────
  describe('getRedisKey', () => {
    it('returns a namespaced key string', () => {
      const key = OTPService.getRedisKey({
        userSessionId: 'session-1',
        method: OTPMethodEnum.Enum.EMAIL,
        action: 'authenticate',
      })
      expect(key).toContain('session-1')
      expect(key).toContain('EMAIL')
      expect(key).toContain('authenticate')
    })
  })

  // ── requestOTP ───────────────────────────────────────────────────────
  describe('requestOTP', () => {
    it('throws USER_NOT_FOUND when user is null/undefined', async () => {
      await expect(
        OTPService.requestOTP({
          user: null as unknown as SafeUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
        })
      ).rejects.toThrow(AuthMessages.USER_NOT_FOUND)
    })

    it('throws INVALID_OTP_METHOD when method is TOTP_APP', async () => {
      await expect(
        OTPService.requestOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.TOTP_APP,
          action: 'authenticate',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })

    it('throws OTP_ALREADY_SENT when rate key exists in redis', async () => {
      redisMock.get.mockResolvedValueOnce('1')
      await expect(
        OTPService.requestOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
        })
      ).rejects.toThrow(AuthMessages.OTP_ALREADY_SENT)
    })

    it('stores OTP and rate key in redis on success', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      const result = await OTPService.requestOTP({
        user: mockUser,
        userSession: mockSession,
        method: OTPMethodEnum.Enum.EMAIL,
        action: 'authenticate',
      })

      expect(typeof result.otpToken).toBe('string')
      expect(result.otpToken).toMatch(/^\d{6}$/)
      // OTP stored + rate key stored = 2 set calls
      expect(redisMock.set).toHaveBeenCalledTimes(2)
    })

    it('stores OTP with expiry', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')

      await OTPService.requestOTP({
        user: mockUser,
        userSession: mockSession,
        method: OTPMethodEnum.Enum.EMAIL,
        action: 'authenticate',
      })

      const otpSetCall = redisMock.set.mock.calls[0]
      expect(otpSetCall).toContain('EX')
      expect(otpSetCall).toContain(OTP_EXPIRY_SECONDS)
    })

    it('throttles immediate second request at the rate-limit boundary', async () => {
      redisMock.get.mockResolvedValueOnce(null).mockResolvedValueOnce('1')
      redisMock.set.mockResolvedValue('OK')

      await OTPService.requestOTP({
        user: mockUser,
        userSession: mockSession,
        method: OTPMethodEnum.Enum.EMAIL,
        action: 'authenticate',
      })

      await expect(
        OTPService.requestOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
        })
      ).rejects.toThrow(AuthMessages.OTP_ALREADY_SENT)
    })
  })

  // ── verifyOTP ────────────────────────────────────────────────────────
  describe('verifyOTP', () => {
    it('throws USER_NOT_FOUND when user is null', async () => {
      redisMock.get.mockResolvedValueOnce('123456')
      await expect(
        OTPService.verifyOTP({
          user: null as unknown as SafeUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
          otpToken: '123456',
        })
      ).rejects.toThrow(AuthMessages.USER_NOT_FOUND)
    })

    it('throws INVALID_OTP when stored token is null (expired/missing)', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      await expect(
        OTPService.verifyOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
          otpToken: '123456',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })

    it('throws INVALID_OTP when token does not match', async () => {
      redisMock.get.mockResolvedValueOnce('111111')
      await expect(
        OTPService.verifyOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
          otpToken: '999999',
        })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })

    it('deletes OTP and rate keys from redis on success (single-use)', async () => {
      redisMock.get.mockResolvedValueOnce('123456')
      redisMock.del.mockResolvedValue(1)

      await OTPService.verifyOTP({
        user: mockUser,
        userSession: mockSession,
        method: OTPMethodEnum.Enum.EMAIL,
        action: 'authenticate',
        otpToken: '123456',
      })

      expect(redisMock.del).toHaveBeenCalledTimes(2)
    })

    it('resolves without error for correct token', async () => {
      redisMock.get.mockResolvedValueOnce('654321')
      redisMock.del.mockResolvedValue(1)

      await expect(
        OTPService.verifyOTP({
          user: mockUser,
          userSession: mockSession,
          method: OTPMethodEnum.Enum.EMAIL,
          action: 'authenticate',
          otpToken: '654321',
        })
      ).resolves.toBeUndefined()
    })
  })

  // ── listOTPStatus ────────────────────────────────────────────────────
  describe('listOTPStatus', () => {
    it('returns active methods from userSecurity.otpMethods', () => {
      const user = {
        ...mockUser,
        userSecurity: { otpMethods: ['EMAIL'] },
      } as unknown as any
      const result = OTPService.listOTPStatus(user)
      expect(result.active).toContain('EMAIL')
      expect(result.inactive).not.toContain('EMAIL')
    })

    it('returns all methods as inactive when no otpMethods', () => {
      const user = { ...mockUser, userSecurity: { otpMethods: [] } } as unknown as any
      const result = OTPService.listOTPStatus(user)
      expect(result.active).toHaveLength(0)
      expect(result.inactive).toContain('EMAIL')
      expect(result.inactive).toContain('SMS')
      expect(result.inactive).toContain('TOTP_APP')
    })
  })
})
