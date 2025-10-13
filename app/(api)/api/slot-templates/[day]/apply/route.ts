import { NextResponse } from 'next/server'
import SlotService from '@/services/AppointmentService/SlotService'
import { Day, Slot, SlotTemplate } from '@/types/CalendarTypes'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService';
import { date } from 'zod';



export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ day: Day }> }
) {

    await UserSessionService.authenticateUserByRequest(request, "ADMIN");

    const { formattedDate } = await request.json();
    const { day } = await params

    if (!date) {
        return NextResponse.json(
            { success: false, message: 'Date is required' },
            { status: 400 }
        )
    }

    console.log("Applying template for 0", day, "to date", formattedDate);

    const SlotTemplate = await SlotTemplateService.getSlotTemplate(day);

    console.log("Fetched template:", SlotTemplate);
    
    if (!SlotTemplate || SlotTemplate.slots.length === 0) {
        return NextResponse.json(
            { success: false, message: 'No slot template found for the specified day' },
            { status: 404 }
        )
    }

    console.log("Applying template for 1", day, "to date", formattedDate);

    await SlotService.emptySlotsForDate(formattedDate);

    console.log("Applying template for", day, "to date", formattedDate);

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



