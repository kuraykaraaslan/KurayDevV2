import UserSessionService from '@/services/AuthService/UserSessionService'
import ChatbotService from '@/services/ChatbotService'
import { ChatbotRequestSchema } from '@/dtos/ChatbotDTO'
import ChatbotMessages from '@/messages/ChatbotMessages'
import AuthMessages from '@/messages/AuthMessages'

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
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    if (!user) {
      return new Response(
        JSON.stringify({ message: AuthMessages.USER_NOT_AUTHENTICATED }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const body = await request.json()
    const parsed = ChatbotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return new Response(
        JSON.stringify({ message: parsed.error.errors.map((err) => err.message).join(', ') }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const { message, chatSessionId, provider, model } = parsed.data

    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        try {
          for await (const event of ChatbotService.chatStream({
            message,
            chatSessionId,
            userId: user.userId,
            userEmail: user.email,
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
    console.error('[Chatbot Stream API] Error:', errMsg)

    const status = errMsg === ChatbotMessages.RATE_LIMIT_EXCEEDED ? 429
      : errMsg === ChatbotMessages.USER_BANNED ? 403
      : 500

    return new Response(
      JSON.stringify({ message: errMsg }),
      { status, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
