import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'

type RouteParams = { params: Promise<{ appointmentId: string }> }

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    
    const { appointmentId } = await params
    const body = await request.json()
    
    const updated = await AppointmentService.updateAppointment(appointmentId, body)
    
    return NextResponse.json(updated)
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    
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
