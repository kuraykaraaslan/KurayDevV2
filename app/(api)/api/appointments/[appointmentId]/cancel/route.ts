import { NextResponse } from 'next/server'
import Logger from '@/libs/logger'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import AppointmentService from '@/services/AppointmentService'
import AppointmentMessages from '@/messages/AppointmentMessages'
import AuthMessages from '@/messages/AuthMessages'
import { CancelAppointmentRequestSchema } from '@/dtos/AppointmentActionDTO'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ appointmentId: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { appointmentId } = await params

    const parsedData = CancelAppointmentRequestSchema.safeParse({ appointmentId })

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const result = await AppointmentService.cancelAppointment(appointmentId, { isAdmin: true })

    return NextResponse.json(
      { message: AppointmentMessages.APPOINTMENT_CANCELLED_SUCCESSFULLY, data: result },
      {
        status: 200,
      }
    )
  } catch (err: any) {
    // AuthMiddleware throws USER_DOES_NOT_HAVE_REQUIRED_ROLE when no session
    // cookies are present at all, and USER_NOT_AUTHENTICATED for an invalid
    // token or an insufficient role.
    if (
      err?.message === AuthMessages.USER_NOT_AUTHENTICATED ||
      err?.message === AuthMessages.USER_DOES_NOT_HAVE_REQUIRED_ROLE
    ) {
      return NextResponse.json({ message: AuthMessages.USER_NOT_AUTHENTICATED }, { status: 401 })
    }

    Logger.error('API/appointments/[appointmentId]/cancel POST: ' + err.message)
    return NextResponse.json(
      { message: AppointmentMessages.APPOINTMENT_CANCELLATION_FAILED },
      { status: 500 }
    )
  }
}
