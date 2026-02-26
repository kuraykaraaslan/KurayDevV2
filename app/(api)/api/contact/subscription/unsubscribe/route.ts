import { NextResponse } from 'next/server'
import SubscriptionService from '@/services/SubscriptionService'
import { SubscriptionMessages } from '@/messages/SubscriptionMessages'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({ message: 'Token is required.' }, { status: 400 })
    }

    const subscription = await SubscriptionService.getSubscriptionByToken(token)

    if (!subscription) {
      return NextResponse.json(
        { message: SubscriptionMessages.SUBSCRIPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    await SubscriptionService.deleteSubscription(subscription.email)

    return NextResponse.json({ message: SubscriptionMessages.UNSUBSCRIPTION_SUCCESS })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
