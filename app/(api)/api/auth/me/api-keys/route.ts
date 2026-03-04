import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import ApiKeyService from '@/services/AuthService/ApiKeyService'
import AuthMessages from '@/messages/AuthMessages'
import { CreateApiKeySchema } from '@/dtos/ApiKeyDTO'

/**
 * GET /api/auth/me/api-keys
 * Returns all API keys for the authenticated user (hashes omitted).
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const apiKeys = await ApiKeyService.list(user.userId)

    return NextResponse.json({ apiKeys })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : AuthMessages.UNKNOWN_ERROR
    return NextResponse.json({ message }, { status: 401 })
  }
}

/**
 * POST /api/auth/me/api-keys
 * Creates a new API key for the authenticated user.
 * The `rawKey` field is returned **once only** — it cannot be retrieved again.
 */
export async function POST(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    const body = await request.json()
    const parsed = CreateApiKeySchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt) : undefined

    const { apiKey, rawKey } = await ApiKeyService.create(user.userId, parsed.data.name, expiresAt)

    return NextResponse.json({ apiKey, rawKey }, { status: 201 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : AuthMessages.UNKNOWN_ERROR
    return NextResponse.json({ message }, { status: 500 })
  }
}
