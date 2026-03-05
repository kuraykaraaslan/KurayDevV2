import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ChatbotService from '@/services/ChatbotService'
import ChatbotMessages from '@/messages/ChatbotMessages'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/chatbot/admin/[sessionId] — Get session detail + messages (admin only).
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request })

    const { sessionId } = await params
    const session = await ChatbotService.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { message: ChatbotMessages.SESSION_NOT_FOUND },
        { status: 404 }
      )
    }

    const messages = await ChatbotService.getMessages(sessionId)
    const userBanned = await ChatbotService.isUserBanned(session.userId)

    return NextResponse.json({
      message: ChatbotMessages.SESSION_DETAILS_FETCHED,
      session,
      messages,
      userBanned,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}

/**
 * POST /api/chatbot/admin/[sessionId] — Admin reply to a session.
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({ request })
    const { sessionId } = await params

    const body = await request.json()
    const messageText = body.message as string

    if (!messageText?.trim()) {
      return NextResponse.json(
        { message: ChatbotMessages.MESSAGE_REQUIRED },
        { status: 400 }
      )
    }

    const msg = await ChatbotService.adminReply({
      chatSessionId: sessionId,
      message: messageText.trim(),
      adminUserId: user.userId,
    })

    return NextResponse.json({
      message: ChatbotMessages.ADMIN_REPLY_SENT,
      chatMessage: msg,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}

/**
 * PATCH /api/chatbot/admin/[sessionId] — Update session status (takeover, release, close).
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({ request })
    const { sessionId } = await params

    const body = await request.json()
    const action = body.action as string

    switch (action) {
      case 'takeover':
        await ChatbotService.takeoverSession(sessionId, user.userId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_TAKEN_OVER })

      case 'release':
        await ChatbotService.releaseSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_RELEASED })

      case 'close':
        await ChatbotService.closeSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_CLOSED })

      case 'ban': {
        const session = await ChatbotService.getSession(sessionId)
        if (!session) return NextResponse.json({ message: ChatbotMessages.SESSION_NOT_FOUND }, { status: 404 })
        await ChatbotService.banUser(session.userId)
        await ChatbotService.closeSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.USER_BANNED_SUCCESS })
      }

      case 'unban': {
        const session = await ChatbotService.getSession(sessionId)
        if (!session) return NextResponse.json({ message: ChatbotMessages.SESSION_NOT_FOUND }, { status: 404 })
        await ChatbotService.unbanUser(session.userId)
        return NextResponse.json({ message: ChatbotMessages.USER_UNBANNED_SUCCESS })
      }

      default:
        return NextResponse.json({ message: 'Invalid action' }, { status: 400 })
    }
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}
