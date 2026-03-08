import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { AppointmentStatus } from '@/types/features/CalendarTypes'

export async function GET(request: NextRequest) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { searchParams } = new URL(request.url)
    // Extract query parameters (0-based pagination from DynamicTable)
    const page = parseInt(searchParams.get('page') || '0', 10)
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10)
    const startDate = searchParams.get('startDate') || undefined
    const endDate = searchParams.get('endDate') || undefined
    const status = (searchParams.get('status') as AppointmentStatus) || undefined
    const appointmentId = searchParams.get('appointmentId') || undefined
    const email = searchParams.get('email') || undefined
    const search = searchParams.get('search') || undefined
    const sortKey = searchParams.get('sortKey') || undefined
    const sortDir = (searchParams.get('sortDir') || 'desc') as 'asc' | 'desc'

    const result = await AppointmentService.getAllAppointments({
      page,
      pageSize,
      status,
      startDate,
      endDate,
      appointmentId,
      email,
      search,
      sortKey,
      sortDir,
    })

    return NextResponse.json({
      appointments: result.appointments,
      total: result.total,
      page,
      pageSize,
    })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
