import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { SessionIdParamSchema } from '@/dtos/SessionDTO'

/**
 * DELETE /api/auth/sessions/[sessionId]
 * Terminates a specific session (must belong to current user).
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    if (!user || !userSession) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const rawParams = await params
    const parsed = SessionIdParamSchema.safeParse(rawParams)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid session ID', errors: parsed.error.flatten().fieldErrors },
        { status: 400 }
      )
    }

    const { sessionId } = parsed.data

    if (sessionId === userSession.userSessionId) {
      return NextResponse.json(
        { message: 'Use /api/auth/logout to terminate the current session' },
        { status: 400 }
      )
    }

    const sessions = await UserSessionService.getActiveSessions(user.userId)
    const target = sessions.find((s) => s.userSessionId === sessionId)

    if (!target) {
      return NextResponse.json({ message: 'Session not found' }, { status: 404 })
    }

    await UserSessionService.deleteSession({ userSessionId: sessionId, userId: user.userId })

    return NextResponse.json({ message: 'Session terminated' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
