import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotAdminService from '@/services/ChatbotService/ChatbotAdminService'
import ChatbotModerationService from '@/services/ChatbotService/ChatbotModerationService'
import { AdminChatReplySchema, ChatSessionActionRequestSchema } from '@/dtos/ChatbotDTO'
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
    const session = await ChatSessionService.getSession(sessionId)

    if (!session) {
      return NextResponse.json(
        { message: ChatbotMessages.SESSION_NOT_FOUND },
        { status: 404 }
      )
    }

    const messages = await ChatSessionService.getMessages(sessionId)
    const userBanned = await ChatbotModerationService.isUserBanned(session.userId)

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
    const parsed = AdminChatReplySchema.safeParse({ chatSessionId: sessionId, message: body.message })

    if (!parsed.success) {
      return NextResponse.json(
        { message: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const msg = await ChatbotAdminService.adminReply({
      chatSessionId: sessionId,
      message: parsed.data.message.trim(),
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
    
    const parsed = ChatSessionActionRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { action } = parsed.data

    switch (action) {
      case 'TAKEOVER':
        await ChatbotAdminService.takeoverSession(sessionId, user.userId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_TAKEN_OVER })

      case 'RELEASE':
        await ChatbotAdminService.releaseSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_RELEASED })

      case 'CLOSE':
        await ChatbotAdminService.closeSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.SESSION_CLOSED })

      case 'BAN': {
        const session = await ChatSessionService.getSession(sessionId)
        if (!session) return NextResponse.json({ message: ChatbotMessages.SESSION_NOT_FOUND }, { status: 404 })
        await ChatbotModerationService.banUser(session.userId)
        await ChatbotAdminService.closeSession(sessionId)
        return NextResponse.json({ message: ChatbotMessages.USER_BANNED_SUCCESS })
      }

      case 'UNBAN': {
        const session = await ChatSessionService.getSession(sessionId)
        if (!session) return NextResponse.json({ message: ChatbotMessages.SESSION_NOT_FOUND }, { status: 404 })
        await ChatbotModerationService.unbanUser(session.userId)
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
