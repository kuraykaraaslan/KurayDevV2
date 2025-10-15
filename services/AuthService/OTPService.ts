import { OTPMethod, User } from "@prisma/client";
import redis from "@/libs/redis";
import {prisma} from '@/libs/prisma';
import AuthMessages from "@/messages/AuthMessages";
import MailService from "../NotificationService/MailService";
import SMSService from "../NotificationService/SMSService";

export default class OTPService {
  static OTP_EXPIRY_SECONDS = parseInt(process.env.OTP_EXPIRY_SECONDS || "600");
  static OTP_LENGTH = parseInt(process.env.OTP_LENGTH || "6");

  static generateToken(length = OTPService.OTP_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString().padStart(length, "0");
  }

  static getRedisKey(userId: string, method: OTPMethod) {
    return `otp:activate:${userId}:${method}`;
  }

  static getRateKey(userId: string, method: OTPMethod) {
    return `otp:activate:rate:${userId}:${method}`;
  }

  static getDeactivationKey(userId: string, method: OTPMethod) {
    return `otp:deactivate:${userId}:${method}`;
  }

  static getDeactivationRateKey(userId: string, method: OTPMethod) {
    return `otp:deactivate:rate:${userId}:${method}`;
  }


  static async requestOTP({ user, method }: { user: Pick<User, 'userId' | 'email' | 'phone' | 'name' | 'otpMethods'>; method: OTPMethod }) {
    if (method === OTPMethod.TOTP_APP || method === OTPMethod.PUSH_APP) {
      throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }

    const rateKey = this.getRateKey(user.userId, method);
    if (await redis.get(rateKey)) {
      throw new Error(AuthMessages.OTP_ALREADY_SENT);
    }

    const token = this.generateToken();
    const redisKey = this.getRedisKey(user.userId, method);
    await redis.set(redisKey, token, "EX", this.OTP_EXPIRY_SECONDS);
    await redis.set(rateKey, "1", "EX", 60);

    switch (method) {
      case OTPMethod.EMAIL:
        if (!user.email) throw new Error("No email on file.");
        await MailService.sendOTPEmail({
          email: user.email,
          name: user.name,
          otpToken: token,
        });
        break;

      case OTPMethod.SMS:
        if (!user.phone) throw new Error("No phone number on file.");
        await SMSService.sendShortMessage({
          to: user.phone,
          body: `Your OTP code to activate SMS login is ${token}.`,
        });
        break;
    }
  }

  static async verifyOTPAndActivate({
    user,
    method,
    otpToken,
  }: {
    user: Pick<User, 'userId' | 'email' | 'phone' | 'name' | 'otpMethods'>;
    method: OTPMethod;
    otpToken: string;
  }) {
    const redisKey = this.getRedisKey(user.userId, method);
    const storedToken = await redis.get(redisKey);

    if (!storedToken || storedToken !== otpToken) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        otpMethods: {
          set: Array.from(new Set([...user.otpMethods, method])),
        },
      },
    });

    await redis.del(redisKey);
    await redis.del(this.getRateKey(user.userId, method));
  }


  static async requestDeactivation({ user, method }: { user: Pick<User, 'userId' | 'email' | 'phone' | 'name' | 'otpMethods'>; method: OTPMethod }) {
    if (!user.otpMethods.includes(method)) {
      throw new Error(`This method (${method}) is not currently active.`);
    }

    const rateKey = this.getDeactivationRateKey(user.userId, method);
    if (await redis.get(rateKey)) {
      throw new Error(AuthMessages.OTP_ALREADY_SENT);
    }

    const token = this.generateToken();
    const redisKey = this.getDeactivationKey(user.userId, method);
    await redis.set(redisKey, token, "EX", this.OTP_EXPIRY_SECONDS);
    await redis.set(rateKey, "1", "EX", 60);

    switch (method) {
      case OTPMethod.EMAIL:
        if (!user.email) throw new Error("No email on file.");
        await MailService.sendOTPEmail({
          email: user.email,
          name: user.name,
          otpToken: token,
        });
        break;

      case OTPMethod.SMS:
        if (!user.phone) throw new Error("No phone number on file.");
        await SMSService.sendShortMessage({
          to: user.phone,
          body: `Your OTP code to deactivate SMS login is ${token}.`,
        });
        break;

      default:
        throw new Error(AuthMessages.INVALID_OTP_METHOD);
    }
  }

  static async verifyDeactivation({
    user,
    method,
    otpToken,
  }: {
    user: Pick<User, 'userId' | 'email' | 'phone' | 'name' | 'otpMethods'>;
    method: OTPMethod;
    otpToken: string;
  }) {
    const redisKey = this.getDeactivationKey(user.userId, method);
    const storedToken = await redis.get(redisKey);

    if (!storedToken || storedToken !== otpToken) {
      throw new Error(AuthMessages.INVALID_OTP);
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        otpMethods: {
          set: user.otpMethods.filter((m) => m !== method),
        },
      },
    });

    await redis.del(redisKey);
    await redis.del(this.getDeactivationRateKey(user.userId, method));
  }

  static listOTPStatus(user: User): { active: OTPMethod[]; inactive: OTPMethod[] } {
    const all: OTPMethod[] = [OTPMethod.EMAIL, OTPMethod.SMS, OTPMethod.TOTP_APP, OTPMethod.PUSH_APP];
    return {
      active: user.otpMethods,
      inactive: all.filter((m) => !user.otpMethods.includes(m)),
    };
  }
}
