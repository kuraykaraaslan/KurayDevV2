import bcrypt from "bcrypt";
import crypto from "crypto";
import redis from "@/libs/redis";
import prisma from "@/libs/prisma";
import AuthMessages from "@/messages/AuthMessages";
import MailService from "../NotificationService/MailService";
import SMSService from "../NotificationService/SMSService";

export default class PasswordService {
  static RESET_TOKEN_EXPIRY_SECONDS = parseInt(process.env.RESET_TOKEN_EXPIRY_SECONDS || "3600"); // 1 saat
  static RESET_TOKEN_LENGTH = Math.max(4, parseInt(process.env.RESET_TOKEN_LENGTH || "6"));

  static generateResetToken(length = this.RESET_TOKEN_LENGTH): string {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(min + Math.random() * (max - min)).toString().padStart(length, "0");
  }

  static async hashToken(token: string): Promise<string> {
    return crypto.createHash("sha256").update(token).digest("hex");
  }

  static getRedisKey(email: string): string {
    return `reset-password:${email.toLowerCase()}`;
  }

  static getRateKey(email: string): string {
    return `reset-password-rate:${email.toLowerCase()}`;
  }

  static async forgotPassword({ email }: { email: string }): Promise<void> {
    const user = await prisma.user.findUnique({ where: { email: email } });
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND);
  
    const emailKey = user.email.toLowerCase();
    const emailTokenKey = this.getRedisKey(emailKey);
    const emailRateKey = this.getRateKey(emailKey);
  
    const alreadyEmailSent = await redis.get(emailRateKey);
    if (alreadyEmailSent) {
      const emailRate = parseInt(alreadyEmailSent);
      if (emailRate >= 5) {
        throw new Error(AuthMessages.RATE_LIMIT_EXCEEDED);
      } else {
        await redis.set(emailRateKey, (emailRate + 1).toString(), "EX", 60);
      }
    } else {
      await redis.set(emailRateKey, "1", "EX", 60);
    }
  
    // Invalidate old token
    await redis.del(emailTokenKey);
  
    // Generate and store new token
    const emailToken = this.generateResetToken();
    const hashedEmailToken = await this.hashToken(emailToken);
    await redis.set(emailTokenKey, hashedEmailToken, "EX", this.RESET_TOKEN_EXPIRY_SECONDS);
  
    // Send email
    await MailService.sendForgotPasswordEmail(user.email, user.name || undefined, emailToken);
  }
  

  static async resetPassword({ email, resetToken, password }: { email: string; resetToken: string; password: string }): Promise<void> {
    const user = await prisma.user.findFirst({ where: { email: email } });
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND);

    const key = this.getRedisKey(user.email);
    const storedHashed = await redis.get(key);
    if (!storedHashed) throw new Error(AuthMessages.INVALID_TOKEN);

    const hashedInput = await this.hashToken(resetToken);
    if (hashedInput !== storedHashed) {
      throw new Error(AuthMessages.INVALID_TOKEN);
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: await bcrypt.hash(password, 10),
      },
    });

    await redis.del(key); // one-time usage

    await MailService.sendPasswordResetSuccessEmail(user.email, user.name || undefined);

    if (user.phone) {
      await SMSService.sendShortMessage({
        to: user.phone,
        body: `Your password has been successfully reset.`,
      });
    }
  }
}
