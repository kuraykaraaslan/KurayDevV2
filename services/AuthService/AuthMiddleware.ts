import { SafeUserSession } from '@/types/user/UserSessionTypes'
import { SafeUser } from '@/types/user/UserTypes'
import AuthMessages from '@/messages/AuthMessages'
import ApiKeyService from './ApiKeyService'
import UserSessionService from './UserSessionService'
import { UserRole } from '@/generated/prisma'

export default class AuthMiddleware {


  static async apiSessionCreate(user: SafeUser): Promise<SafeUserSession> {
    const API_SESSION: SafeUserSession = {
      userSessionId: 'api-session',
      userId: user.userId,
      otpVerifyNeeded: false,
      sessionExpiry: new Date(),
    }

    return API_SESSION
  }
  /**
   * Authenticate a user by access token or API key.
   * @param request - The NextRequest object.
   * @param requiredUserRole - The minimum required user role.
   * @param otpVerifyBypass - Whether to bypass OTP verification.
   * @returns The authenticated user and session.
   */
  static authenticateUserByRequest(args: {
    request: NextRequest
    requiredUserRole: 'GUEST'
    otpVerifyBypass?: boolean
  }): Promise<{ user: SafeUser | null; userSession: SafeUserSession | null }>
  static authenticateUserByRequest<T extends string = 'ADMIN'>(args: {
    request: NextRequest
    requiredUserRole?: T
    otpVerifyBypass?: boolean
  }): Promise<{ user: SafeUser; userSession: SafeUserSession }>
  static async authenticateUserByRequest<T extends string = 'ADMIN'>({
    request,
    requiredUserRole = 'ADMIN' as T,
    otpVerifyBypass = false,
  }: {
    request: NextRequest
    requiredUserRole?: T
    otpVerifyBypass?: boolean
  }): Promise<{ user: SafeUser | null; userSession: SafeUserSession | null }> {
    const isGuest = requiredUserRole === 'GUEST'

    try {
      // ── API Key authentication ──────────────────────────────────────────────
      // Accepts `X-API-Key: <rawKey>` or `Authorization: Bearer kdev_<...>`
      const rawApiKey = (() => {
        const header = request.headers.get('x-api-key')
        if (header) return header
        const auth = request.headers.get('authorization')
        if (auth?.startsWith('Bearer kdev_')) return auth.slice(7)
        return undefined
      })()
      if (rawApiKey) {
        const user = await ApiKeyService.authenticateByApiKey(rawApiKey)
        if (!user) throw new Error(AuthMessages.USER_NOT_AUTHENTICATED)
        const userRoleKeys = Object.keys(UserRole)
        const requiredUserRoleKeyIndex = userRoleKeys.indexOf(requiredUserRole)
        const userRoleKeyIndex = userRoleKeys.indexOf(user.userRole)

        if (userRoleKeyIndex < requiredUserRoleKeyIndex) {
          throw new Error(AuthMessages.USER_NOT_AUTHENTICATED)
        }

        request.user = user
        const apiSession = await this.apiSessionCreate(user)
        return { user, userSession: apiSession }
      }
      // ── End API Key authentication ─────────────────────────────────────────

      const accessToken = request.cookies.get('accessToken')?.value
      const refreshToken = request.cookies.get('refreshToken')?.value

      // GUEST: no tokens → skip silently, user stays null
      if (!accessToken || !refreshToken) {
        if (isGuest) {
          request.user = null
          return { user: null, userSession: null }
        }
        throw new Error(AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE)
      }

      const { user, userSession } = await UserSessionService.getSession({
        accessToken,
        request,
        otpVerifyBypass,
      })

      if (!user) {
        throw new Error(AuthMessages.USER_NOT_FOUND)
      }

      if (userSession.otpVerifyNeeded && !otpVerifyBypass) {
        throw new Error(AuthMessages.OTP_NEEDED)
      }

      // Check if the session is expired
      if (userSession.sessionExpiry < new Date()) {
        throw new Error(AuthMessages.SESSION_NOT_FOUND)
      }

      const userRoleKeys = Object.keys(UserRole)

      const requiredUserRoleKeyIndex = userRoleKeys.indexOf(requiredUserRole)
      const userRoleKeyIndex = userRoleKeys.indexOf(user.userRole)

      // User's role index must be >= required role index (ADMIN=1 >= USER=0)
      if (userRoleKeyIndex < requiredUserRoleKeyIndex) {
        throw new Error(AuthMessages.USER_NOT_AUTHENTICATED)
      }

      request.user = user
      return { user, userSession }
    } catch (error: any) {
      // Quota exceeded errors must surface as-is so the handler can return 429
      if (
        error?.message === AuthMessages.API_KEY_DAILY_LIMIT_EXCEEDED ||
        error?.message === AuthMessages.API_KEY_MONTHLY_LIMIT_EXCEEDED ||
        error?.message === AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE
      ) {
        throw error
      }

      if (!isGuest) {
        console.error('[AUTH] Authentication error:', error.message, error.stack)
        throw new Error(AuthMessages.USER_NOT_AUTHENTICATED)
      }
      // GUEST: auth failed silently, continue as unauthenticated
      request.user = null
      return { user: null, userSession: null }
    }
  }
}
