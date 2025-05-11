import { UserSession, UserRole } from "@prisma/client";
import prisma from "@/libs/prisma";

// Other Services
import UserService from "../UserService";
// Utils
import SafeUserSession from "@/types/SafeUserSession";
import SafeUser from "@/types/SafeUser";
import jwt from 'jsonwebtoken';
import crypto from "crypto";
import AuthMessages from "@/messages/AuthMessages";

import { v4 as uuidv4 } from "uuid";


const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET; // Burada bir varsayılan değer belirleyebilirsiniz
const ACCESS_TOKEN_EXPIRES_IN = process.env.ACCESS_TOKEN_EXPIRES_IN || '1h'; // veya '1h' gibi

const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET; // Burada bir varsayılan değer belirleyebilirsiniz
const REFRESH_TOKEN_EXPIRES_IN: string | number = process.env.REFRESH_TOKEN_EXPIRES_IN || '7d'; // veya '7d' gibi

const SESSION_EXPIRY_MS = parseInt(process.env.SESSION_EXPIRY_MS || `${1000 * 60 * 60 * 24 * 7}`); // 7 gün


if (!ACCESS_TOKEN_SECRET || !REFRESH_TOKEN_SECRET) {
  throw new Error("Missing JWT secrets in environment variables.");
}

if (isNaN(SESSION_EXPIRY_MS)) {
  throw new Error("Invalid SESSION_EXPIRY_MS value in environment variables.");
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
  static async getSessionDangerously(accessToken: string , request: NextRequest): Promise<{ user: SafeUser, userSession: SafeUserSession }> {

    // Verify the access token
    const deviceFingerprint = await UserSessionService.generateDeviceFingerprint(request);

    const { userId } = await UserSessionService.verifyAccessToken(accessToken, deviceFingerprint);

    // Check if the device fingerprint is provided
    const hashedAccessToken = UserSessionService.hashToken(accessToken);

    const userSession = await prisma.userSession.findFirst({
      where: {
        accessToken: hashedAccessToken,
        deviceFingerprint: deviceFingerprint,
        sessionExpiry: {
          gte: new Date(), // Check if the session is not expired   
        },

      },
    })

    if (!userSession || userSession.userId !== userId) {
      throw new Error(AuthMessages.SESSION_NOT_FOUND);
    }

    // Otp needed kontrolü
    if (userSession.otpVerifyNeeded) {
      throw new Error(AuthMessages.OTP_NEEDED);
    }

    // Check if the connection is from the same device
    if (userSession.deviceFingerprint !== deviceFingerprint) {
      throw new Error(AuthMessages.DEVICE_FINGERPRINT_NOT_MATCH);
    }

    // Check if the session 
    const user = await prisma.user.findUnique({
      where: { userId: userSession.userId },
    })

    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }

    return {
      user: UserService.omitSensitiveFields(user),
      userSession: UserSessionService.omitSensitiveFields(userSession),
    };
  }

  /**
   * Omits sensitive fields from the user session.
   * @param session - The user session.
   * @returns The user session without sensitive fields.
   */
  static async getSession(accessToken: string , request: NextRequest): Promise<{ user: SafeUser, userSession: SafeUserSession }> {
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


  public static async refreshAccessToken(currentRefreshToken: string) {

    // Decode the refresh token
    const { userId } = await UserSessionService.verifyRefreshToken(currentRefreshToken);

    const userSession = await prisma.userSession.findFirst({
      where: {
        refreshToken: UserSessionService.hashToken(currentRefreshToken),
        userId: userId,
        sessionExpiry: {
          gte: new Date(), // Check if the session is not expired
        },
      },
    });


    if (!userSession) throw new Error(AuthMessages.SESSION_NOT_FOUND);


    // Otp needed kontrolü
    if (userSession.otpVerifyNeeded) {
      throw new Error(AuthMessages.OTP_NEEDED);
    }

    const hashed = this.hashToken(currentRefreshToken);

    // 🔁 Refresh token reuse kontrolü
    if (userSession.refreshToken !== hashed) {
      // Reuse detected: tüm oturumları sil
      await prisma.userSession.deleteMany({
        where: {
          userId: userSession.userId,
        },
      });

      throw new Error(AuthMessages.REFRESH_TOKEN_REUSED); // ya da 401
    }

    // 🔄 Token rotation
    const newAccessToken = this.generateAccessToken(userSession.userId, userSession.userSessionId, userSession.deviceFingerprint!);
    const newRefreshToken = this.generateRefreshToken(userSession.userId, userSession.userSessionId, userSession.deviceFingerprint!);
    const newRefreshTokenHash = this.hashToken(newRefreshToken);

    const updatedSession = await prisma.userSession.update({
      where: { userSessionId: userSession.userSessionId },
      data: {
        accessToken: this.hashToken(newAccessToken),
        refreshToken: newRefreshTokenHash,
        sessionExpiry: new Date(Date.now() + SESSION_EXPIRY_MS),
      }
    });

    return {
      userSession: this.omitSensitiveFields(updatedSession),
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
    // Delete all sessions except the current one
    await prisma.userSession.deleteMany({
      where: {
        userId: userSession.userId,
        userSessionId: {
          not: userSession.userSessionId,
        },
      },
    });
  }



  /**
   * Deletes a user session.
   * @param data - The user session data to delete.
   */

  static async deleteSession(data: SafeUserSession): Promise<void> {

    await prisma.userSession.deleteMany({
      where: { userSessionId: data.userSessionId },
    });

  }


  /**
   * Authenticate a user by access token.
   * @param accessToken - The access token to authenticate.
   * @returns The authenticated user.
   */
  static async authenticateUserByRequest(request: NextRequest, requiredUserRole = "ADMIN"): Promise<SafeUser | null> {

    if (requiredUserRole === "GUEST") {
      return null;
    }

    const accessToken = request.cookies.get("accessToken")?.value;
    const refreshToken = request.cookies.get("refreshToken")?.value;

    if (!accessToken || !refreshToken) {
      throw new Error(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE);
    }
  


    const { user, userSession } = await UserSessionService.getSession(accessToken, request);

    if (!user) {
      console.log("user no")
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

    console.log(request.user)

    request.user = user;

    return user;
  }
}



