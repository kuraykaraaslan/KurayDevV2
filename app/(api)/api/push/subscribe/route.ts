import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import PushNotificationService from '@/services/PushNotificationService'
import { SubscribePushRequestSchema } from '@/dtos/PushNotificationDTO'
import PushNotificationMessages from '@/messages/PushNotificationMessages'

export const runtime = 'nodejs'

/** POST /api/push/subscribe — subscribe to web push notifications */
export async function POST(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: undefined, // any authenticated user
    })

    const body = await request.json()
    
    const parsed = SubscribePushRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { endpoint, keys } = parsed.data

    await PushNotificationService.subscribe(user.userId, { endpoint, keys })

    return NextResponse.json({ message: PushNotificationMessages.SUBSCRIPTION_SUCCESS })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/** DELETE /api/push/subscribe — unsubscribe from web push notifications */
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await AuthMiddleware.authenticateUserByRequest({
      request,
      requiredUserRole: undefined,
    })

    await PushNotificationService.unsubscribe(user.userId)

    return NextResponse.json({ message: 'Unsubscribed from push notifications' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
