import { NextRequest, NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import InAppNotificationService from '@/services/InAppNotificationService'

export const runtime = 'nodejs'

/** GET /api/notifications — list all notifications for the current admin */
export async function GET(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    const notifications = await InAppNotificationService.getAll(user.userId)
    const unreadCount = notifications.filter((n) => !n.isRead).length

    return NextResponse.json({ notifications, unreadCount })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/** PATCH /api/notifications — mark all notifications as read */
export async function PATCH(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    await InAppNotificationService.markAllAsRead(user.userId)

    return NextResponse.json({ message: 'All notifications marked as read' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/** DELETE /api/notifications — clear all notifications for the current admin */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    await InAppNotificationService.clearAll(user.userId)

    return NextResponse.json({ message: 'All notifications cleared' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
