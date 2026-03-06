import { prisma } from '@/libs/prisma'

// Utils
import { SafeUserSession } from '@/types/user/UserSessionTypes'
import { SafeUser, SafeUserSchema } from '@/types/user/UserTypes'
import AuthMessages from '@/messages/AuthMessages'
import TokenService from './TokenService'
import DeviceFingerprintService from './DeviceFingerprintService'
import { SESSION_EXPIRY_MS, SESSION_REDIS_EXPIRY_MS, SESSION_CACHE_KEY } from './constants'

import { v4 as uuidv4 } from 'uuid'
import redisInstance from '@/libs/redis'
import { SafeUserSecurity } from '@/types/user/UserSecurityTypes'
import { UserSession } from '@/generated/prisma'

export default class UserSessionService {
  static readonly UserSessionOmitSelect = {
    userId: true,
    userSessionId: true,
  }

  /**
   * Creates a new user session.
   * @param user - The authenticated user.
   * @param request - The HTTP request object.
   * @param userSecurity - The user's security settings.
   * @param otpIgnore - Whether to skip OTP requirement.
   * @returns The created session with raw tokens.
   */
  static async createSession({
    user,
    request,
    userSecurity,
    otpIgnore = false,
  }: {
    user: SafeUser
    request: NextRequest
    userSecurity: SafeUserSecurity
    otpIgnore?: boolean
  }): Promise<{
    userSession: SafeUserSession
    rawAccessToken: string
    rawRefreshToken: string
  }> {
    const deviceFingerprint =
      await DeviceFingerprintService.generateDeviceFingerprint(request)

    const userSessionId = uuidv4()

    const rawAccessToken = TokenService.generateAccessToken(
      user.userId,
      userSessionId,
      deviceFingerprint
    )
    const hashedAccessToken = TokenService.hashToken(rawAccessToken)

    const rawRefreshToken = TokenService.generateRefreshToken(
      user.userId,
      userSessionId,
      deviceFingerprint
    )
    const hashedRefreshToken = TokenService.hashToken(rawRefreshToken)

    const otpVerifyNeeded = !otpIgnore && userSecurity.otpMethods.length > 0

    const userSession = await prisma.userSession.create({
      data: {
        userSessionId: userSessionId,
        userId: user.userId,
        accessToken: hashedAccessToken,
        refreshToken: hashedRefreshToken,
        sessionExpiry: new Date(Date.now() + SESSION_EXPIRY_MS),
        deviceFingerprint: deviceFingerprint,
        otpVerifyNeeded,
      },
    })

    return {
      userSession: UserSessionService.omitSensitiveFields(userSession),
      rawAccessToken,
      rawRefreshToken,
    }
  }

  /**
   * Gets a user session by token (with Redis cache).
   * @param accessToken - The session access token.
   * @param request - The HTTP request object.
   * @param otpVerifyBypass - Whether to bypass OTP verification.
   * @returns The user and session.
   */
  static async getSessionDangerously({
    accessToken,
    request,
    otpVerifyBypass = false,
  }: {
    accessToken: string
    request: NextRequest
    otpVerifyBypass?: boolean
  }): Promise<{ user: SafeUser; userSession: SafeUserSession }> {
    const deviceFingerprint =
      await DeviceFingerprintService.generateDeviceFingerprint(request)
    const { userId } = await TokenService.verifyAccessToken(accessToken, deviceFingerprint)

    const cacheKey = SESSION_CACHE_KEY(userId, TokenService.hashToken(accessToken))

    // 1️⃣ Try from Redis cache first
    const cached = await redisInstance.get(cacheKey)
    if (cached) {
      const { user, userSession } = JSON.parse(cached)
      return { user, userSession }
    }

    // 2️⃣ If not cached, query DB
    const hashedAccessToken = TokenService.hashToken(accessToken)

    const userSession = await prisma.userSession.findFirst({
      where: {
        accessToken: hashedAccessToken,
        deviceFingerprint: deviceFingerprint,
        sessionExpiry: { gte: new Date() },
      },
    })

    if (!userSession || userSession.userId !== userId)
      throw new Error(AuthMessages.SESSION_NOT_FOUND)
    if (userSession.otpVerifyNeeded && !otpVerifyBypass) throw new Error(AuthMessages.OTP_NEEDED)
    if (userSession.deviceFingerprint !== deviceFingerprint)
      throw new Error(AuthMessages.DEVICE_FINGERPRINT_NOT_MATCH)

    const user = await prisma.user.findUnique({ where: { userId: userSession.userId } })
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND)

    const safeUser = SafeUserSchema.parse(user)
    const safeSession = UserSessionService.omitSensitiveFields(userSession)

    // 3️⃣ Cache result in Redis
    const ttlSeconds = Math.floor(SESSION_REDIS_EXPIRY_MS / 1000)
    await redisInstance.setex(
      cacheKey,
      ttlSeconds,
      JSON.stringify({ user: safeUser, userSession: safeSession })
    )

    return { user: safeUser, userSession: safeSession }
  }

  /**
   * Gets a user session by access token.
   * @param accessToken - The session access token.
   * @param request - The HTTP request object.
   * @param otpVerifyBypass - Whether to bypass OTP verification.
   * @returns The user and session.
   */
  static async getSession({
    accessToken,
    request,
    otpVerifyBypass = false,
  }: {
    accessToken: string
    request: NextRequest
    otpVerifyBypass?: boolean
  }): Promise<{ user: SafeUser; userSession: SafeUserSession }> {
    const { user, userSession } = await UserSessionService.getSessionDangerously({
      accessToken,
      request,
      otpVerifyBypass,
    })

    return { user, userSession }
  }

  /**
   * Omits sensitive fields from the user session.
   * @param session - The user session.
   * @returns The user session without sensitive fields.
   */
  static omitSensitiveFields(session: UserSession): SafeUserSession {
    return {
      userSessionId: session.userSessionId,
      userId: session.userId,
      otpVerifyNeeded: session.otpVerifyNeeded,
      sessionExpiry: session.sessionExpiry,
    }
  }

  /**
   * Rotate tokens for a session (with reuse detection).
   * @param currentRefreshToken - The current refresh token.
   * @returns The new tokens.
   */
  static async rotateTokens(currentRefreshToken: string) {
    const decoded = await TokenService.verifyRefreshToken(currentRefreshToken)
    const hashedRefreshToken = TokenService.hashToken(currentRefreshToken)

    const session = await prisma.userSession.findFirst({
      where: {
        refreshToken: hashedRefreshToken,
        userId: decoded.userId,
        sessionExpiry: { gte: new Date() },
      },
    })

    if (!session) {
      throw new Error(AuthMessages.SESSION_NOT_FOUND)
    }

    if (session.otpVerifyNeeded) {
      throw new Error(AuthMessages.OTP_NEEDED)
    }

    // Reuse detection
    if (session.refreshToken !== hashedRefreshToken) {
      await prisma.userSession.deleteMany({
        where: { userId: decoded.userId },
      })

      const keys = await redisInstance.keys(SESSION_CACHE_KEY(decoded.userId, '*'))
      if (keys.length) await redisInstance.del(...keys)

      throw new Error(AuthMessages.REFRESH_TOKEN_REUSED)
    }

    const newAccessToken = TokenService.generateAccessToken(
      session.userId,
      session.userSessionId,
      session.deviceFingerprint!
    )

    const newRefreshToken = TokenService.generateRefreshToken(
      session.userId,
      session.userSessionId,
      session.deviceFingerprint!
    )

    await prisma.userSession.update({
      where: { userSessionId: session.userSessionId },
      data: {
        accessToken: TokenService.hashToken(newAccessToken),
        refreshToken: TokenService.hashToken(newRefreshToken),
        sessionExpiry: new Date(Date.now() + SESSION_EXPIRY_MS),
      },
    })

    // Invalidate old Redis caches
    const keys = await redisInstance.keys(SESSION_CACHE_KEY(session.userId, '*'))
    if (keys.length) await redisInstance.del(...keys)

    return {
      rawAccessToken: newAccessToken,
      rawRefreshToken: newRefreshToken,
    }
  }

  /**
   * Returns all active sessions for a user (for session management UI).
   */
  static async getActiveSessions(userId: string) {
    const sessions = await prisma.userSession.findMany({
      where: {
        userId,
        sessionExpiry: { gte: new Date() },
      },
      orderBy: { createdAt: 'desc' },
      select: {
        userSessionId: true,
        userId: true,
        sessionExpiry: true,
        otpVerifyNeeded: true,
        createdAt: true,
        os: true,
        browser: true,
        device: true,
        ip: true,
        city: true,
        state: true,
        country: true,
      },
    })
    return sessions
  }

  /**
   * Destroy all other sessions of the user.
   * @param userSession - The current user session.
   */
  static async destroyOtherSessions(userSession: SafeUserSession): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        userId: userSession.userId,
        userSessionId: { not: userSession.userSessionId },
      },
    })

    const pattern = SESSION_CACHE_KEY(userSession.userId, '*')
    const keys = await redisInstance.keys(pattern)
    if (keys.length > 0) await redisInstance.del(...keys)
  }

  /**
   * Destroy ALL sessions of the user including the current one.
   * @param userId - The user's ID.
   */
  static async destroyAllSessions(userId: string): Promise<void> {
    await prisma.userSession.deleteMany({ where: { userId } })

    const pattern = SESSION_CACHE_KEY(userId, '*')
    const keys = await redisInstance.keys(pattern)
    if (keys.length > 0) await redisInstance.del(...keys)
  }

  /**
   * Deletes a user session.
   * @param userSession - The user session data to delete.
   */
  static async deleteSession(
    userSession: Pick<UserSession, 'userSessionId' | 'userId'>
  ): Promise<void> {
    const { userSessionId, userId } = userSession

    await prisma.userSession.deleteMany({
      where: { userSessionId: userSessionId },
    })

    const pattern = SESSION_CACHE_KEY(userId, userSessionId)
    const keys = await redisInstance.keys(pattern)
    if (keys.length > 0) await redisInstance.del(...keys)
  }

  /**
   * Updates a user session.
   * @param userSessionId - The session ID to update.
   * @param data - The partial session data to update.
   * @returns The updated safe user session.
   */
  static async updateSession(
    userSessionId: string,
    data: Partial<UserSession>
  ): Promise<SafeUserSession> {
    const updatedSession = await prisma.userSession.update({
      where: { userSessionId },
      data,
    })

    const pattern = SESSION_CACHE_KEY(updatedSession.userId, '*')
    const keys = await redisInstance.keys(pattern)
    if (keys.length > 0) await redisInstance.del(...keys)

    return UserSessionService.omitSensitiveFields(updatedSession)
  }
}
