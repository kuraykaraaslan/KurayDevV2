import { NextResponse } from 'next/server'
import Logger from '@/libs/logger'
import AppointmentService from '@/services/AppointmentService'
import AppointmentMessages from '@/messages/AppointmentMessages'

export async function POST(_request: Request, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params

    const result = await AppointmentService.cancelAppointment(appointmentId)

    return NextResponse.json(result, {
      status: 200,
    })
  } catch (err: any) {
    Logger.error('API/appointments/[appointmentId]/cancel POST: ' + err.message)
    return NextResponse.json(
      { success: false, message: AppointmentMessages.APPOINTMENT_CANCELLATION_FAILED },
      { status: 500 }
    )
  }
}