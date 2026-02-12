import { NextResponse } from 'next/server'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService'
import { Day, DayEnum, SlotSchema } from '@/types/features/CalendarTypes'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SlotMessages from '@/messages/SlotMessages'

export async function GET(_request: NextRequest, { params }: { params: Promise<{ day: Day }> }) {
  try {
    const { day } = await params
    if (!day) {
      return NextResponse.json({ message: SlotMessages.DAY_REQUIRED }, { status: 400 })
    }
    const slotsTemplate = await SlotTemplateService.getSlotTemplate(day)

    return NextResponse.json({ message: SlotMessages.SLOT_TEMPLATE_RETRIEVED, data: slotsTemplate })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json(
      { message: error.message || SlotMessages.OPERATION_FAILED },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

  const { day, slots } = await request.json()

  if (!day) {
    return NextResponse.json({ message: SlotMessages.DAY_REQUIRED }, { status: 400 })
  }

  if (!slots || !Array.isArray(slots)) {
    return NextResponse.json({ message: SlotMessages.SLOTS_REQUIRED }, { status: 400 })
  }

  const result = DayEnum.safeParse(day)

  if (!result.success) {
    return NextResponse.json(
      { message: 'Invalid day', issues: result.error.issues },
      { status: 400 }
    )
  }

  for (const slot of slots) {
    const result = SlotSchema.safeParse(slot)
    if (!result.success) {
      return NextResponse.json(
        { message: 'Invalid slot', issues: result.error.issues },
        { status: 400 }
      )
    }
  }

  const slotsTemplate = await SlotTemplateService.createOrUpdateSlotTemplate(day, slots)

  return NextResponse.json({ slotsTemplate })
}
