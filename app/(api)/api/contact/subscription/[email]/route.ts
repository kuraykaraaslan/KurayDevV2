import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SubscriptionService from '@/services/SubscriptionService'
import { SubscriptionMessages } from '@/messages/SubscriptionMessages'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { email: string } }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { email } = await params
    const decodedEmail = decodeURIComponent(email)

    const deleted = await SubscriptionService.deleteSubscription(decodedEmail)

    if (!deleted) {
      return NextResponse.json(
        { message: SubscriptionMessages.SUBSCRIPTION_NOT_FOUND },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { message: SubscriptionMessages.UNSUBSCRIPTION_SUCCESS },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting subscription:', error)
    return NextResponse.json({ message: 'Internal server error.' }, { status: 500 })
  }
}
