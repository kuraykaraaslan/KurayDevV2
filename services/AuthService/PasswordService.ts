import bcrypt from 'bcrypt'
import crypto from 'crypto'
import redis from '@/libs/redis'
import { prisma } from '@/libs/prisma'
import AuthMessages from '@/messages/AuthMessages'
import MailService from '../NotificationService/MailService'
import SMSService from '../NotificationService/SMSService'
import UserService from '../UserService'
import {
  BCRYPT_SALT_ROUNDS,
  RESET_TOKEN_EXPIRY_SECONDS,
  RESET_TOKEN_LENGTH,
  RESET_RATE_LIMIT_MAX,
  RESET_RATE_WINDOW_SECONDS,
  RESET_PASSWORD_KEY,
  RESET_PASSWORD_RATE_KEY,
} from './constants'

export default class PasswordService {

  static generateResetToken(length = RESET_TOKEN_LENGTH): string {
    const min = Math.pow(10, length - 1)
    const max = Math.pow(10, length) - 1
    return Math.floor(min + Math.random() * (max - min))
      .toString()
      .padStart(length, '0')
  }

  static async hashToken(token: string): Promise<string> {
    return crypto.createHash('sha256').update(token).digest('hex')
  }

  static getRedisKey(email: string): string {
    return RESET_PASSWORD_KEY(email)
  }

  static getRateKey(email: string): string {
    return RESET_PASSWORD_RATE_KEY(email)
  }

  static async forgotPassword({ email }: { email: string }): Promise<void> {
    const user = await UserService.getByEmail(email)
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND)

    const emailKey = user.email.toLowerCase()
    const emailTokenKey = this.getRedisKey(emailKey)
    const emailRateKey = this.getRateKey(emailKey)

    const alreadyEmailSent = await redis.get(emailRateKey)
    if (alreadyEmailSent) {
      const emailRate = parseInt(alreadyEmailSent)
      if (emailRate >= RESET_RATE_LIMIT_MAX) {
        throw new Error(AuthMessages.RATE_LIMIT_EXCEEDED)
      } else {
        await redis.set(emailRateKey, (emailRate + 1).toString(), 'EX', RESET_RATE_WINDOW_SECONDS)
      }
    } else {
      await redis.set(emailRateKey, '1', 'EX', RESET_RATE_WINDOW_SECONDS)
    }

    // Invalidate old token
    await redis.del(emailTokenKey)

    // Generate and store new token
    const emailToken = this.generateResetToken()
    const hashedEmailToken = await this.hashToken(emailToken)
    await redis.set(emailTokenKey, hashedEmailToken, 'EX', RESET_TOKEN_EXPIRY_SECONDS)

    // Send email
    await MailService.sendForgotPasswordEmail(
      user.email,
      user.userProfile.name || undefined,
      emailToken
    )
  }

  static async resetPassword({
    email,
    resetToken,
    password,
  }: {
    email: string
    resetToken: string
    password: string
  }): Promise<void> {
    const user = await UserService.getByEmail(email)
    if (!user) throw new Error(AuthMessages.USER_NOT_FOUND)

    const key = this.getRedisKey(user.email)
    const storedHashed = await redis.get(key)
    if (!storedHashed) throw new Error(AuthMessages.INVALID_TOKEN)

    const hashedInput = await this.hashToken(resetToken)
    if (hashedInput !== storedHashed) {
      throw new Error(AuthMessages.INVALID_TOKEN)
    }

    await prisma.user.update({
      where: { userId: user.userId },
      data: {
        password: await bcrypt.hash(password, BCRYPT_SALT_ROUNDS),
      },
    })

    await redis.del(key) // one-time usage

    try {
      await MailService.sendPasswordResetSuccessEmail(user.email, user.userProfile.name || undefined)
    } catch {
      // Password reset is already completed; notification failures are non-blocking.
    }

    if (user.phone) {
      try {
        await SMSService.sendShortMessage({
          to: user.phone,
          body: `Your password has been successfully reset.`,
        })
      } catch {
        // Password reset is already completed; notification failures are non-blocking.
      }
    }
  }
}
