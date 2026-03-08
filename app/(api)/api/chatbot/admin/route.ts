import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotMessages from '@/messages/ChatbotMessages'

/**
 * GET /api/chatbot/admin — List all chat sessions (admin only).
 * Query params: status (ACTIVE|CLOSED|TAKEN_OVER), page, pageSize
 */
export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request })

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'ACTIVE' | 'CLOSED' | 'TAKEN_OVER' | null
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10)
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const { sessions, total } = await ChatSessionService.listSessions({
      status: status || undefined,
      page,
      pageSize,
      sortKey,
      sortDir,
    })

    return NextResponse.json({
      message: ChatbotMessages.SESSIONS_FETCHED,
      sessions,
      total,
      page,
      pageSize,
    })
  } catch (error: unknown) {
    const errMsg = error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}
