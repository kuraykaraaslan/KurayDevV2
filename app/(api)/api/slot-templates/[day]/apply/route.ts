import { NextResponse } from 'next/server'
import { Day } from '@/types/features/CalendarTypes'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService'
import { ApplySlotTemplateRequestSchema } from '@/dtos/SlotDTO'
import SlotMessages from '@/messages/SlotMessages'

export async function POST(request: NextRequest, { params }: { params: Promise<{ day: Day }> }) {
  await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

  const body = await request.json()

  const parsedData = ApplySlotTemplateRequestSchema.safeParse(body)

  if (!parsedData.success) {
    return NextResponse.json(
      {
        message: parsedData.error.errors.map((err) => err.message).join(', '),
      },
      { status: 400 }
    )
  }

  const { formattedDate } = parsedData.data
  const { day } = await params

  if (!day) {
    return NextResponse.json({ message: SlotMessages.DAY_REQUIRED }, { status: 400 })
  }

  const SlotTemplate = await SlotTemplateService.getSlotTemplate(day)

  if (!SlotTemplate || SlotTemplate.slots.length === 0) {
    return NextResponse.json({ message: SlotMessages.SLOT_TEMPLATE_NOT_FOUND }, { status: 404 })
  }

  const createdSlots = await SlotTemplateService.applySlotTemplateToDate(day, formattedDate)

  return NextResponse.json({ slots: createdSlots })
}
