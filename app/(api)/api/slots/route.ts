import SlotService from "@/services/AppointmentService/SlotService";
import { NextResponse } from "next/server";
import { GetSlotsRequestSchema } from "@/dtos/SlotDTO";

export async function GET(
    req: Request
) {

    try {

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;
        
        const parsedData = GetSlotsRequestSchema.safeParse({ startDate, endDate });
        
        if (!parsedData.success) {
            return NextResponse.json({
                message: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        console.log(`Fetching slots from ${startDate} to ${endDate}`);

        const { slots, total } = await SlotService.getAllSlotsForDateRange({
            startDate,
            endDate
        });

        return NextResponse.json({ slots, total });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}