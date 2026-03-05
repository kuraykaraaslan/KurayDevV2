import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import ChatbotService from '@/services/ChatbotService'
import { ChatbotRequestSchema } from '@/dtos/ChatbotDTO'
import ChatbotMessages from '@/messages/ChatbotMessages'
import AuthMessages from '@/messages/AuthMessages'

export async function POST(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    if (!user) {
      return NextResponse.json(
        { message: AuthMessages.USER_NOT_AUTHENTICATED },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = ChatbotRequestSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((err) => err.message).join(', ') },
        { status: 400 }
      )
    }

    const { message, chatSessionId, provider, model } = parsed.data

    const result = await ChatbotService.chat({
      message,
      chatSessionId,
      userId: user.userId,
      userEmail: user.email,
      provider,
      model,
    })

    return NextResponse.json({
      message: ChatbotMessages.CHATBOT_RESPONSE_SUCCESS,
      reply: result.reply,
      sources: result.sources,
      chatSessionId: result.chatSessionId,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    console.error('[Chatbot API] Error:', errMsg)

    const status = errMsg === ChatbotMessages.RATE_LIMIT_EXCEEDED ? 429
      : errMsg === ChatbotMessages.USER_BANNED ? 403
      : 500

    return NextResponse.json(
      { message: errMsg },
      { status }
    )
  }
}

/**
 * GET — retrieve messages for the current user's session.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    if (!user) {
      return NextResponse.json(
        { message: AuthMessages.USER_NOT_AUTHENTICATED },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const chatSessionId = searchParams.get('chatSessionId')

    if (chatSessionId) {
      // Get specific session + messages
      const session = await ChatbotService.getSession(chatSessionId)
      if (!session || session.userId !== user.userId) {
        return NextResponse.json(
          { message: ChatbotMessages.SESSION_NOT_FOUND },
          { status: 404 }
        )
      }
      const messages = await ChatbotService.getMessages(chatSessionId)
      return NextResponse.json({ session, messages })
    }

    // List user's sessions
    const sessions = await ChatbotService.getUserSessions(user.userId)
    return NextResponse.json({ sessions })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}
