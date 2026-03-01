import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { TerminateAllQuerySchema } from '@/dtos/SessionDTO'

/**
 * GET /api/auth/sessions
 * Returns all active sessions for the current user.
 */
export async function GET(request: NextRequest) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })


    const sessions = await UserSessionService.getActiveSessions(user.userId)

    // Mark current session
    const result = sessions.map((s) => ({
      ...s,
      isCurrent: s.userSessionId === userSession.userSessionId,
    }))

    return NextResponse.json({ sessions: result })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * DELETE /api/auth/sessions
 * ?all=true → terminates ALL sessions including current (logs out everywhere)
 * default   → terminates all sessions except the current one
 */
export async function DELETE(request: NextRequest) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'USER',
    })

    if (!user || !userSession) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 })

    const parsed = TerminateAllQuerySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams)
    )
    const all = parsed.success ? parsed.data.all : false

    if (all) {
      await UserSessionService.destroyAllSessions(user.userId)
      return NextResponse.json({ message: 'All sessions terminated' })
    }

    await UserSessionService.destroyOtherSessions(userSession)
    return NextResponse.json({ message: 'All other sessions terminated' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
