import { NextResponse, NextRequest } from 'next/server'
import AppointmentService from '@/services/AppointmentService'
import Logger from '@/libs/logger'
import SlotService from '@/services/AppointmentService/SlotService'
import { AppointmentStatus } from '@/types/features/CalendarTypes'
import { CreateAppointmentRequestSchema } from '@/dtos/AppointmentDTO'
import AppointmentMessages from '@/messages/AppointmentMessages'

export async function POST(request: NextRequest) {
  try {
    // gerekirse auth:
    // await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" })

    const body = await request.json()

    const parsedData = CreateAppointmentRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { date, time, name, email, phone, note } = parsedData.data

    // Assume slotId refers to a slot with date and time; fetch slot details
    const slot = await SlotService.getSlot(date, time)
    if (!slot) {
      return NextResponse.json({ message: AppointmentMessages.SLOT_NOT_FOUND }, { status: 404 })
    }

    const appointmentData = {
      status: 'PENDING' as AppointmentStatus,
      createdAt: new Date(),
      name,
      email,
      phone,
      appointmentId: crypto.randomUUID(),
      startTime: slot.startTime,
      endTime: slot.endTime,
      note: note ?? null,
    }

    const result = await AppointmentService.createAppointment(appointmentData)

    return NextResponse.json(result)
  } catch (err: any) {
    Logger.error('API/booking POST: ' + err.message)
    return NextResponse.json({ message: 'Internal server error' }, { status: 500 })
  }
}
