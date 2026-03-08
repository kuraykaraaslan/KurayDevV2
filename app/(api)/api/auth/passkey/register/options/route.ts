import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import WebAuthnService from '@/services/AuthService/WebAuthnService'
import AuthMessages from '@/messages/AuthMessages'

/**
 * POST /api/auth/passkey/register/options
 * Returns PublicKeyCredentialCreationOptions for a logged-in user.
 * Requires an active session (any role).
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const options = await WebAuthnService.generateRegistrationOptions(user)

    return NextResponse.json(
      { message: AuthMessages.PASSKEY_REGISTRATION_OPTIONS_GENERATED, options },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : AuthMessages.PASSKEY_REGISTRATION_FAILED
    return NextResponse.json({ message }, { status: 400 })
  }
}
