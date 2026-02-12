import { prisma } from '@/libs/prisma'
import bcrypt from 'bcrypt'

// Other Services
import UserService from '../UserService'
import SMSService from '../NotificationService/SMSService'
import MailService from '../NotificationService/MailService'

// Utils
import { SafeUser, SafeUserSchema, UserPreferencesSchema } from '@/types/user/UserTypes'
import { UserProfileSchema } from '@/types/user/UserProfileTypes'
import AuthMessages from '@/messages/AuthMessages'
import {
  SafeUserSecurity,
  UserSecurity,
  UserSecurityDefault,
  UserSecuritySchema,
} from '@/types/user/UserSecurityTypes'

export default class AuthService {
  /**
   * Token Generation
   * @returns A random token 6 characters long with only numbers.
   */
  static generateToken(): string {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  /**
   * Hashes the password.
   * @param password - The password to hash.
   * @returns The hashed password.
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10)
  }

  /**
   * Authenticates a user by email and password.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns The authenticated user.
   */
  static async login({
    email,
    password,
  }: {
    email: string
    password: string
  }): Promise<{ user: SafeUser; userSecurity: SafeUserSecurity }> {
    // Get the user by email
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    if (!user) {
      throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD)
    }

    // Compare the password with the hash

    const isPasswordValid = await bcrypt.compare(password, user.password)

    if (!isPasswordValid) {
      throw new Error(AuthMessages.INVALID_EMAIL_OR_PASSWORD)
    }

    const { userSecurity } = await AuthService.getUserSecurity(user.userId)

    console.log(userSecurity)
    return {
      user: SafeUserSchema.parse(user),
      userSecurity,
    }
  }

  /**
   * Logs out a user by deleting the session.
   * @param token - The session token.
   */
  static async logout({ accessToken }: { accessToken: string }): Promise<void> {
    // Check if the session exists
    const sessions = await prisma.userSession.findMany({
      where: { accessToken: accessToken },
    })

    if (sessions.length === 0) {
      throw new Error(AuthMessages.SESSION_NOT_FOUND)
    }

    // Delete the session if found
    await prisma.userSession.deleteMany({
      where: { accessToken: accessToken },
    })
  }

  /**
   * Registers a new user.
   * @param email - The user's email.
   * @param password - The user's password.
   * @returns The registered user.
   */
  static async register({
    email,
    password,
    name,
    phone,
  }: {
    email: string
    password: string
    name?: string
    phone?: string
  }): Promise<SafeUser> {
    // TODO: Validate the input data

    // Check if the user already exists
    const existingUser = await UserService.getByEmail(email)

    if (existingUser) {
      throw new Error(AuthMessages.EMAIL_ALREADY_EXISTS)
    }

    // Create default profile
    const userProfile = UserProfileSchema.parse({
      name: name,
    })

    // Create default preferences
    const userPreferences = UserPreferencesSchema.parse({})

    // Create the user
    const createdUser = await prisma.user.create({
      data: {
        phone,
        email: email.toLowerCase(),
        password: await AuthService.hashPassword(password),
        userProfile,
        userPreferences,
      },
    })

    const parsedUser = SafeUserSchema.parse(createdUser)

    await MailService.sendWelcomeEmail(parsedUser)
    await SMSService.sendShortMessage({
      to: parsedUser.phone!,
      body: `Welcome ${parsedUser?.userProfile?.name || parsedUser.email}! Your account has been created successfully.`,
    })

    return parsedUser
  }

  /**
   * Checks if a user has the required role.
   * @param user - The user object.
   * @param requiredRoles - The required roles.
   * @returns Whether the user has the required role.
   */
  public static checkIfUserHasRole(user: SafeUser, requiredRole: string): boolean {
    const roles = ['SUPER_ADMIN', 'ADMIN', 'USER', 'GUEST']

    const userRoleIndex = roles.indexOf(user.userRole)
    const requiredRoleIndex = roles.indexOf(requiredRole)

    return userRoleIndex <= requiredRoleIndex
  }

  public static async getUserSecurity(userId: string): Promise<{ userSecurity: UserSecurity }> {
    const user = await prisma.user.findUnique({
      where: { userId },
    })

    if (!user) {
      throw new Error(AuthMessages.USER_NOT_FOUND)
    }

    console.log('Fetched User Security:', user.userSecurity)

    return {
      userSecurity: UserSecuritySchema.parse(
        user.userSecurity ? user.userSecurity : UserSecurityDefault
      ),
    }
  }

  public static async updateUserSecurity(
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
      data: {
        userSecurity: updatedSecurity,
      },
    })
  }
}
