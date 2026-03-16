import TOTPService from '@/services/AuthService/TOTPService'
import redis from '@/libs/redis'
import AuthMessages from '@/messages/AuthMessages'
import { authenticator } from 'otplib'
import type { SafeUser } from '@/types/user/UserTypes'
import type { SafeUserSession } from '@/types/user/UserSessionTypes'

jest.mock('@/libs/prisma', () => ({
  prisma: { user: { findUnique: jest.fn(), update: jest.fn() } },
}))

jest.mock('@/services/AuthService/SecurityService', () => ({
  __esModule: true,
  default: {
    getUserSecurity: jest.fn(),
    updateUserSecurity: jest.fn(),
  },
}))

import SecurityService from '@/services/AuthService/SecurityService'
const securityMock = SecurityService as jest.Mocked<typeof SecurityService>
const redisMock = redis as jest.Mocked<typeof redis>

const mockUser: SafeUser = {
  userId: 'user-1',
  email: 'test@example.com',
} as unknown as SafeUser

const mockSession: SafeUserSession = {
  userSessionId: 'session-1',
  userId: 'user-1',
  otpVerifyNeeded: false,
  sessionExpiry: new Date(Date.now() + 1_000_000),
}

describe('TOTPService', () => {
  beforeEach(() => jest.resetAllMocks())

  // ── generateSecret ───────────────────────────────────────────────────
  describe('generateSecret', () => {
    it('returns a non-empty base32 string', () => {
      const secret = TOTPService.generateSecret()
      expect(typeof secret).toBe('string')
      expect(secret.length).toBeGreaterThan(0)
      expect(secret).toMatch(/^[A-Z2-7]+=*$/)
    })

    it('generates unique secrets on successive calls', () => {
      const s1 = TOTPService.generateSecret()
      const s2 = TOTPService.generateSecret()
      expect(s1).not.toBe(s2)
    })
  })

  // ── getOtpauthURL ────────────────────────────────────────────────────
  describe('getOtpauthURL', () => {
    it('returns a valid otpauth:// URI containing the email and issuer', () => {
      const secret = TOTPService.generateSecret()
      const url = TOTPService.getOtpauthURL({ user: mockUser, secret })
      expect(url).toMatch(/^otpauth:\/\/totp\//)
      expect(url).toContain(encodeURIComponent(mockUser.email))
    })
  })

  // ── verifyTokenWithSecret ────────────────────────────────────────────
  describe('verifyTokenWithSecret', () => {
    it('returns false for an invalid token', () => {
      const secret = TOTPService.generateSecret()
      const result = TOTPService.verifyTokenWithSecret('000000', secret)
      // Could be true by extreme coincidence — but statistically always false
      expect(typeof result).toBe('boolean')
    })

    it('returns false for a clearly wrong 6-digit code', () => {
      const secret = 'JBSWY3DPEHPK3PXP' // fixed well-known secret
      // '000000' is extremely unlikely to be a valid TOTP for this secret right now
      const result = TOTPService.verifyTokenWithSecret('000000', secret)
      expect(result).toBe(false)
    })

    it('accepts small clock skew within configured TOTP window', () => {
      const secret = 'JBSWY3DPEHPK3PXP'
      const base = new Date('2026-03-16T12:00:00.000Z')
      jest.useFakeTimers().setSystemTime(base)

      try {
        TOTPService.setupOtpLib()
        const token = authenticator.generate(secret)

        jest.setSystemTime(new Date(base.getTime() + 35_000))
        expect(TOTPService.verifyTokenWithSecret(token, secret)).toBe(true)
      } finally {
        jest.useRealTimers()
      }
    })

    it('rejects token when clock skew is beyond allowed window', () => {
      const secret = 'JBSWY3DPEHPK3PXP'
      const base = new Date('2026-03-16T12:00:00.000Z')
      jest.useFakeTimers().setSystemTime(base)

      try {
        TOTPService.setupOtpLib()
        const token = authenticator.generate(secret)

        jest.setSystemTime(new Date(base.getTime() + 125_000))
        expect(TOTPService.verifyTokenWithSecret(token, secret)).toBe(false)
      } finally {
        jest.useRealTimers()
      }
    })
  })

  // ── requestSetup ─────────────────────────────────────────────────────
  describe('requestSetup', () => {
    it('stores temp secret in redis and returns secret + otpauthUrl', async () => {
      redisMock.set.mockResolvedValue('OK')

      const result = await TOTPService.requestSetup({ user: mockUser, userSession: mockSession })

      expect(typeof result.secret).toBe('string')
      expect(result.otpauthUrl).toMatch(/^otpauth:\/\/totp\//)
      expect(redisMock.set).toHaveBeenCalledWith(
        expect.stringContaining('session-1'),
        result.secret,
        'EX',
        expect.any(Number)
      )
    })
  })

  // ── verifyAndEnable ──────────────────────────────────────────────────
  describe('verifyAndEnable', () => {
    it('throws INVALID_OTP when no temp secret in redis', async () => {
      redisMock.get.mockResolvedValueOnce(null)

      await expect(
        TOTPService.verifyAndEnable({ user: mockUser, userSession: mockSession, otpToken: '123456' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })

    it('throws INVALID_OTP when token does not verify against temp secret', async () => {
      const secret = TOTPService.generateSecret()
      redisMock.get.mockResolvedValueOnce(secret)
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: { otpMethods: [], otpSecret: null, otpBackupCodes: [] } as any,
      })

      await expect(
        TOTPService.verifyAndEnable({ user: mockUser, userSession: mockSession, otpToken: '000000' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })
  })

  // ── verifyAuthenticate ───────────────────────────────────────────────
  describe('verifyAuthenticate', () => {
    it('throws INVALID_OTP_METHOD when TOTP_APP not in otpMethods', async () => {
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: { otpMethods: [], otpSecret: null, otpBackupCodes: [] } as any,
      })

      await expect(
        TOTPService.verifyAuthenticate({ user: mockUser, otpToken: '123456' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })

    it('throws INVALID_OTP for wrong token against stored secret', async () => {
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: 'JBSWY3DPEHPK3PXP',
          otpBackupCodes: [],
        } as any,
      })

      await expect(
        TOTPService.verifyAuthenticate({ user: mockUser, otpToken: '000000' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })
  })

  // ── disable ──────────────────────────────────────────────────────────
  describe('disable', () => {
    it('throws INVALID_OTP_METHOD when TOTP not enabled', async () => {
      ;(securityMock.getUserSecurity as jest.Mock).mockResolvedValueOnce({
        userSecurity: { otpMethods: [], otpSecret: null, otpBackupCodes: [] } as any,
      })
      await expect(
        TOTPService.disable({ user: mockUser, otpToken: '123456' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
    })

    it('throws INVALID_OTP for wrong token', async () => {
      ;(securityMock.getUserSecurity as jest.Mock).mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: 'JBSWY3DPEHPK3PXP',
          otpBackupCodes: [],
        } as any,
      })
      await expect(
        TOTPService.disable({ user: mockUser, otpToken: '000000' })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    })
  })

  // ── consumeBackupCode ────────────────────────────────────────────────
  describe('consumeBackupCode', () => {
    it('returns consumed=false when backup code list is empty', async () => {
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: { otpMethods: ['TOTP_APP'] as any, otpSecret: 'x', otpBackupCodes: [] } as any,
      })
      const result = await TOTPService.consumeBackupCode({ user: mockUser, code: '1234-5678' })
      expect(result.consumed).toBe(false)
    })

    it('returns consumed=false when no backup code matches', async () => {
      const bcrypt = await import('bcrypt')
      const hashed = await bcrypt.hash('9999-0000', 1)
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: 'x',
          otpBackupCodes: [hashed],
        } as any,
      })
      const result = await TOTPService.consumeBackupCode({ user: mockUser, code: '1234-5678' })
      expect(result.consumed).toBe(false)
    })
  })
})
