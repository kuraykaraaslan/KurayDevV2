import { NextResponse } from 'next/server'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService'
import { Day, Slot } from '@/types/CalendarTypes'
import UserSessionService from '@/services/AuthService/UserSessionService'

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ day: Day }> }
) {
    try {
    const { day } = await params
    if (!day) {
        return NextResponse.json(
            { success: false, message: 'Day is required' },
            { status: 400 }
        )
    }
    const slotsTemplate = await SlotTemplateService.getSlotTemplate(day)

    return NextResponse.json(slotsTemplate)
    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
) {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const { day, slots } = await request.json()

    if (!day) {
        return NextResponse.json(
            { success: false, message: 'Day is required' },
            { status: 400 }
        )
    }

    if (!slots || !Array.isArray(slots)) {
        return NextResponse.json(
            { success: false, message: 'Slots are required and must be an array' },
            { status: 400 }
        )
    }

    const result = Day.safeParse(day)

    if (!result.success) {
        return NextResponse.json(
            { success: false, message: 'Invalid day', issues: result.error.issues },
            { status: 400 }
        )
    }

    for (const slot of slots) {
        const result = Slot.safeParse(slot)
        if (!result.success) {
            return NextResponse.json(
                { success: false, message: 'Invalid slot', issues: result.error.issues },
                { status: 400 }
            )
        }
    }

    const slotsTemplate = await SlotTemplateService.createOrUpdateSlotTemplate(day, slots)

    return NextResponse.json({ slotsTemplate })
}
