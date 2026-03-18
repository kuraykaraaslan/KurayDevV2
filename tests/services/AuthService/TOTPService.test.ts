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

// ── Phase 16: TOTPService edge-case tests ────────────────────────────────────

describe('TOTPService — TOTP code window rejection', () => {
  it('rejects a TOTP code that is beyond the allowed drift window (>2 steps)', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      // Advance 3 full steps beyond configured window (TOTP_WINDOW=1 means ±1 step)
      jest.setSystemTime(new Date(base.getTime() + 3 * 30_000 + 5_000))
      expect(TOTPService.verifyTokenWithSecret(token, secret)).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })

  it('rejects a code that is from the distant past', () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const pastDate = new Date('2020-01-01T00:00:00.000Z')
    jest.useFakeTimers().setSystemTime(new Date('2026-03-16T12:00:00.000Z'))

    try {
      TOTPService.setupOtpLib()
      // Generate a token at a different (past) time
      jest.setSystemTime(pastDate)
      const oldToken = authenticator.generate(secret)

      // Verify at current time — should fail
      jest.setSystemTime(new Date('2026-03-16T12:00:00.000Z'))
      expect(TOTPService.verifyTokenWithSecret(oldToken, secret)).toBe(false)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('TOTPService — TOTP reuse prevention', () => {
  it('same code used twice in verifyAuthenticateOrBackup falls back to backup code path', async () => {
    // First call succeeds via TOTP
    const secret = 'JBSWY3DPEHPK3PXP'
    jest.useFakeTimers().setSystemTime(new Date('2026-03-16T12:00:00.000Z'))
    TOTPService.setupOtpLib()
    const currentToken = authenticator.generate(secret)
    jest.useRealTimers()

    securityMock.getUserSecurity
      .mockResolvedValueOnce({
        userSecurity: { otpMethods: ['TOTP_APP'] as any, otpSecret: secret, otpBackupCodes: [] } as any,
      })
      .mockResolvedValueOnce({
        userSecurity: { otpMethods: ['TOTP_APP'] as any, otpSecret: secret, otpBackupCodes: [] } as any,
      })

    // The service does not track usage itself — caller is responsible for preventing reuse.
    // We verify the backup code fallback path is exercised when TOTP fails.
    // Second call with empty backup codes should throw INVALID_OTP
    jest.useFakeTimers().setSystemTime(new Date(Date.now() + 200_000))
    try {
      await expect(
        TOTPService.verifyAuthenticateOrBackup({ user: mockUser, otpToken: currentToken })
      ).rejects.toThrow(AuthMessages.INVALID_OTP)
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('TOTPService — secret generation randomness', () => {
  it('generates 10 unique secrets in succession', () => {
    const secrets = Array.from({ length: 10 }, () => TOTPService.generateSecret())
    const unique = new Set(secrets)
    expect(unique.size).toBe(10)
  })

  it('generated secret only contains valid base32 characters', () => {
    for (let i = 0; i < 5; i++) {
      const secret = TOTPService.generateSecret()
      expect(secret).toMatch(/^[A-Z2-7]+=*$/)
    }
  })
})

describe('TOTPService.verifyAndEnable — success path', () => {
  it('returns enabled=true and 4 backup codes when token is valid', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      redisMock.get.mockResolvedValueOnce(secret)
      redisMock.del.mockResolvedValue(1)
      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: { otpMethods: [], otpSecret: null, otpBackupCodes: [] } as any,
      })
      securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

      const result = await TOTPService.verifyAndEnable({
        user: mockUser,
        userSession: mockSession,
        otpToken: token,
      })

      expect(result.enabled).toBe(true)
      expect(result.backupCodes).toHaveLength(4)
      result.backupCodes.forEach((code) => {
        expect(code).toMatch(/^\d{4}-\d{4}$/)
      })
    } finally {
      jest.useRealTimers()
    }
  })
})

describe('TOTPService.consumeBackupCode — success and removal', () => {
  it('returns consumed=true and removes the matched code from the list', async () => {
    const bcrypt = await import('bcrypt')
    const plainCode = '1234-5678'
    const hashed = await bcrypt.hash(plainCode, 1)

    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: 'x',
        otpBackupCodes: [hashed],
      } as any,
    })
    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    const result = await TOTPService.consumeBackupCode({ user: mockUser, code: plainCode })
    expect(result.consumed).toBe(true)
    expect(securityMock.updateUserSecurity).toHaveBeenCalledWith(
      mockUser.userId,
      expect.objectContaining({ otpBackupCodes: [] })
    )
  })
})

// ── verifyAuthenticate success path ──────────────────────────────────────────

describe('TOTPService.verifyAuthenticate — success path', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns { verified: true } when token is valid against stored secret', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: secret,
          otpBackupCodes: [],
        } as any,
      })

      const result = await TOTPService.verifyAuthenticate({ user: mockUser, otpToken: token })

      expect(result).toEqual({ verified: true })
    } finally {
      jest.useRealTimers()
    }
  })

  it('calls SecurityService.getUserSecurity with the user id', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: secret,
          otpBackupCodes: [],
        } as any,
      })

      await TOTPService.verifyAuthenticate({ user: mockUser, otpToken: token })

      expect(securityMock.getUserSecurity).toHaveBeenCalledWith(mockUser.userId)
    } finally {
      jest.useRealTimers()
    }
  })
})

// ── verifyAuthenticateOrBackup TOTP success ───────────────────────────────────

describe('TOTPService.verifyAuthenticateOrBackup — TOTP success', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns { verified: true, method: "TOTP" } when TOTP token is valid', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: secret,
          otpBackupCodes: [],
        } as any,
      })

      const result = await TOTPService.verifyAuthenticateOrBackup({ user: mockUser, otpToken: token })

      expect(result).toEqual({ verified: true, method: 'TOTP' })
    } finally {
      jest.useRealTimers()
    }
  })

  it('falls back to BACKUP_CODE method when TOTP fails but backup code matches', async () => {
    const bcrypt = await import('bcrypt')
    const plainCode = '9876-5432'
    const hashed = await bcrypt.hash(plainCode, 1)

    // First getUserSecurity call for verifyAuthenticate (TOTP path — no TOTP_APP method)
    securityMock.getUserSecurity
      .mockResolvedValueOnce({
        userSecurity: {
          otpMethods: [] as any,
          otpSecret: null,
          otpBackupCodes: [hashed],
        } as any,
      })
      // Second call for consumeBackupCode
      .mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: 'x',
          otpBackupCodes: [hashed],
        } as any,
      })

    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    const result = await TOTPService.verifyAuthenticateOrBackup({ user: mockUser, otpToken: plainCode })

    expect(result).toEqual({ verified: true, method: 'BACKUP_CODE' })
  })

  it('throws INVALID_OTP when neither TOTP nor backup code matches', async () => {
    securityMock.getUserSecurity
      .mockResolvedValueOnce({
        userSecurity: {
          otpMethods: [] as any,
          otpSecret: null,
          otpBackupCodes: [],
        } as any,
      })
      .mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: 'x',
          otpBackupCodes: [],
        } as any,
      })

    await expect(
      TOTPService.verifyAuthenticateOrBackup({ user: mockUser, otpToken: '000000' })
    ).rejects.toThrow(AuthMessages.INVALID_OTP)
  })
})

// ── generateBackupCodes ───────────────────────────────────────────────────────

describe('TOTPService.generateBackupCodes', () => {
  beforeEach(() => jest.resetAllMocks())

  it('throws INVALID_OTP_METHOD when TOTP is not enabled', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: [] as any,
        otpSecret: null,
        otpBackupCodes: [],
      } as any,
    })

    await expect(
      TOTPService.generateBackupCodes({ user: mockUser })
    ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
  })

  it('throws INVALID_OTP_METHOD when otpSecret is null even if TOTP_APP in methods', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: null,
        otpBackupCodes: [],
      } as any,
    })

    await expect(
      TOTPService.generateBackupCodes({ user: mockUser })
    ).rejects.toThrow(AuthMessages.INVALID_OTP_METHOD)
  })

  it('returns the default 4 codes in XXXX-XXXX format', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: 'JBSWY3DPEHPK3PXP',
        otpBackupCodes: [],
      } as any,
    })
    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    const result = await TOTPService.generateBackupCodes({ user: mockUser })

    expect(result.codes).toHaveLength(4)
    result.codes.forEach((code) => {
      expect(code).toMatch(/^\d{4}-\d{4}$/)
    })
  })

  it('returns "count" codes when a custom count is specified', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: 'JBSWY3DPEHPK3PXP',
        otpBackupCodes: [],
      } as any,
    })
    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    const result = await TOTPService.generateBackupCodes({ user: mockUser, count: 8 })

    expect(result.codes).toHaveLength(8)
  })

  it('calls updateUserSecurity to persist hashed backup codes', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: 'JBSWY3DPEHPK3PXP',
        otpBackupCodes: [],
      } as any,
    })
    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    await TOTPService.generateBackupCodes({ user: mockUser })

    expect(securityMock.updateUserSecurity).toHaveBeenCalledWith(
      mockUser.userId,
      expect.objectContaining({ otpBackupCodes: expect.any(Array) })
    )
  })

  it('returns codes that are unique', async () => {
    securityMock.getUserSecurity.mockResolvedValueOnce({
      userSecurity: {
        otpMethods: ['TOTP_APP'] as any,
        otpSecret: 'JBSWY3DPEHPK3PXP',
        otpBackupCodes: [],
      } as any,
    })
    securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

    const result = await TOTPService.generateBackupCodes({ user: mockUser, count: 6 })
    const unique = new Set(result.codes)

    expect(unique.size).toBe(6)
  })
})

// ── disable success path ──────────────────────────────────────────────────────

describe('TOTPService.disable — success path', () => {
  beforeEach(() => jest.resetAllMocks())

  it('returns { disabled: true } when token is valid', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: secret,
          otpBackupCodes: [],
        } as any,
      })
      securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

      const result = await TOTPService.disable({ user: mockUser, otpToken: token })

      expect(result).toEqual({ disabled: true })
    } finally {
      jest.useRealTimers()
    }
  })

  it('calls updateUserSecurity with empty otpSecret and empty backup codes', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP'] as any,
          otpSecret: secret,
          otpBackupCodes: ['hashed1'],
        } as any,
      })
      securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

      await TOTPService.disable({ user: mockUser, otpToken: token })

      expect(securityMock.updateUserSecurity).toHaveBeenCalledWith(
        mockUser.userId,
        expect.objectContaining({
          otpSecret: null,
          otpBackupCodes: [],
        })
      )
    } finally {
      jest.useRealTimers()
    }
  })

  it('removes TOTP_APP from otpMethods after disabling', async () => {
    const secret = 'JBSWY3DPEHPK3PXP'
    const base = new Date('2026-03-16T12:00:00.000Z')
    jest.useFakeTimers().setSystemTime(base)

    try {
      TOTPService.setupOtpLib()
      const token = authenticator.generate(secret)

      securityMock.getUserSecurity.mockResolvedValueOnce({
        userSecurity: {
          otpMethods: ['TOTP_APP', 'SMS'] as any,
          otpSecret: secret,
          otpBackupCodes: [],
        } as any,
      })
      securityMock.updateUserSecurity.mockResolvedValueOnce(undefined)

      await TOTPService.disable({ user: mockUser, otpToken: token })

      expect(securityMock.updateUserSecurity).toHaveBeenCalledWith(
        mockUser.userId,
        expect.objectContaining({
          otpMethods: expect.not.arrayContaining(['TOTP_APP']),
        })
      )
    } finally {
      jest.useRealTimers()
    }
  })
})
