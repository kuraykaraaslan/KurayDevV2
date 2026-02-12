import { NextResponse } from 'next/server'
import SlotService from '@/services/AppointmentService/SlotService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { SlotSchema } from '@/types/features/CalendarTypes'

/**
 * [day] → MONDAY..SUNDAY
 * GET:   haftalık şablonu getirir
 * POST:  haftalık şablonu kaydeder  { slots: [{ time, length? }] }
 */

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params

    if (!date) {
      return NextResponse.json({ message: 'Date is required' }, { status: 400 })
    }

    const slots = await SlotService.getAllSlotsForDate(date)

    return NextResponse.json({ slots })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

  const body = await request.json()

  const result = SlotSchema.safeParse(body)
  if (!result.success) {
    return NextResponse.json(
      { message: 'Invalid slot data', issues: result.error.issues },
      { status: 400 }
    )
  }

  const slotData = result.data

  const createdSlot = await SlotService.createSlot(slotData)

  return NextResponse.json({ slot: createdSlot })
}
