import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import PushNotificationService from '@/services/PushNotificationService'
import { SendPushNotificationRequestSchema } from '@/dtos/PushNotificationDTO'
import PushNotificationMessages from '@/messages/PushNotificationMessages'

export const runtime = 'nodejs'

/** POST /api/push/send — send a push notification (admin only) */
export async function POST(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: 'ADMIN',
    })

    const body = await request.json()
    
    const parsed = SendPushNotificationRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { title, body: notifBody, url, target } = parsed.data

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

    return NextResponse.json({ message: PushNotificationMessages.NOTIFICATION_SENT })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
