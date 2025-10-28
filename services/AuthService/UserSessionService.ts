import { UserSession, UserRole } from "@prisma/client";
import {prisma} from '@/libs/prisma';

// Other Services
import UserService from "../UserService";
// Utils
import { SafeUserSession } from "@/types/UserSessionTypes";
import { SafeUser } from "@/types/UserTypes";
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import AuthMessages from "@/messages/AuthMessages";

import { v4 as uuidv4 } from "uuid";
import redisInstance from "@/libs/redis";


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET; // Burada bir varsayılan değer belirleyebilirsiniz
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'; // veya '1h' gibi

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET; // Burada bir varsayılan değer belirleyebilirsiniz
const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // veya '7d' gibi

const SESSION_EXPIRY_MS = parseInt(process.env.SESSION_EXPIRY_MS || `${1000 * 60 * 60 * 24 * 7}`); // 7 gün
const SESSION_REDIS_EXPIRY_MS = parseInt(process.env.SESSION_REDIS_EXPIRY_MS || `${1000 * 60 * 30}`); // 30 min default


if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("Missing JWT secrets in environment variables.");
}

if (isNaN(SESSION_EXPIRY_MS)) {
  throw new Error("Invalid SESSION_EXPIRY_MS value in environment variables.");
}

if (isNaN(SESSION_REDIS_EXPIRY_MS)) {
  throw new Error("Invalid SESSION_REDIS_EXPIRY_MS value in environment variables.");
}

export default class UserSessionService {



  static readonly UserSessionOmitSelect = {
    userId: true,
    userSessionId: true,
  }


  /*
   * Generate Session CUID Token
    * @param userId - The user ID.
    * @param userSessionId - The session ID.
    * @param deviceFingerprint - The device fingerprint.
  * @returns A random cuid token.
  */
  private static generateAccessToken(userId: string, userSessionId: string, deviceFingerprint: string): string {

    if (!ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }

    // @ts-expect-error: this is a valid use of the jwt.sign method 
    return jwt.sign(
      {
        userId: userId,
        userSessionId: userSessionId, // her session için eşsiz
        deviceFingerprint: deviceFingerprint,
      },
      ACCESS_TOKEN_SECRET,
      {
        subject: userId,                // sub: userId
        issuer: 'relatia.kuray.dev',    // iss
        audience: 'web',                // aud
        expiresIn: ACCESS_TOKEN_EXPIRES_IN, // exp
      }
    );
  }

  /**
   * Generate Refresh Token
   * @param userId - The user ID.
   * @param userSessionId - The session ID.
   * @param deviceFingerprint - The device fingerprint.
   * @returns A random refresh token.
   */

  private static generateRefreshToken(userId: string, userSessionId: string, deviceFingerprint: string): string {
    // @ts-expect-error: this is a valid use of the jwt.sign method
    return jwt.sign(
      {
        userId: userId,
        deviceFingerprint: deviceFingerprint,
        userSessionId: userSessionId, // her session için eşsiz
      },
      REFRESH_TOKEN_SECRET as string,
      {
        subject: userId,
        issuer: 'relatia.kuray.dev',
        audience: 'web',
        expiresIn: REFRESH_TOKEN_EXPIRES_IN,
        notBefore: 5, // 5 saniye sonra geçerli
      }
    );
  }


  /**
   * Verifies a access token.
   * @param token - The access token to verify.
   * 
   * @returns The decoded token payload.
   */
  static async verifyAccessToken(token: string, deviceFingerprint: string): Promise<{ userId: string }> {

    if (!ACCESS_TOKEN_SECRET) {
      throw new Error("ACCESS_TOKEN_SECRET is not defined");
    }

    try {

      const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET, {
        issuer: 'relatia.kuray.dev',
        audience: 'web',
      }) as { userId: string, deviceFingerprint: string, userSessionId: string };

      if (decoded.deviceFingerprint !== deviceFingerprint) {
        throw new Error(AuthMessages.INVALID_TOKEN);
      }

      return { userId: decoded.userId };
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error(AuthMessages.TOKEN_EXPIRED);
      }
      throw new Error(AuthMessages.INVALID_TOKEN);
    }
  }


  /**
   * Verifies a refresh token.
   * @param token - The refresh token to verify.
   * @returns The decoded token payload.
   */
  static verifyRefreshToken(token: string): any {

    if (!REFRESH_TOKEN_SECRET) {
      throw new Error("REFRESH_TOKEN_SECRET is not defined");
    }

    try {
      const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET, {
        issuer: 'relatia.kuray.dev',
        audience: 'web',
      }) as { userId: string };

      return decoded;
    } catch (error: any) {
      if (error.name === "TokenExpiredError") {
        throw new Error(AuthMessages.TOKEN_EXPIRED);
      }
      throw new Error(AuthMessages.INVALID_TOKEN);
    }
  }

  /**
   * Hashes a token using SHA-256.
   * @param token - The access token to verify.
   * @returns The decoded token payload.
   */
  static hashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
  }


  /**
   * Generates a device fingerprint based on the request headers.
   * @param request - The HTTP request object.
   * @returns A promise that resolves to the device fingerprint.
   */
  static async generateDeviceFingerprint(request: NextRequest): Promise<string> {
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || request.headers.get("cf-connecting-ip") || request.headers.get("remote-addr") || request.headers.get("x-client-ip") || request.headers.get("x-cluster-client-ip") || request.headers.get("x-original-forwarded-for") || request.headers.get("forwarded-for") || request.headers.get("forwarded");
    const userAgent = request.headers.get("user-agent") || "";
    const acceptLanguage = request.headers.get("accept-language") || "";

    const rawFingerprint = `${ip}|${userAgent}|${acceptLanguage}`;
    return crypto.createHash("sha256").update(rawFingerprint).digest("hex");
  }


  /**
   * Creates a new user session.
   * @param userId - The user ID.
   * @returns The created session.
   */
  static async createSession(user: SafeUser, request: NextRequest, otpIgnore: boolean = false): Promise<
    {
      userSession: SafeUserSession,
      otpVerifyNeeded: boolean,
      rawAccessToken: string,
      rawRefreshToken: string
    }> {

    const deviceFingerprint = await UserSessionService.generateDeviceFingerprint(request);


    // Generate a random session ID
    const userSessionId = uuidv4();

    const rawAccessToken = UserSessionService.generateAccessToken(user.userId, userSessionId, deviceFingerprint);
    const hashedAccessToken = UserSessionService.hashToken(rawAccessToken);



    const rawRefreshToken = UserSessionService.generateRefreshToken(user.userId, userSessionId, deviceFingerprint);
    const hashedRefreshToken = UserSessionService.hashToken(rawRefreshToken);

    const otpVerifyNeeded = !otpIgnore && user.otpMethods && user.otpMethods.length > 0;

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
    });


    return {
      userSession: UserSessionService.omitSensitiveFields(userSession),
      otpVerifyNeeded: userSession.otpVerifyNeeded,
      rawAccessToken,
      rawRefreshToken,
    };

  }

  /**
   * Gets a user session by token.
   * @param accessToken - The session token.
   * @returns The user session.
   */
  static async getSessionDangerously(
    accessToken: string,
    request: NextRequest
  ): Promise<{ user: SafeUser; userSession: SafeUserSession }> {
    const deviceFingerprint = await UserSessionService.generateDeviceFingerprint(request);
    const { userId } = await UserSessionService.verifyAccessToken(accessToken, deviceFingerprint);

    const cacheKey = `session:${userId}:${UserSessionService.hashToken(accessToken)}`;

    // 1️⃣ Try from Redis cache first
    const cached = await redisInstance.get(cacheKey);
    if (cached) {
      const { user, userSession } = JSON.parse(cached);
      return { user, userSession };
    }

    // 2️⃣ If not cached, query DB
    const hashedAccessToken = UserSessionService.hashToken(accessToken);

    const userSession = await prisma.userSession.findFirst({
      where: {
        accessToken: hashedAccessToken,
        deviceFingerprint: deviceFingerprint,
        sessionExpiry: { gte: new Date() },
      },
    });

    if (!userSession || userSession.userId !== userId)
      throw new Error(AuthMessages.SESSION_NOT_FOUND);
    if (userSession.otpVerifyNeeded)
      throw new Error(AuthMessages.OTP_NEEDED);
    if (userSession.deviceFingerprint !== deviceFingerprint)
      throw new Error(AuthMessages.DEVICE_FINGERPRINT_NOT_MATCH);

    const user = await prisma.user.findUnique({ where: { userId: userSession.userId } });
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND);

    const safeUser = UserService.omitSensitiveFields(user);
    const safeSession = UserSessionService.omitSensitiveFields(userSession);

    // 3️⃣ Cache result in Redis
    const ttlSeconds = Math.floor(SESSION_REDIS_EXPIRY_MS / 1000);
    await redisInstance.setex(cacheKey, ttlSeconds, JSON.stringify({ user: safeUser, userSession: safeSession }));

    return { user: safeUser, userSession: safeSession };
  }

  /**
   * Omits sensitive fields from the user session.
   * @param session - The user session.
   * @returns The user session without sensitive fields.
   */
  static async getSession(accessToken: string, request: NextRequest): Promise<{ user: SafeUser, userSession: SafeUserSession }> {
    // Get the session using the provided access token
    const { user, userSession } = await UserSessionService.getSessionDangerously(accessToken, request);

    // Check if the session is expired
    return {
      user: user,
      userSession: userSession,
    };
  }

  static omitSensitiveFields(session: UserSession): SafeUserSession {
    return {
      userSessionId: session.userSessionId,
      userId: session.userId,
      otpVerifyNeeded: session.otpVerifyNeeded,
      sessionExpiry: session.sessionExpiry,
    };
  }


  static async refreshAccessToken(currentRefreshToken: string) {
    // 🔍 Decode & verify refresh token
    const { userId } = await UserSessionService.verifyRefreshToken(currentRefreshToken);

    // Hash the current refresh token for DB lookup
    const hashedRefreshToken = UserSessionService.hashToken(currentRefreshToken);

    // 🔎 Find the session in DB
    const userSession = await prisma.userSession.findFirst({
      where: {
        refreshToken: hashedRefreshToken,
        userId,
        sessionExpiry: { gte: new Date() },
      },
    });

    if (!userSession) throw new Error(AuthMessages.SESSION_NOT_FOUND);
    if (userSession.otpVerifyNeeded) throw new Error(AuthMessages.OTP_NEEDED);

    // 🚨 Reuse detection: verify the stored token matches hash
    if (userSession.refreshToken !== hashedRefreshToken) {
      // Token reuse detected → invalidate all sessions
      await prisma.userSession.deleteMany({ where: { userId: userSession.userId } });

      // 🔥 Remove from Redis immediately
      const pattern = `session:${userSession.userId}:*`;
      const keys = await redisInstance.keys(pattern);
      if (keys.length > 0) await redisInstance.del(...keys);

      throw new Error(AuthMessages.REFRESH_TOKEN_REUSED);
    }

    // 🔁 Generate new tokens
    const newAccessToken = UserSessionService.generateAccessToken(
      userSession.userId,
      userSession.userSessionId,
      userSession.deviceFingerprint!
    );

    const newRefreshToken = UserSessionService.generateRefreshToken(
      userSession.userId,
      userSession.userSessionId,
      userSession.deviceFingerprint!
    );

    const newRefreshTokenHash = UserSessionService.hashToken(newRefreshToken);
    const newAccessTokenHash = UserSessionService.hashToken(newAccessToken);

    // 🕓 Update DB session
    const updatedSession = await prisma.userSession.update({
      where: { userSessionId: userSession.userSessionId },
      data: {
        accessToken: newAccessTokenHash,
        refreshToken: newRefreshTokenHash,
        sessionExpiry: new Date(Date.now() + SESSION_EXPIRY_MS),
      },
    });

    // 🧹 Invalidate old Redis caches
    const pattern = `session:${userSession.userId}:*`;
    const keys = await redisInstance.keys(pattern);
    if (keys.length > 0) await redisInstance.del(...keys);

    // ⚡ Cache the updated session with new tokens
    const safeSession = UserSessionService.omitSensitiveFields(updatedSession);
    const ttlSeconds = Math.floor(SESSION_REDIS_EXPIRY_MS / 1000);

    await redisInstance.setex(
      `session:${userSession.userId}:${newAccessTokenHash}`,
      ttlSeconds,
      JSON.stringify({
        userSession: safeSession,
        // Optional: You may also cache user details if needed for getSessionDangerously
      })
    );

    // ✅ Return new tokens & session
    return {
      userSession: safeSession,
      rawAccessToken: newAccessToken,
      rawRefreshToken: newRefreshToken,
    };
  }



  /**
   * Destroy all other sessions of the user.
   * 
   * @param userSession - The current user session.
   * @returns A promise that resolves when the sessions are destroyed.
   */
  static async destroyOtherSessions(userSession: SafeUserSession): Promise<void> {
    await prisma.userSession.deleteMany({
      where: {
        userId: userSession.userId,
        userSessionId: { not: userSession.userSessionId },
      },
    });

    // 🧹 Clear all Redis caches except the current session
    const pattern = `session:${userSession.userId}:*`;
    const keys = await redisInstance.keys(pattern);
    if (keys.length > 0) await redisInstance.del(...keys);
  }




  /**
   * Deletes a user session.
   * @param data - The user session data to delete.
   */

  static async deleteSession(data: SafeUserSession): Promise<void> {
    await prisma.userSession.deleteMany({
      where: { userSessionId: data.userSessionId },
    });

    // 🧹 Remove related cache entries
    const pattern = `session:${data.userId}:*`;
    const keys = await redisInstance.keys(pattern);
    if (keys.length > 0) await redisInstance.del(...keys);
  }



  /**
   * Authenticate a user by access token.
   * @param accessToken - The access token to authenticate.
   * @returns The authenticated user.
   */
  static async authenticateUserByRequest(request: NextRequest, requiredUserRole = "ADMIN"): Promise<SafeUser | null> {

    try {

      const accessToken = request.cookies.get("accessToken")?.value;
      const refreshToken = request.cookies.get("refreshToken")?.value;

      console.log('[AUTH] Checking cookies - accessToken:', accessToken ? 'present' : 'missing', 'refreshToken:', refreshToken ? 'present' : 'missing');

      if (!accessToken || !refreshToken) {
        throw new Error(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE);
      }

      const { user, userSession } = await UserSessionService.getSession(accessToken, request);

      if (!user) {
        throw new Error(AuthMessages.USER_NOT_FOUND);
      }

      if (userSession.otpVerifyNeeded) {
        throw new Error(AuthMessages.OTP_NEEDED);
      }

      // Check if the session is expired
      if (userSession.sessionExpiry < new Date()) {
        throw new Error(AuthMessages.SESSION_NOT_FOUND);
      }

      const userRoleKeys = Object.keys(UserRole);

      const requiredUserRoleKeyIndex = userRoleKeys.indexOf(requiredUserRole);
      const userRoleKeyIndex = userRoleKeys.indexOf(user.userRole);

      if (requiredUserRoleKeyIndex > userRoleKeyIndex) {
        throw new Error(AuthMessages.USER_NOT_AUTHENTICATED);
      }

      request.user = user;

      return user;
    } catch (error: any) {
      if (requiredUserRole !== "GUEST") {
        throw new Error(AuthMessages.USER_NOT_AUTHENTICATED);
      }
      request.user = null; // GUEST role is allowed to not be authenticated
      return null; // GUEST role is allowed to not be authenticated
    }
  }
}




