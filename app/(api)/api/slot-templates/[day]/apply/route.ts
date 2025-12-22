import { NextResponse } from 'next/server'
import SlotService from '@/services/AppointmentService/SlotService'
import { Day, Slot } from '@/types/features'
import UserSessionService from '@/services/AuthService/UserSessionService'
import SlotTemplateService from '@/services/AppointmentService/SlotTemplateService';
import { ApplySlotTemplateRequestSchema } from '@/dtos/SlotDTO';
import SlotMessages from '@/messages/SlotMessages';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ day: Day }> }
) {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const body = await request.json();
    
    const parsedData = ApplySlotTemplateRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json({
        
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const { formattedDate } = parsedData.data;
    const { day } = await params

    if (!day) {
        return NextResponse.json(
            { message: SlotMessages.DAY_REQUIRED },
            { status: 400 }
        )
    }

    const SlotTemplate = await SlotTemplateService.getSlotTemplate(day);
    
    if (!SlotTemplate || SlotTemplate.slots.length === 0) {
        return NextResponse.json(
            { message: SlotMessages.SLOT_TEMPLATE_NOT_FOUND },
            { status: 404 }
        )
    }

    await SlotService.emptySlotsForDate(new Date(formattedDate));

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

    return NextResponse.json({  slots: createdSlots })
}



