import { NextResponse } from 'next/server'
import WebAuthnService from '@/services/AuthService/WebAuthnService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SecurityService from '@/services/AuthService/SecurityService'
import AuthMessages from '@/messages/AuthMessages'
import { PasskeyAuthVerifyRequestSchema } from '@/dtos/AuthDTO'
import { SafeUserSecuritySchema } from '@/types/user/UserSecurityTypes'
import type { AuthenticationResponseJSON } from '@simplewebauthn/server'

/**
 * POST /api/auth/passkey/authenticate/verify
 * Public endpoint — verifies the browser credential assertion and issues
 * accessToken / refreshToken cookies, mirroring the login route pattern.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = PasskeyAuthVerifyRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const { response, email } = parsed.data

    // Verify the assertion and resolve the matching user
    const user = await WebAuthnService.verifyAuthentication({
      response: response as unknown as AuthenticationResponseJSON,
      email,
    })

    const { userSecurity } = await SecurityService.getUserSecurity(user.userId)

    // Passkey authentication satisfies MFA — skip OTP gate
    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession({
      user,
      request,
      userSecurity,
      otpIgnore: true,
    })

    const httpResponse = NextResponse.json(
      {
        message: AuthMessages.PASSKEY_AUTHENTICATED_SUCCESSFULLY,
        user,
        userSecurity: SafeUserSecuritySchema.parse(userSecurity),
        userSession,
      },
      { status: 200 }
    )

    const origin = request.headers.get('origin') ?? ''
    const protocol =
      request.headers.get('x-forwarded-proto') ?? request.headers.get('x-scheme') ?? 'http'
    const isSecure = origin.startsWith('https://') || protocol === 'https'

    const cookieOptions = isSecure
      ? { httpOnly: true, secure: true, sameSite: 'none' as const, path: '/', maxAge: 60 * 60 * 24 * 7 }
      : { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 7 }

    httpResponse.cookies.set('accessToken', rawAccessToken, cookieOptions)
    httpResponse.cookies.set('refreshToken', rawRefreshToken, cookieOptions)

    return httpResponse
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : AuthMessages.PASSKEY_AUTHENTICATION_FAILED
      console.error('Passkey authentication error:', err)
    return NextResponse.json({ message }, { status: 400 })
  }
}
