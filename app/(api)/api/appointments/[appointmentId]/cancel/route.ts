import { NextResponse, NextRequest } from 'next/server'
import Logger from '@/libs/logger'
import AppointmentService from '@/services/AppointmentService'
import AppointmentMessages from '@/messages/AppointmentMessages'
import { CancelAppointmentRequestSchema } from '@/dtos/AppointmentActionDTO'

export async function POST(_request: NextRequest, { params }: { params: Promise<{ appointmentId: string }> }) {
  try {
    const { appointmentId } = await params
    
    const parsedData = CancelAppointmentRequestSchema.safeParse({ appointmentId });
    
    if (!parsedData.success) {
      return NextResponse.json({
        
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const result = await AppointmentService.cancelAppointment(appointmentId)

    return NextResponse.json({  message: AppointmentMessages.APPOINTMENT_CANCELLED_SUCCESSFULLY, data: result }, {
      status: 200,
    })
  } catch (err: any) {
    Logger.error('API/appointments/[appointmentId]/cancel POST: ' + err.message)
    return NextResponse.json(
      { message: AppointmentMessages.APPOINTMENT_CANCELLATION_FAILED },
      { status: 500 }
    )
  }
}