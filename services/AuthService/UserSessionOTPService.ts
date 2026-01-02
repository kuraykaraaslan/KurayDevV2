import bcrypt from "bcrypt";
import redis from "@/libs/redis";
import { OTPMethod } from "@/generated/prisma";
import MailService from "../NotificationService/MailService";
import SMSService from "../NotificationService/SMSService";
import {prisma} from '@/libs/prisma';
import AuthMessages from "@/messages/AuthMessages";
import { authenticator } from "otplib";
import {  SafeUserSession } from '@/types/user/UserSessionTypes';
import { SafeUser, UserSchema } from '@/types/user/UserTypes';
import { UserSecuritySchema } from "@/types";

export default class UserSessionOTPService {
  static OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "600"); // 10 dk
  static OTP_LENGTH = parseInt(process.env.OTP_LENGTH || "6");
  static OTP_RATE_LIMIT_SECONDS = parseInt(process.env.OTP_RATE_LIMIT_SECONDS || "60");

  static generateToken(length = this.OTP_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString().padStart(length, "0");
  }

  static async hashToken(token: string): Promise<string> {
    return bcrypt.hash(token, 10);
  }

  static async compareToken(raw: string, hashed: string): Promise<boolean> {
    return bcrypt.compare(raw, hashed);
  }

  static async generateTOTPSecret(): Promise<string> {
    const secret = authenticator.generateSecret();
    return secret;
  }

  static async getUserOTPSecret(userId: string): Promise<string | null> {
    const _user = await prisma.user.findUnique({
      where: { userId },
      select: {  },
    });

    if (!_user) throw new Error(AuthMessages.USER_NOT_FOUND);

    const user = UserSchema.parse(_user);
    const userSecurity = UserSecuritySchema.parse(user.userSecurity);
    return userSecurity.otpSecret || null;
  }

  static async rateLimitGuard(sessionId: string, method: OTPMethod) {
    const key = `otp:rate:${sessionId}:${method}`;
    const exists = await redis.get(key);
    if (exists) throw new Error(AuthMessages.OTP_ALREADY_SENT);
    await redis.set(key, "1", "EX", this.OTP_RATE_LIMIT_SECONDS);
  }

  static async storeOTP(sessionId: string, method: OTPMethod, token: string, action: string) {
    const hashed = await this.hashToken(token);
    const key = `otp:code:${sessionId}:${method}:${action}`;
    await redis.set(key, hashed, "EX", this.OTP_EXPIRY_SECONDS);
  }

  static async sendOTP({
    user,
    userSession,
    method,
    action
  }: {
    user: SafeUser;
    userSession: SafeUserSession;
    method: OTPMethod;
    action: string;
  }) {
    if (!userSession.otpVerifyNeeded)
      throw new Error(AuthMessages.OTP_NOT_NEEDED);
    if (userSession.sessionExpiry < new Date())
      throw new Error(AuthMessages.SESSION_NOT_FOUND);
  
    if (method === OTPMethod.TOTP_APP) {
      throw new Error(AuthMessages.INVALID_OTP_METHOD); // TOTP is not sent
    }
  
    const sessionId = userSession.userSessionId;
    const otpKey = `otp:code:${sessionId}:${method}`;
    const rateKey = `otp:rate:${sessionId}:${method}`;
  
    const rateCount = await redis.get(rateKey);
    if (rateCount) {
      const count = parseInt(rateCount);
      if (count >= 5) {
        throw new Error(AuthMessages.RATE_LIMIT_EXCEEDED);
      } else {
        await redis.set(rateKey, (count + 1).toString(), "EX", this.OTP_RATE_LIMIT_SECONDS);
      }
    } else {
      await redis.set(rateKey, "1", "EX", this.OTP_RATE_LIMIT_SECONDS);
    }
  
    // Delete any previous OTP
    await redis.del(otpKey);
  
    // Generate and store new OTP
    const token = this.generateToken();
    await this.storeOTP(sessionId, method, token, action);
  
    // Send OTP
    switch (method) {
      case OTPMethod.EMAIL:
        await MailService.sendOTPEmail({
          email: user.email,
          name: user.name,
          otpToken: token,
        });
        break;
  
      case OTPMethod.SMS:
        if (!user.phone)
          throw new Error(AuthMessages.INVALID_OTP_METHOD);
        await SMSService.sendShortMessage({
          to: user.phone,
          body: `Your OTP code is ${token}. Valid for ${this.OTP_EXPIRY_SECONDS / 60} minutes.`,
        });
        break;
  
      default:
        throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }
  }
  

  static async validateOTP({ user, userSession, otpToken, method, action }: { user: SafeUser; userSession: SafeUserSession; otpToken: string; method: OTPMethod; action: string; }) {
    if (!userSession.otpVerifyNeeded) throw new Error(AuthMessages.OTP_NOT_NEEDED);
    if (userSession.sessionExpiry < new Date()) throw new Error(AuthMessages.SESSION_NOT_FOUND);

    if (method === OTPMethod.TOTP_APP) {
      const otpSecret = await this.getUserOTPSecret(user.userId);
      if (!otpSecret) throw new Error(AuthMessages.INVALID_OTP_METHOD);

      const isValid = authenticator.check(otpToken, otpSecret);
      if (!isValid) throw new Error(AuthMessages.INVALID_OTP);
    } else {
      const key = `otp:code:${userSession.userSessionId}:${method}:${action}`;
      const hashed = await redis.get(key);
      if (!hashed) throw new Error(AuthMessages.OTP_EXPIRED);

      const isValid = await this.compareToken(otpToken, hashed);
      if (!isValid) throw new Error(AuthMessages.INVALID_OTP);

      await redis.del(key);
      await redis.del(`otp:rate:${userSession.userSessionId}:${method}:${action}`);
    }

    await prisma.userSession.update({
      where: { userSessionId: userSession.userSessionId },
      data: { otpVerifyNeeded: false },
    });
  }
}
