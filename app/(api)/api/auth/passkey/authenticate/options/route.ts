import { NextResponse } from 'next/server'
import WebAuthnService from '@/services/AuthService/WebAuthnService'
import AuthMessages from '@/messages/AuthMessages'
import { PasskeyAuthOptionsRequestSchema } from '@/dtos/AuthDTO'

/**
 * POST /api/auth/passkey/authenticate/options
 * Public endpoint — no active session required.
 * Returns PublicKeyCredentialRequestOptions.
 * If `email` is provided, allowCredentials is scoped to that user.
 * Without `email`, a discoverable-credential (resident key) flow is used.
 */
export async function POST(request: NextRequest) {
  try {
    const body: unknown = await request.json()
    const parsed = PasskeyAuthOptionsRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const options = await WebAuthnService.generateAuthenticationOptions(parsed.data.email)

    return NextResponse.json(
      { message: AuthMessages.PASSKEY_AUTHENTICATION_OPTIONS_GENERATED, options },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : AuthMessages.PASSKEY_AUTHENTICATION_FAILED
    return NextResponse.json({ message }, { status: 400 })
  }
}
