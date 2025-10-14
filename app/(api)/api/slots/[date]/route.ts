import { NextResponse } from 'next/server'
import SlotService from '@/services/AppointmentService/SlotService'
import { Slot } from '@/types/CalendarTypes'
import UserSessionService from '@/services/AuthService/UserSessionService'

/**
 * [day] → MONDAY..SUNDAY
 * GET:   haftalık şablonu getirir
 * POST:  haftalık şablonu kaydeder  { slots: [{ time, length? }] }
 */

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ date: string }> }
) {
    try {
        const { date } = await params

        console.log("date", date);

        if (!date) {
            return NextResponse.json(
                { success: false, message: 'Date is required' },
                { status: 400 }
            )
        }

        const slots = await SlotService.getAllSlotsForDate(date)

        return NextResponse.json({ slots })
    } catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest
) {

    await UserSessionService.authenticateUserByRequest(request, "ADMIN");

    const body = await request.json()

    const result = Slot.safeParse(body)
    if (!result.success) {
        return NextResponse.json(
            { success: false, message: 'Invalid slot data', issues: result.error.issues },
            { status: 400 }
        )
    }

    const slotData = result.data

    const createdSlot = await SlotService.createSlot(slotData)

    return NextResponse.json({ success: true, slot: createdSlot })
}

