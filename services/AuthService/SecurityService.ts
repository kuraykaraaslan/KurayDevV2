import { prisma } from '@/libs/prisma'
import AuthMessages from '@/messages/AuthMessages'
import {
  UserSecurity,
  UserSecurityDefault,
  UserSecuritySchema,
} from '@/types/user/UserSecurityTypes'

export default class SecurityService {
  /**
   * Returns the parsed UserSecurity object for the given user.
   * Falls back to defaults if the user has no security record.
   * @param userId - The user's ID.
   */
  static async getUserSecurity(userId: string): Promise<{ userSecurity: UserSecurity }> {
    const user = await prisma.user.findUnique({
      where: { userId },
    })

    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND)
    }

    return {
      userSecurity: UserSecuritySchema.parse(
        user.userSecurity ? user.userSecurity : UserSecurityDefault
      ),
    }
  }

  /**
   * Applies a partial update to the UserSecurity record of the given user.
   * @param userId - The user's ID.
   * @param updates - Partial fields to merge into the existing security record.
   */
  static async updateUserSecurity(
    userId: string,
    updates: Partial<UserSecurity>
  ): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { userId },
    })

    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND)
    }

    const updatedSecurity = {
      ...UserSecuritySchema.parse(user.userSecurity ? user.userSecurity : UserSecurityDefault),
      ...updates,
    }

    await prisma.user.update({
      where: { userId },
      data: { userSecurity: updatedSecurity },
    })
  }
}
