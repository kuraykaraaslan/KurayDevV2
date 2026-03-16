import PasswordService from '@/services/AuthService/PasswordService'
import redis from '@/libs/redis'
import AuthMessages from '@/messages/AuthMessages'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    user: { findUnique: jest.fn(), update: jest.fn() },
  },
}))

jest.mock('@/services/UserService', () => ({
  __esModule: true,
  default: {
    getByEmail: jest.fn(),
  },
}))

jest.mock('@/services/NotificationService/MailService', () => ({
  __esModule: true,
  default: {
    sendForgotPasswordEmail: jest.fn().mockResolvedValue(undefined),
    sendPasswordResetSuccessEmail: jest.fn().mockResolvedValue(undefined),
  },
}))

jest.mock('@/services/NotificationService/SMSService', () => ({
  __esModule: true,
  default: {
    sendShortMessage: jest.fn().mockResolvedValue(undefined),
  },
}))

import { prisma } from '@/libs/prisma'
import UserService from '@/services/UserService'
import MailService from '@/services/NotificationService/MailService'
import SMSService from '@/services/NotificationService/SMSService'

const redisMock = redis as jest.Mocked<typeof redis>
const prismaMock = prisma as any
const userServiceMock = UserService as jest.Mocked<typeof UserService>
const mailMock = MailService as jest.Mocked<typeof MailService>
const smsMock = SMSService as jest.Mocked<typeof SMSService>

const mockUser = {
  userId: 'user-1',
  email: 'user@example.com',
  phone: null,
  userProfile: { name: 'Test User' },
}

describe('PasswordService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateResetToken ───────────────────────────────────────────────
  describe('generateResetToken', () => {
    it('returns a numeric string of the specified length', () => {
      const token = PasswordService.generateResetToken(6)
      expect(token).toMatch(/^\d{6}$/)
    })

    it('length defaults to RESET_TOKEN_LENGTH', () => {
      const token = PasswordService.generateResetToken()
      expect(token.length).toBeGreaterThanOrEqual(4)
      expect(token).toMatch(/^\d+$/)
    })

    it('always pads to full length', () => {
      for (let i = 0; i < 20; i++) {
        const token = PasswordService.generateResetToken(6)
        expect(token).toHaveLength(6)
      }
    })
  })

  // ── hashToken ────────────────────────────────────────────────────────
  describe('hashToken', () => {
    it('returns a 64-char hex SHA-256 string', async () => {
      const hash = await PasswordService.hashToken('test-token')
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('is deterministic', async () => {
      const h1 = await PasswordService.hashToken('abc')
      const h2 = await PasswordService.hashToken('abc')
      expect(h1).toBe(h2)
    })

    it('produces different hashes for different tokens', async () => {
      const h1 = await PasswordService.hashToken('abc')
      const h2 = await PasswordService.hashToken('xyz')
      expect(h1).not.toBe(h2)
    })
  })

  // ── getRedisKey / getRateKey ─────────────────────────────────────────
  describe('getRedisKey / getRateKey', () => {
    it('getRedisKey includes the email', () => {
      const key = PasswordService.getRedisKey('User@Example.COM')
      expect(key).toContain('user@example.com')
    })

    it('getRateKey includes the email', () => {
      const key = PasswordService.getRateKey('User@Example.COM')
      expect(key).toContain('user@example.com')
    })

    it('getRedisKey and getRateKey return different keys', () => {
      const a = PasswordService.getRedisKey('a@b.com')
      const b = PasswordService.getRateKey('a@b.com')
      expect(a).not.toBe(b)
    })
  })

  // ── forgotPassword ───────────────────────────────────────────────────
  describe('forgotPassword', () => {
    it('throws USER_NOT_FOUND when user does not exist', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(null)
      await expect(PasswordService.forgotPassword({ email: 'none@x.com' })).rejects.toThrow(
        AuthMessages.USER_NOT_FOUND
      )
    })

    it('throws RATE_LIMIT_EXCEEDED when rate count >= max', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce('5') // rate key = 5 >= RESET_RATE_LIMIT_MAX(5)
      await expect(PasswordService.forgotPassword({ email: 'user@example.com' })).rejects.toThrow(
        AuthMessages.RATE_LIMIT_EXCEEDED
      )
    })

    it('increments rate count when below max', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce('2') // rate count = 2 < 5
      redisMock.set.mockResolvedValue('OK')
      redisMock.del.mockResolvedValue(1)

      await PasswordService.forgotPassword({ email: 'user@example.com' })

      // First set call should update rate key to '3'
      const rateSetCall = redisMock.set.mock.calls.find((c) => c[1] === '3')
      expect(rateSetCall).toBeDefined()
    })

    it('sets rate key to 1 on first request', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce(null) // no rate key yet
      redisMock.set.mockResolvedValue('OK')
      redisMock.del.mockResolvedValue(1)

      await PasswordService.forgotPassword({ email: 'user@example.com' })

      const rateInit = redisMock.set.mock.calls.find((c) => c[1] === '1')
      expect(rateInit).toBeDefined()
    })

    it('deletes old token, stores new hashed token, and sends mail', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.set.mockResolvedValue('OK')
      redisMock.del.mockResolvedValue(1)

      await PasswordService.forgotPassword({ email: 'user@example.com' })

      expect(redisMock.del).toHaveBeenCalled()
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        'EX',
        expect.any(Number)
      )
      expect(mailMock.sendForgotPasswordEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.userProfile.name,
        expect.any(String)
      )
    })
  })

  // ── resetPassword ────────────────────────────────────────────────────
  describe('resetPassword', () => {
    it('throws USER_NOT_FOUND when user not found', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(null)
      await expect(
        PasswordService.resetPassword({ email: 'x@x.com', resetToken: '123456', password: 'new' })
      ).rejects.toThrow(AuthMessages.USER_NOT_FOUND)
    })

    it('throws INVALID_TOKEN when redis has no stored hash', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce(null)
      await expect(
        PasswordService.resetPassword({ email: mockUser.email, resetToken: '123456', password: 'new' })
      ).rejects.toThrow(AuthMessages.INVALID_TOKEN)
    })

    it('throws INVALID_TOKEN when token hash does not match stored hash', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      // Store hash of 'correct-token'; submit 'wrong-token'
      const correctHash = await PasswordService.hashToken('correct-token')
      redisMock.get.mockResolvedValueOnce(correctHash)
      await expect(
        PasswordService.resetPassword({ email: mockUser.email, resetToken: 'wrong-token', password: 'newpass' })
      ).rejects.toThrow(AuthMessages.INVALID_TOKEN)
    })

    it('updates password, deletes redis key, and sends success mail on valid token', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      const token = '654321'
      const hashedToken = await PasswordService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)

      await PasswordService.resetPassword({ email: mockUser.email, resetToken: token, password: 'NewPass123!' })

      expect(prismaMock.user.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: mockUser.userId } })
      )
      expect(redisMock.del).toHaveBeenCalled()
      expect(mailMock.sendPasswordResetSuccessEmail).toHaveBeenCalledWith(
        mockUser.email,
        mockUser.userProfile.name
      )
    })

    it('sends SMS when user has a phone number', async () => {
      const userWithPhone = { ...mockUser, phone: '+905551234567' }
      userServiceMock.getByEmail.mockResolvedValueOnce(userWithPhone as any)
      const token = '111222'
      const hashedToken = await PasswordService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)

      await PasswordService.resetPassword({ email: userWithPhone.email, resetToken: token, password: 'Pass1!' })

      expect(smsMock.sendShortMessage).toHaveBeenCalledWith(
        expect.objectContaining({ to: userWithPhone.phone })
      )
    })

    it('does NOT send SMS when user has no phone', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any) // phone: null
      const token = '333444'
      const hashedToken = await PasswordService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)

      await PasswordService.resetPassword({ email: mockUser.email, resetToken: token, password: 'Pass1!' })

      expect(smsMock.sendShortMessage).not.toHaveBeenCalled()
    })

    it('one-time use: second call fails because redis key was deleted', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      const token = '777888'
      const hashedToken = await PasswordService.hashToken(token)

      // First call: redis has the hash
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)
      await PasswordService.resetPassword({ email: mockUser.email, resetToken: token, password: 'p1' })

      // Second call: redis returns null (key was deleted)
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce(null)
      await expect(
        PasswordService.resetPassword({ email: mockUser.email, resetToken: token, password: 'p2' })
      ).rejects.toThrow(AuthMessages.INVALID_TOKEN)
    })

    it('keeps reset successful when success-email sending fails (partial failure)', async () => {
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      const token = '112233'
      const hashedToken = await PasswordService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)
      mailMock.sendPasswordResetSuccessEmail.mockRejectedValueOnce(new Error('mail provider down'))

      await expect(
        PasswordService.resetPassword({ email: mockUser.email, resetToken: token, password: 'Pass1!' })
      ).resolves.toBeUndefined()

      expect(prismaMock.user.update).toHaveBeenCalled()
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('keeps reset successful when SMS sending fails (partial failure)', async () => {
      const userWithPhone = { ...mockUser, phone: '+905551234567' }
      userServiceMock.getByEmail.mockResolvedValueOnce(userWithPhone as any)
      const token = '445566'
      const hashedToken = await PasswordService.hashToken(token)
      redisMock.get.mockResolvedValueOnce(hashedToken)
      redisMock.del.mockResolvedValue(1)
      prismaMock.user.update.mockResolvedValueOnce({} as any)
      smsMock.sendShortMessage.mockRejectedValueOnce(new Error('sms gateway down'))

      await expect(
        PasswordService.resetPassword({ email: userWithPhone.email, resetToken: token, password: 'Pass1!' })
      ).resolves.toBeUndefined()

      expect(prismaMock.user.update).toHaveBeenCalled()
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('returns sanitized INVALID_TOKEN message without leaking raw reset token', async () => {
      const rawResetToken = 'my-sensitive-reset-token'
      userServiceMock.getByEmail.mockResolvedValueOnce(mockUser as any)
      redisMock.get.mockResolvedValueOnce('another-hash')

      try {
        await PasswordService.resetPassword({
          email: mockUser.email,
          resetToken: rawResetToken,
          password: 'new-pass',
        })
      } catch (error: any) {
        expect(error.message).toBe(AuthMessages.INVALID_TOKEN)
        expect(error.message).not.toContain(rawResetToken)
      }
    })
  })
})
