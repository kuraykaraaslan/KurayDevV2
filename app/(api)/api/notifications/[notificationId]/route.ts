import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import InAppNotificationService from '@/services/InAppNotificationService'

export const runtime = 'nodejs'

/** PATCH /api/notifications/:id — mark a single notification as read */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    await InAppNotificationService.markAsRead(user.userId, params.notificationId)

    return NextResponse.json({ message: 'Marked as read' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/** DELETE /api/notifications/:id — delete a single notification */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { notificationId: string } }
) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    await InAppNotificationService.deleteOne(user.userId, params.notificationId)

    return NextResponse.json({ message: 'Notification deleted' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
