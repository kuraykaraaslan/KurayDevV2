import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import ChatSessionService from '@/services/ChatbotService/ChatSessionService'
import ChatbotMessages from '@/messages/ChatbotMessages'
import { ChatExportFormatSchema } from '@/dtos/ChatbotDTO'

interface RouteParams {
  params: Promise<{ sessionId: string }>
}

/**
 * GET /api/chatbot/admin/[sessionId]/export
 *
 * Export a chat session's messages as a downloadable file.
 *
 * Query params:
 *   format  — "json" (default) | "csv" | "txt"
 *
 * Access: ADMIN role only.
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

    // Validate export format
    const { searchParams } = new URL(request.url)
    const rawFormat = searchParams.get('format') ?? 'json'
    const parsedFormat = ChatExportFormatSchema.safeParse(rawFormat)
    if (!parsedFormat.success) {
      return NextResponse.json(
        { message: ChatbotMessages.INVALID_EXPORT_FORMAT },
        { status: 400 }
      )
    }
    const format = parsedFormat.data

    const messages = await ChatSessionService.getMessages(sessionId)

    const safeId = sessionId.replace(/[^a-zA-Z0-9_-]/g, '')
    const filename = `chat-${safeId}.${format}`

    // ── JSON ──────────────────────────────────────────────────────────
    if (format === 'json') {
      const body = JSON.stringify(
        {
          session: {
            chatSessionId: session.chatSessionId,
            userId: session.userId,
            userEmail: session.userEmail,
            status: session.status,
            title: session.title,
            createdAt: session.createdAt,
            updatedAt: session.updatedAt,
          },
          messages: messages.map((m) => ({
            id: m.id,
            role: m.role,
            content: m.content,
            createdAt: m.createdAt,
            sources: m.sources,
          })),
        },
        null,
        2
      )

      return new Response(body, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // ── TXT ───────────────────────────────────────────────────────────
    if (format === 'txt') {
      const header = [
        `Chat Session: ${session.title ?? sessionId}`,
        `User: ${session.userEmail ?? session.userId}`,
        `Status: ${session.status}`,
        `Started: ${session.createdAt}`,
        '─'.repeat(60),
        '',
      ].join('\n')

      const body =
        header +
        messages
          .filter((m) => m.content !== '__ADMIN_TAKEOVER__')
          .map((m) => `[${m.role.toUpperCase()}] ${m.createdAt}\n${m.content}`)
          .join('\n\n')

      return new Response(body, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      })
    }

    // ── CSV ───────────────────────────────────────────────────────────
    const csvRows = [
      ['id', 'role', 'content', 'createdAt'].join(','),
      ...messages.map((m) =>
        [
          m.id ?? '',
          m.role,
          `"${(m.content ?? '').replace(/"/g, '""')}"`,
          m.createdAt,
        ].join(',')
      ),
    ].join('\n')

    return new Response(csvRows, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error: unknown) {
    const errMsg =
      error instanceof Error ? error.message : ChatbotMessages.CHATBOT_RESPONSE_FAILED
    return NextResponse.json({ message: errMsg }, { status: 500 })
  }
}
