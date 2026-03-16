import UserSessionService from '@/services/AuthService/UserSessionService'
import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import AuthMessages from '@/messages/AuthMessages'
import type { SafeUser } from '@/types/user/UserTypes'

jest.mock('@/libs/prisma', () => ({
  prisma: {
    userSession: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    user: { findUnique: jest.fn() },
  },
}))

jest.mock('@/services/AuthService/DeviceFingerprintService', () => ({
  __esModule: true,
  default: {
    generateDeviceFingerprint: jest.fn().mockResolvedValue('fp-hash-abc'),
  },
}))

jest.mock('@/services/AuthService/TokenService', () => ({
  __esModule: true,
  default: {
    generateAccessToken: jest.fn().mockReturnValue('raw-access-token'),
    generateRefreshToken: jest.fn().mockReturnValue('raw-refresh-token'),
    hashToken: jest.fn((t: string) => `hashed-${t}`),
    verifyAccessToken: jest.fn(),
    verifyRefreshToken: jest.fn(),
  },
}))

import TokenService from '@/services/AuthService/TokenService'

const redisMock = redis as jest.Mocked<typeof redis>
const prismaMock = prisma as any
const tokenMock = TokenService as jest.Mocked<typeof TokenService>

function makeRequest(): NextRequest {
  return { headers: { get: () => null } } as unknown as NextRequest
}

const mockUser: SafeUser = {
  userId: 'user-1',
  email: 'test@example.com',
  role: 'USER',
  status: 'ACTIVE',
} as unknown as SafeUser

const mockUserSecurity = { otpMethods: [] as string[] } as any

const mockDbSession = {
  userSessionId: 'session-1',
  userId: 'user-1',
  accessToken: 'hashed-raw-access-token',
  refreshToken: 'hashed-raw-refresh-token',
  sessionExpiry: new Date(Date.now() + 3_600_000),
  otpVerifyNeeded: false,
  deviceFingerprint: 'fp-hash-abc',
  createdAt: new Date(),
}

describe('UserSessionService', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── omitSensitiveFields ──────────────────────────────────────────────
  describe('omitSensitiveFields', () => {
    it('returns only safe fields — no accessToken or refreshToken', () => {
      const result = UserSessionService.omitSensitiveFields(mockDbSession as any)
      expect(result).not.toHaveProperty('accessToken')
      expect(result).not.toHaveProperty('refreshToken')
      expect(result).toHaveProperty('userSessionId')
      expect(result).toHaveProperty('userId')
      expect(result).toHaveProperty('otpVerifyNeeded')
      expect(result).toHaveProperty('sessionExpiry')
    })
  })

  // ── createSession ────────────────────────────────────────────────────
  describe('createSession', () => {
    it('sets otpVerifyNeeded=true when user has OTP methods', async () => {
      const securityWithOTP = { otpMethods: ['EMAIL'] }
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)

      await UserSessionService.createSession({
        user: mockUser,
        request: makeRequest(),
        userSecurity: securityWithOTP as any,
      })

      const createCall = prismaMock.userSession.create.mock.calls[0][0]
      expect((createCall.data as any).otpVerifyNeeded).toBe(true)
    })

    it('sets otpVerifyNeeded=false when user has no OTP methods', async () => {
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)

      await UserSessionService.createSession({
        user: mockUser,
        request: makeRequest(),
        userSecurity: mockUserSecurity,
      })

      const createCall = prismaMock.userSession.create.mock.calls[0][0]
      expect((createCall.data as any).otpVerifyNeeded).toBe(false)
    })

    it('sets otpVerifyNeeded=false when otpIgnore=true even with OTP methods', async () => {
      const securityWithOTP = { otpMethods: ['EMAIL'] }
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)

      await UserSessionService.createSession({
        user: mockUser,
        request: makeRequest(),
        userSecurity: securityWithOTP as any,
        otpIgnore: true,
      })

      const createCall = prismaMock.userSession.create.mock.calls[0][0]
      expect((createCall.data as any).otpVerifyNeeded).toBe(false)
    })

    it('stores hashed tokens — not raw tokens in DB', async () => {
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)

      await UserSessionService.createSession({
        user: mockUser,
        request: makeRequest(),
        userSecurity: mockUserSecurity,
      })

      const createData = prismaMock.userSession.create.mock.calls[0][0].data as any
      // hashToken is called with raw token and result stored
      expect(createData.accessToken).toBe('hashed-raw-access-token')
      expect(createData.refreshToken).toBe('hashed-raw-refresh-token')
    })

    it('returns raw tokens (not hashed) in response', async () => {
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)

      const result = await UserSessionService.createSession({
        user: mockUser,
        request: makeRequest(),
        userSecurity: mockUserSecurity,
      })

      expect(result.rawAccessToken).toBe('raw-access-token')
      expect(result.rawRefreshToken).toBe('raw-refresh-token')
    })

    it('does not fail session creation when cache write fails', async () => {
      prismaMock.userSession.create.mockResolvedValueOnce(mockDbSession as any)
      redisMock.setex.mockRejectedValueOnce(new Error('redis unavailable'))

      await expect(
        UserSessionService.createSession({
          user: mockUser,
          request: makeRequest(),
          userSecurity: mockUserSecurity,
        })
      ).resolves.toMatchObject({
        rawAccessToken: 'raw-access-token',
        rawRefreshToken: 'raw-refresh-token',
      })
    })
  })

  // ── getSessionDangerously ────────────────────────────────────────────
  describe('getSessionDangerously', () => {
    beforeEach(() => {
      tokenMock.verifyAccessToken.mockResolvedValue({ userId: 'user-1' })
    })

    it('returns cached session from redis without hitting DB', async () => {
      const cached = JSON.stringify({ user: mockUser, userSession: UserSessionService.omitSensitiveFields(mockDbSession as any) })
      redisMock.get.mockResolvedValueOnce(cached)

      const result = await UserSessionService.getSessionDangerously({
        accessToken: 'raw-access-token',
        request: makeRequest(),
      })

      expect(result.user.userId).toBe('user-1')
      expect(prismaMock.userSession.findFirst).not.toHaveBeenCalled()
    })

    it('queries DB and caches result when redis is empty', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.setex.mockResolvedValue('OK')
      prismaMock.userSession.findFirst.mockResolvedValueOnce(mockDbSession as any)
      prismaMock.user.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        email: 'test@example.com',
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

      await UserSessionService.getSessionDangerously({
        accessToken: 'raw-access-token',
        request: makeRequest(),
      })

      expect(prismaMock.userSession.findFirst).toHaveBeenCalled()
      expect(redisMock.setex).toHaveBeenCalled()
    })

    it('throws SESSION_NOT_FOUND when session not in DB', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      prismaMock.userSession.findFirst.mockResolvedValueOnce(null)

      await expect(
        UserSessionService.getSessionDangerously({ accessToken: 'tok', request: makeRequest() })
      ).rejects.toThrow(AuthMessages.SESSION_NOT_FOUND)
    })

    it('rejects old access token usage after logout/session revocation', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      prismaMock.userSession.findFirst.mockResolvedValueOnce(null)

      await expect(
        UserSessionService.getSessionDangerously({
          accessToken: 'revoked-access-token',
          request: makeRequest(),
        })
      ).rejects.toThrow(AuthMessages.SESSION_NOT_FOUND)
    })

    it('throws OTP_NEEDED when session requires OTP and bypass is false', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      prismaMock.userSession.findFirst.mockResolvedValueOnce({
        ...mockDbSession,
        otpVerifyNeeded: true,
      } as any)

      await expect(
        UserSessionService.getSessionDangerously({ accessToken: 'tok', request: makeRequest(), otpVerifyBypass: false })
      ).rejects.toThrow(AuthMessages.OTP_NEEDED)
    })

    it('allows session retrieval when OTP bypass is explicitly enabled', async () => {
      redisMock.get.mockResolvedValueOnce(null)
      redisMock.setex.mockResolvedValue('OK')
      prismaMock.userSession.findFirst.mockResolvedValueOnce({
        ...mockDbSession,
        otpVerifyNeeded: true,
      } as any)
      prismaMock.user.findUnique.mockResolvedValueOnce({
        userId: 'user-1',
        email: 'test@example.com',
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

      await expect(
        UserSessionService.getSessionDangerously({
          accessToken: 'tok',
          request: makeRequest(),
          otpVerifyBypass: true,
        })
      ).resolves.toMatchObject({
        user: expect.objectContaining({ userId: 'user-1' }),
        userSession: expect.objectContaining({ userSessionId: 'session-1' }),
      })
    })
  })

  // ── rotateTokens ─────────────────────────────────────────────────────
  describe('rotateTokens', () => {
    it('throws SESSION_NOT_FOUND when session not found', async () => {
      tokenMock.verifyRefreshToken.mockReturnValueOnce({ userId: 'user-1' })
      prismaMock.userSession.findFirst.mockResolvedValueOnce(null)

      await expect(UserSessionService.rotateTokens('old-refresh')).rejects.toThrow(
        AuthMessages.SESSION_NOT_FOUND
      )
    })

    it('throws OTP_NEEDED when session has pending OTP', async () => {
      tokenMock.verifyRefreshToken.mockReturnValueOnce({ userId: 'user-1' })
      prismaMock.userSession.findFirst.mockResolvedValueOnce({
        ...mockDbSession,
        otpVerifyNeeded: true,
      } as any)

      await expect(UserSessionService.rotateTokens('old-refresh')).rejects.toThrow(
        AuthMessages.OTP_NEEDED
      )
    })

    it('returns new raw tokens on success', async () => {
      tokenMock.verifyRefreshToken.mockReturnValueOnce({ userId: 'user-1' })
      // refreshToken in session must match hash of the token passed to rotateTokens
      const sessionWithMatchingHash = { ...mockDbSession, refreshToken: 'hashed-old-refresh' }
      prismaMock.userSession.findFirst.mockResolvedValueOnce(sessionWithMatchingHash as any)
      prismaMock.userSession.update.mockResolvedValueOnce(sessionWithMatchingHash as any)
      redisMock.keys.mockResolvedValueOnce([])

      const result = await UserSessionService.rotateTokens('old-refresh')
      expect(result).toHaveProperty('rawAccessToken')
      expect(result).toHaveProperty('rawRefreshToken')
    })

    it('rejects old refresh token usage after logout/session revocation', async () => {
      tokenMock.verifyRefreshToken.mockReturnValueOnce({ userId: 'user-1', userSessionId: 'session-1' } as any)
      prismaMock.userSession.findFirst.mockResolvedValueOnce(null)

      await expect(UserSessionService.rotateTokens('revoked-refresh-token')).rejects.toThrow(
        AuthMessages.SESSION_NOT_FOUND
      )
    })

    it('detects token reuse on back-to-back rotate attempts with the same refresh token', async () => {
      tokenMock.verifyRefreshToken.mockReturnValue({ userId: 'user-1', userSessionId: 'session-1' } as any)

      prismaMock.userSession.findFirst
        .mockResolvedValueOnce({ ...mockDbSession, refreshToken: 'hashed-old-refresh' } as any)
        .mockResolvedValueOnce({
          ...mockDbSession,
          refreshToken: 'hashed-rotated-refresh',
          userSessionId: 'session-1',
        } as any)

      prismaMock.userSession.update.mockResolvedValueOnce({} as any)
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 2 })
      redisMock.keys.mockResolvedValue([])

      await expect(UserSessionService.rotateTokens('old-refresh')).resolves.toHaveProperty(
        'rawRefreshToken'
      )

      await expect(UserSessionService.rotateTokens('old-refresh')).rejects.toThrow(
        AuthMessages.REFRESH_TOKEN_REUSED
      )

      expect(prismaMock.userSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
    })

    it('flags one of concurrent rotate attempts as reuse in race conditions', async () => {
      tokenMock.verifyRefreshToken.mockReturnValue({ userId: 'user-1', userSessionId: 'session-1' } as any)

      prismaMock.userSession.findFirst
        .mockResolvedValueOnce({ ...mockDbSession, refreshToken: 'hashed-old-refresh' } as any)
        .mockResolvedValueOnce({
          ...mockDbSession,
          refreshToken: 'hashed-rotated-refresh',
          userSessionId: 'session-1',
        } as any)

      prismaMock.userSession.update.mockResolvedValueOnce({} as any)
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 2 })
      redisMock.keys.mockResolvedValue([])

      const results = await Promise.allSettled([
        UserSessionService.rotateTokens('old-refresh'),
        UserSessionService.rotateTokens('old-refresh'),
      ])

      const fulfilled = results.filter((r) => r.status === 'fulfilled')
      const rejected = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[]

      expect(fulfilled).toHaveLength(1)
      expect(rejected).toHaveLength(1)
      expect(String(rejected[0].reason?.message ?? rejected[0].reason)).toContain(
        AuthMessages.REFRESH_TOKEN_REUSED
      )
    })

    it('returns sanitized reuse error without leaking raw refresh token', async () => {
      const rawToken = 'my-raw-refresh-token-should-not-leak'
      tokenMock.verifyRefreshToken.mockReturnValueOnce({
        userId: 'user-1',
        userSessionId: 'session-1',
      } as any)
      prismaMock.userSession.findFirst.mockResolvedValueOnce({
        ...mockDbSession,
        refreshToken: 'hashed-another-refresh',
      } as any)
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 1 })
      redisMock.keys.mockResolvedValueOnce([])

      try {
        await UserSessionService.rotateTokens(rawToken)
      } catch (error: any) {
        expect(error.message).toBe(AuthMessages.REFRESH_TOKEN_REUSED)
        expect(error.message).not.toContain(rawToken)
      }
    })
  })

  // ── destroyAllSessions ───────────────────────────────────────────────
  describe('destroyAllSessions', () => {
    it('deletes all DB sessions and clears redis cache', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 2 })
      redisMock.keys.mockResolvedValueOnce(['auth:session:user-1:abc'])
      redisMock.del.mockResolvedValue(1)

      await UserSessionService.destroyAllSessions('user-1')

      expect(prismaMock.userSession.deleteMany).toHaveBeenCalledWith({ where: { userId: 'user-1' } })
      expect(redisMock.del).toHaveBeenCalled()
    })

    it('skips redis del when no keys found', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 0 })
      redisMock.keys.mockResolvedValueOnce([])

      await UserSessionService.destroyAllSessions('user-1')

      expect(redisMock.del).not.toHaveBeenCalled()
    })

    it('uses user-scoped cache pattern to keep DB and cache consistent', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 1 })
      redisMock.keys.mockResolvedValueOnce([])

      await UserSessionService.destroyAllSessions('user-1')

      expect(redisMock.keys).toHaveBeenCalledWith('auth:session:user-1:*')
    })
  })

  // ── deleteSession ────────────────────────────────────────────────────
  describe('deleteSession', () => {
    it('deletes session from DB', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 1 })
      redisMock.keys.mockResolvedValueOnce([])

      await UserSessionService.deleteSession({ userSessionId: 'session-1', userId: 'user-1' })

      expect(prismaMock.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userSessionId: 'session-1', userId: 'user-1' },
      })
    })

    it('rejects non-owner deletion attempt (authorization matrix: non-owner denied)', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 0 })

      await expect(
        UserSessionService.deleteSession({ userSessionId: 'session-1', userId: 'attacker-user' })
      ).rejects.toThrow(AuthMessages.SESSION_NOT_FOUND)
    })

    it('allows admin override deletion by sessionId only', async () => {
      prismaMock.userSession.deleteMany.mockResolvedValueOnce({ count: 1 })
      redisMock.keys.mockResolvedValueOnce([])

      await UserSessionService.deleteSession({
        userSessionId: 'session-1',
        userId: 'admin-user',
        isAdmin: true,
      })

      expect(prismaMock.userSession.deleteMany).toHaveBeenCalledWith({
        where: { userSessionId: 'session-1' },
      })
    })
  })

  // ── getActiveSessions ────────────────────────────────────────────────
  describe('getActiveSessions', () => {
    it('returns sessions ordered by createdAt desc', async () => {
      const sessions = [mockDbSession]
      prismaMock.userSession.findMany.mockResolvedValueOnce(sessions as any)

      const result = await UserSessionService.getActiveSessions('user-1')
      expect(result).toHaveLength(1)
      expect(prismaMock.userSession.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ userId: 'user-1' }),
          orderBy: { createdAt: 'desc' },
        })
      )
    })

    it('filters only non-expired sessions', async () => {
      prismaMock.userSession.findMany.mockResolvedValueOnce([])
      await UserSessionService.getActiveSessions('user-1')
      const whereClause = prismaMock.userSession.findMany.mock.calls[0][0].where as any
      expect(whereClause.sessionExpiry).toEqual({ gte: expect.any(Date) })
    })
  })
})
