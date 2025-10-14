import SlotService from "@/services/AppointmentService/SlotService";
import { NextResponse } from "next/server";


export async function GET(
    req: Request
) {

    try {

        const { searchParams } = new URL(req.url);
        const startDate = searchParams.get('startDate') || undefined;
        const endDate = searchParams.get('endDate') || undefined;


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