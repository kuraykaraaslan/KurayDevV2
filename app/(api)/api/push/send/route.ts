import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import PushNotificationService from '@/services/PushNotificationService'

export const runtime = 'nodejs'

/** POST /api/push/send — send a push notification (admin only) */
export async function POST(request: NextRequest) {
  try {
    await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    const body = await request.json()
    const { title, body: notifBody, url, target } = body

    if (!title || !notifBody) {
      return NextResponse.json(
        { message: 'title and body are required' },
        { status: 400 }
      )
    }

    const payload = {
      title,
      body: notifBody,
      icon: '/icon-192x192.png',
      url: url || '/',
    }

    if (target === 'admins') {
      await PushNotificationService.sendToAdmins(payload)
    } else {
      await PushNotificationService.sendToAll(payload)
    }

    return NextResponse.json({ message: 'Push notification sent' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
