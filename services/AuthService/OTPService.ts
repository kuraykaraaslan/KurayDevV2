import { OTPMethod, User } from "@prisma/client";
import redis from "@/libs/redis";
import AuthMessages from "@/messages/AuthMessages";
import { SafeUser } from '@/types/user/UserTypes';
import { OTPAction } from '@/types/user/UserSecurityTypes';
import { SafeUserSession } from '@/types/user/UserSessionTypes';

export default class OTPService {
  static OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "600");
  static OTP_LENGTH = parseInt(process.env.OTP_LENGTH || "6");

  static generateToken(length = OTPService.OTP_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString().padStart(length, "0");
  }

  static getRedisKey({ userSessionId, method , action }: { userSessionId: string; method: OTPMethod; action: OTPAction | "rate" }): string {
    return `otp:${action}:${userSessionId}:${method}`;
  }


  static async requestOTP({ user, userSession, method, action }: { user: SafeUser, userSession: SafeUserSession, method: OTPMethod, action: OTPAction }) : Promise<{ otpToken: string }> {
    
    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }
    
    if (method === OTPMethod.TOTP_APP || method === OTPMethod.PUSH_APP) {
      throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }

    const rateKey = this.getRedisKey({ userSessionId: userSession.userSessionId, method, action: "rate" });
    if (await redis.get(rateKey)) {
      throw new Error(AuthMessages.OTP_ALREADY_SENT);
    } 

    const otpToken = this.generateToken();
    const redisKey = this.getRedisKey({ userSessionId: userSession.userSessionId, method, action });
    await redis.set(redisKey, otpToken, "EX", this.OTP_EXPIRY_SECONDS);
    await redis.set(rateKey, "1", "EX", 60);

    return { otpToken };
  
  }

  static async verifyOTP({
    user,
    userSession,
    method,
    action,
    otpToken,
  }: {
    user: SafeUser;
    userSession: SafeUserSession;
    method: OTPMethod;
    action: OTPAction;
    otpToken: string;
  }) {
    const redisKey = this.getRedisKey({ userSessionId: userSession.userSessionId, method, action });
    const storedToken = await redis.get(redisKey);

    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND);
    }

    if (!storedToken || storedToken !== otpToken) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    await redis.del(redisKey);
    await redis.del(this.getRedisKey({ userSessionId: userSession.userSessionId, method, action: "rate" }));
  }


  static listOTPStatus(user: User): { active: OTPMethod[]; inactive: OTPMethod[] } {
    const all: OTPMethod[] = [OTPMethod.EMAIL, OTPMethod.SMS, OTPMethod.TOTP_APP, OTPMethod.PUSH_APP];
    return {
      active: user.otpMethods,
      inactive: all.filter((m) => !user.otpMethods.includes(m)),
    };
  }
}
