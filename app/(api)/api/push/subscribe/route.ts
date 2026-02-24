import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import PushNotificationService from '@/services/PushNotificationService'

export const runtime = 'nodejs'

/** POST /api/push/subscribe — subscribe to web push notifications */
export async function POST(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: undefined, // any authenticated user
    })

    const body = await request.json()
    const { endpoint, keys } = body

    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json(
        { message: 'Invalid push subscription payload' },
        { status: 400 }
      )
    }

    await PushNotificationService.subscribe(user.userId, { endpoint, keys })

    return NextResponse.json({ message: 'Subscribed to push notifications' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/** DELETE /api/push/subscribe — unsubscribe from web push notifications */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({
      request,
      requiredUserRole: undefined,
    })

    await PushNotificationService.unsubscribe(user.userId)

    return NextResponse.json({ message: 'Unsubscribed from push notifications' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
