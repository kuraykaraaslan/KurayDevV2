import { NextResponse } from 'next/server'
import SlotService from '@/services/AppointmentService/SlotService'
import { Day, Slot } from '@/types/CalendarTypes'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService';
import { date } from 'zod';



export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ day: Day }> }
) {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const { formattedDate } = await request.json();
    const { day } = await params

    if (!date) {
        return NextResponse.json(
            { success: false, message: 'Date is required' },
            { status: 400 }
        )
    }

    const SlotTemplate = await SlotTemplateService.getSlotTemplate(day);
    
    if (!SlotTemplate || SlotTemplate.slots.length === 0) {
        return NextResponse.json(
            { success: false, message: 'No slot template found for the specified day' },
            { status: 404 }
        )
    }

    await SlotService.emptySlotsForDate(formattedDate);

    const createdSlots: Slot[] = [];

    for (const slot of SlotTemplate.slots) {
        const slotData: Slot = {
            startTime: slot.startTime,
            endTime: slot.endTime,
            capacity: slot.capacity, // Default capacity if not provided
        };
        const createdSlot = await SlotService.createSlot(slotData);
        createdSlots.push(createdSlot);
    }

    return NextResponse.json({ success: true, slots: createdSlots })
}



