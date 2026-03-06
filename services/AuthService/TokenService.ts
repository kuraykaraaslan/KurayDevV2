import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import AuthMessages from '@/messages/AuthMessages'
import {
  APPLICATION_DOMAIN,
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_TOKEN_NOT_BEFORE,
} from './constants'

export default class TokenService {
  /**
   * Generate Access Token (JWT)
   * @param userId - The user ID.
   * @param userSessionId - The session ID.
   * @param deviceFingerprint - The device fingerprint.
   * @returns A signed JWT access token.
   */
  static generateAccessToken(
    userId: string,
    userSessionId: string,
    deviceFingerprint: string
  ): string {
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined')
    }

    // @ts-expect-error: this is a valid use of the jwt.sign method
    return jwt.sign(
      {
        userId: userId,
        userSessionId: userSessionId,
        deviceFingerprint: deviceFingerprint,
      },
      ACCESS_TOKEN_SECRET,
      {
        subject: userId,
        issuer: APPLICATION_DOMAIN,
        audience: 'web',
        expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      }
    )
  }

  /**
   * Generate Refresh Token (JWT)
   * @param userId - The user ID.
   * @param userSessionId - The session ID.
   * @param deviceFingerprint - The device fingerprint.
   * @returns A signed JWT refresh token.
   */
  static generateRefreshToken(
    userId: string,
    userSessionId: string,
    deviceFingerprint: string
  ): string {
    // @ts-expect-error: this is a valid use of the jwt.sign method
    return jwt.sign(
      {
        userId: userId,
        deviceFingerprint: deviceFingerprint,
        userSessionId: userSessionId,
      },
      REFRESH_TOKEN_SECRET as string,
      {
        subject: userId,
        issuer: APPLICATION_DOMAIN,
        audience: 'web',
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        notBefore: REFRESH_TOKEN_NOT_BEFORE,
      }
    )
  }

  /**
   * Verifies an access token.
   * @param token - The access token to verify.
   * @param deviceFingerprint - The device fingerprint to validate against.
   * @returns The decoded token payload.
   */
  static async verifyAccessToken(
    token: string,
    deviceFingerprint: string
  ): Promise<{ userId: string }> {
    if (!ACCESS_TOKEN_SECRET) {
      throw new Error('ACCESS_TOKEN_SECRET is not defined')
    }

    try {
      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: APPLICATION_DOMAIN,
        audience: 'web',
      }) as { userId: string; deviceFingerprint: string; userSessionId: string }

      if (decoded.deviceFingerprint !== deviceFingerprint) {
        throw new Error(AuthMessages.INVALID_TOKEN)
      }

      return { userId: decoded.userId }
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error(AuthMessages.TOKEN_EXPIRED)
      }
      throw new Error(AuthMessages.INVALID_TOKEN)
    }
  }

  /**
   * Verifies a refresh token.
   * @param token - The refresh token to verify.
   * @returns The decoded token payload.
   */
  static verifyRefreshToken(token: string): any {
    if (!REFRESH_TOKEN_SECRET) {
      throw new Error('REFRESH_TOKEN_SECRET is not defined')
    }

    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: APPLICATION_DOMAIN,
        audience: 'web',
      }) as { userId: string }

      return decoded
    } catch (error: any) {
      if (error.name === 'TokenExpiredError') {
        throw new Error(AuthMessages.TOKEN_EXPIRED)
      }
      throw new Error(AuthMessages.INVALID_TOKEN)
    }
  }

  /**
   * Hashes a token using SHA-256.
   * @param token - The token to hash.
   * @returns The hashed token string.
   */
  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex')
  }
}
