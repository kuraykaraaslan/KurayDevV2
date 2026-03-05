import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ApiKeyService from '@/services/AuthService/ApiKeyService'
import AuthMessages from '@/messages/AuthMessages'

/**
 * DELETE /api/auth/me/api-keys/[keyId]
 * Revokes an API key owned by the authenticated user.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ keyId: string }> }
) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const { keyId } = await params

    await ApiKeyService.revoke(keyId, user.userId)

    return NextResponse.json({ message: AuthMessages.API_KEY_DELETED })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : AuthMessages.UNKNOWN_ERROR
    const status = message === AuthMessages.API_KEY_NOT_FOUND ? 404 : 500
    return NextResponse.json({ message }, { status })
  }
}
