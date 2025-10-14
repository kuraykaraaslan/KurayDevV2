import AppointmentService from '@/services/AppointmentService'
import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { AppointmentStatus } from '@/types/CalendarTypes';

export async function GET(request: NextRequest) {
    try {

        await UserSessionService.authenticateUserByRequest(request, "ADMIN");

        const { searchParams } = new URL(request.url);
        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        const status = searchParams.get('status') as AppointmentStatus || undefined;
        const appointmentId = searchParams.get('appointmentId') || undefined;
        const email = searchParams.get('email') || undefined;

        const result = await AppointmentService.getAllAppointments({
            page,
            pageSize,
            status,
            startDate,
            endDate,
            appointmentId,
            email
        });

        return NextResponse.json({ appointments: result.appointments, total: result.total , page, pageSize });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
