import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { UpdateAppointmentRequestSchema } from '@/dtos/AppointmentDTO'

type RouteParams = { params: Promise<{ appointmentId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    
    const { appointmentId } = await params
    const body = await request.json()
    
    const parsed = UpdateAppointmentRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }
    
    const { startTime, endTime, ...rest } = parsed.data
    const updateData = {
      ...rest,
      ...(startTime && { startTime: new Date(startTime) }),
      ...(endTime && { endTime: new Date(endTime) }),
    }
    const updated = await AppointmentService.updateAppointment(appointmentId, updateData)
    
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    
    const { appointmentId } = await params
    const appointment = await AppointmentService.getAppointmentById(appointmentId)
    
    if (!appointment) {
      return NextResponse.json({ message: 'Appointment not found' }, { status: 404 })
    }
    
    return NextResponse.json(appointment)
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
