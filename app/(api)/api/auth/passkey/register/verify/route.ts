import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import WebAuthnService from '@/services/AuthService/WebAuthnService'
import AuthMessages from '@/messages/AuthMessages'
import { PasskeyRegisterVerifyRequestSchema } from '@/dtos/AuthDTO'
import type { RegistrationResponseJSON } from '@simplewebauthn/types'

/**
 * POST /api/auth/passkey/register/verify
 * Verifies the RegistrationResponseJSON returned by the browser and stores
 * the new passkey credential in userSecurity.passkeys.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const body: unknown = await request.json()
    const parsed = PasskeyRegisterVerifyRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const { response, label } = parsed.data

    const { credentialId } = await WebAuthnService.verifyRegistration({
      user,
      response: response as RegistrationResponseJSON,
      label,
    })

    return NextResponse.json(
      { message: AuthMessages.PASSKEY_REGISTERED_SUCCESSFULLY, credentialId },
      { status: 201 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : AuthMessages.PASSKEY_REGISTRATION_FAILED
    return NextResponse.json({ message }, { status: 400 })
  }
}
