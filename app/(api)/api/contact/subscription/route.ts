
import { NextRequest, NextResponse } from 'next/server';
import SubscriptionService from '@/services/SubscriptionService';
import { SubscriptionRequestSchema } from '@/dtos/AIAndServicesDTO';
import ContactMessages from '@/messages/ContactMessages';

type ResponseData = {
    message: string;
};

export async function POST(request: NextRequest, _response: NextResponse<ResponseData>) {

    const body = await request.json();
    
    const parsedData = SubscriptionRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
        return NextResponse.json({
            message: parsedData.error.errors.map(err => err.message).join(", ")
        }, { status: 400 });
    }

    const { email } = parsedData.data;


    try {
        await SubscriptionService.createSubscription(email);  
        return NextResponse.json({ message: "You have been successfully subscribed." });

    } catch (error) { 

        return NextResponse.json({ message: "An error occurred while trying to subscribe." }, { status: 500 });

    }
}

export async function DELETE(request: NextRequest, _response: NextResponse<ResponseData>) {

    const body = await request.json();
    
    const parsedData = SubscriptionRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
        return NextResponse.json({
            message: parsedData.error.errors.map(err => err.message).join(", ")
        }, { status: 400 });
    }

    const { email } = parsedData.data;

    try {
        await SubscriptionService.deleteSubscription(email);
        return NextResponse.json({ message: "You have been successfully unsubscribed." });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred while trying to unsubscribe." }, { status: 500 });
    }

}