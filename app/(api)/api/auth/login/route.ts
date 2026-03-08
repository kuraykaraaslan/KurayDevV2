// Original path: app/api/auth/login/route.ts

import { NextResponse } from 'next/server'
import AuthService from '@/services/AuthService'
import AuthMessages from '@/messages/AuthMessages'
import UserSessionService from '@/services/AuthService/UserSessionService'
import DeviceFingerprintService from '@/services/AuthService/DeviceFingerprintService'
import RateLimiter from '@/libs/rateLimit'
import { LoginRequestSchema } from '@/dtos/AuthDTO'
import MailService from '@/services/NotificationService/MailService'
import { SafeUserSecuritySchema } from '@/types/user/UserSecurityTypes'
import {
  TRUSTED_DEVICE_COOKIE_NAME,
  TRUSTED_DEVICE_EXPIRY_SECONDS,
} from '@/services/AuthService/constants'

export async function POST(request: NextRequest) {
  try {
    await RateLimiter.checkRateLimit(request)

    const parsedData = LoginRequestSchema.safeParse(await request.json())

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { email, password, rememberDevice } = parsedData.data

    const { user, userSecurity } = await AuthService.login({ email, password })

    if (!user) {
      throw new Error(AuthMessages.INVALID_CREDENTIALS)
    }

    const deviceFingerprint = await DeviceFingerprintService.generateDeviceFingerprint(request)
    const trustedDeviceCookie = request.cookies.get(TRUSTED_DEVICE_COOKIE_NAME)?.value
    const isKnownDevice = DeviceFingerprintService.isTrustedDevice(
      user.userId,
      deviceFingerprint,
      trustedDeviceCookie
    )

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(
      {
        user,
        request,
        userSecurity,
        otpIgnore: false,
      }
    )

    const response = NextResponse.json(
      {
        user,
        userSecurity: SafeUserSecuritySchema.parse(userSecurity),
      },
      {
        status: 200,
      }
    )

    // Determine if we're in a secure context (HTTPS)
    const origin = request.headers.get('origin') || ''
    const protocol =
      request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http'
    const isSecure = origin.startsWith('https://') || protocol === 'https'

    const cookieOptions = isSecure
      ? {
          httpOnly: true,
          secure: true,
          sameSite: 'none' as const,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }
      : {
          httpOnly: true,
          sameSite: 'lax' as const,
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        }

    response.cookies.set('accessToken', rawAccessToken, cookieOptions)
    response.cookies.set('refreshToken', rawRefreshToken, cookieOptions)

    // Set trusted device cookie when user opts in
    if (rememberDevice) {
      const trustedToken = DeviceFingerprintService.generateTrustedDeviceToken(
        user.userId,
        deviceFingerprint
      )
      response.cookies.set(
        TRUSTED_DEVICE_COOKIE_NAME,
        trustedToken,
        isSecure
          ? {
              httpOnly: true,
              secure: true,
              sameSite: 'none' as const,
              path: '/',
              maxAge: TRUSTED_DEVICE_EXPIRY_SECONDS,
            }
          : {
              httpOnly: true,
              sameSite: 'lax' as const,
              path: '/',
              maxAge: TRUSTED_DEVICE_EXPIRY_SECONDS,
            }
      )
    }

    // Send suspicious login email only for unrecognised devices
    if (!isKnownDevice) {
      try {
        await MailService.sendNewLoginEmail(user, userSession)
      } catch (emailError) {
        console.error('Error sending new login email:', emailError)
      }
    }

    return response
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
