import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import WebAuthnService from '@/services/AuthService/WebAuthnService'
import AuthMessages from '@/messages/AuthMessages'
import { PasskeyDeleteRequestSchema } from '@/dtos/AuthDTO'

/**
 * GET /api/auth/passkey
 * Returns the list of registered passkeys for the authenticated user.
 * Sensitive fields (publicKey, counter) are intentionally omitted.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const passkeys = await WebAuthnService.listPasskeys(user.userId)

    return NextResponse.json(
      { message: AuthMessages.PASSKEY_LIST_RETRIEVED, passkeys },
      { status: 200 }
    )
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : AuthMessages.UNKNOWN_ERROR
    return NextResponse.json({ message }, { status: 400 })
  }
}

/**
 * DELETE /api/auth/passkey
 * Removes a single passkey credential by credentialId.
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const body: unknown = await request.json()
    const parsed = PasskeyDeleteRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    await WebAuthnService.deletePasskey(user, parsed.data.credentialId)

    return NextResponse.json({ message: AuthMessages.PASSKEY_DELETED_SUCCESSFULLY }, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : AuthMessages.UNKNOWN_ERROR
    return NextResponse.json({ message }, { status: 400 })
  }
}
