import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ChatbotService from '@/services/ChatbotService'
import { ChatbotRequestSchema } from '@/dtos/ChatbotDTO'
import ChatbotMessages from '@/messages/ChatbotMessages'
import Logger from '@/libs/logger'

/**
 * POST /api/chatbot/stream — SSE streaming chat endpoint.
 * Returns text/event-stream with JSON-encoded events:
 *   { type: 'meta',    chatSessionId: string }
 *   { type: 'chunk',   content: string }
 *   { type: 'sources', sources: ChatbotSource[] }
 *   { type: 'done' }
 *   { type: 'error',   error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Try to authenticate but allow guests
    let user: { userId: string; email: string } | null = null
    try {
      const auth = await AuthMiddleware.authenticateUserByRequest({
        request,
        requiredUserRole: 'USER',
      })
      user = auth.user ? { userId: auth.user.userId, email: auth.user.email } : null
    } catch { /* guest access */ }

    const body = await request.json()
    const parsed = ChatbotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ message: parsed.error.errors.map((err) => err.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { message, chatSessionId, browserId, provider, model } = parsed.data

    // Guest must provide browserId
    if (!user && !browserId) {
      return new Response(
        JSON.stringify({ message: 'browserId is required for guest access' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const effectiveUserId = user?.userId ?? `guest:${browserId}`

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of ChatbotService.chatStream({
            message,
            chatSessionId,
            userId: effectiveUserId,
            userEmail: user?.email,
            browserId,
            provider,
            model,
          })) {
            controller.enqueue(encoder.encode(event))
          }
        } catch (err) {
          const errMsg = err instanceof Error ? err.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', error: errMsg })}\n\n`)
          )
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    Logger.error(`[Chatbot Stream API] ${errMsg}`)

    const status = errMsg === ChatbotMessages.RATE_LIMIT_EXCEEDED ? 429
      : errMsg === ChatbotMessages.USER_BANNED ? 403
      : 500

    return new Response(
      JSON.stringify({ message: errMsg }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
