import { prisma } from '@/libs/prisma'
import {
  UserProfile,
  UserProfileDefault,
  UserProfileSchema,
} from '@/types/user/UserProfileTypes'

export default class UserProfileService {
  static USER_NOT_FOUND = 'USER_NOT_FOUND'
  static USERNAME_TAKEN = 'USERNAME_TAKEN'
  static INVALID_USERNAME = 'INVALID_USERNAME'

  /**
   * Retrieves the userProfile of a user by ID.
   * @param userId - The user ID.
   * @returns The parsed userProfile (never null — falls back to default).
   */
  static async getProfile(userId: string): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { userId } })

    if (!user) throw new Error(this.USER_NOT_FOUND)

    return UserProfileSchema.parse(user.userProfile ?? UserProfileDefault)
  }

  /**
   * Updates a user's profile by deep-merging the incoming partial data with the
   * existing profile. Validates username format and uniqueness before persisting.
   * @param userId - The user ID.
   * @param data - Partial userProfile fields to apply.
   * @returns The updated userProfile.
   */
  static async updateProfile({
    userId,
    data,
  }: {
    userId: string
    data: Partial<UserProfile>
  }): Promise<UserProfile> {
    const user = await prisma.user.findUnique({ where: { userId } })

    if (!user) throw new Error(this.USER_NOT_FOUND)

    if (data.username !== undefined && data.username !== null) {
      if (!/^[a-z0-9_]+$/.test(data.username)) {
        throw new Error(this.INVALID_USERNAME)
      }
      await this.assertUsernameAvailable(data.username, userId)
    }

    const existing = UserProfileSchema.parse(user.userProfile ?? UserProfileDefault)
    const merged = this.mergeProfile(existing, data)

    const updatedUser = await prisma.user.update({
      where: { userId },
      data: { userProfile: merged },
    })

    return UserProfileSchema.parse(updatedUser.userProfile)
  }

  /**
   * Merges incoming partial profile data with the existing profile.
   * Undefined values are ignored; null values explicitly clear a field.
   */
  static mergeProfile(existing: UserProfile, incoming: Partial<UserProfile>): UserProfile {
    const patch = Object.fromEntries(
      Object.entries(incoming).filter(([, v]) => v !== undefined)
    )
    return { ...existing, ...patch }
  }

  /**
   * Throws USERNAME_TAKEN if the given username is already used by a different user.
   */
  private static async assertUsernameAvailable(
    username: string,
    excludeUserId: string
  ): Promise<void> {
    const rows = await prisma.$queryRaw<Array<{ userId: string }>>`
      SELECT "userId" FROM "User"
      WHERE "userProfile"->>'username' = ${username}
      LIMIT 1
    `

    if (rows.length > 0 && rows[0].userId !== excludeUserId) {
      throw new Error(this.USERNAME_TAKEN)
    }
  }
}
