import { NextRequest, NextResponse } from 'next/server'
import SubscriptionService from '@/services/SubscriptionService'
import { SubscriptionRequestSchema } from '@/dtos/AIAndServicesDTO'
import { SubscriptionMessages } from '@/messages/SubscriptionMessages'

export async function POST(request: NextRequest) {
  const body = await request.json()

  const parsedData = SubscriptionRequestSchema.safeParse(body)

  if (!parsedData.success) {
    return NextResponse.json(
      {
        message: parsedData.error.errors.map((err) => err.message).join(', '),
      },
      { status: 400 }
    )
  }

  const { email } = parsedData.data

  try {
    await SubscriptionService.createSubscription(email)
    return NextResponse.json({ message: SubscriptionMessages.SUBSCRIPTION_SUCCESS })
  } catch (error) {
    return NextResponse.json({ message: SubscriptionMessages.SUBSCRIPTION_ERROR }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const body = await request.json()

  const parsedData = SubscriptionRequestSchema.safeParse(body)

  if (!parsedData.success) {
    return NextResponse.json(
      {
        message: parsedData.error.errors.map((err) => err.message).join(', '),
      },
      { status: 400 }
    )
  }

  const { email } = parsedData.data

  try {
    await SubscriptionService.deleteSubscription(email)
    return NextResponse.json({ message: SubscriptionMessages.UNSUBSCRIPTION_SUCCESS })
  } catch (error) {
    return NextResponse.json(
      { message: SubscriptionMessages.UNSUBSCRIPTION_ERROR },
      { status: 500 }
    )
  }
}
