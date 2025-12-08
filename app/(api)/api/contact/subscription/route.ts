
import { NextRequest, NextResponse } from 'next/server';
import SubscriptionService from '@/services/SubscriptionService';

type ResponseData = {
    message: string;
};

export async function POST(request: NextRequest, _response: NextResponse<ResponseData>) {

    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }


    try {
        await SubscriptionService.createSubscription(email);  
        return NextResponse.json({ message: "You have been successfully subscribed." });

    } catch (error) { 

        return NextResponse.json({ message: "An error occurred while trying to subscribe." }, { status: 500 });

    }
}

export async function DELETE(request: NextRequest, _response: NextResponse<ResponseData>) {

    const { email } = await request.json();

    if (!email) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }

    try {
        await SubscriptionService.deleteSubscription(email);
        return NextResponse.json({ message: "You have been successfully unsubscribed." });
    } catch (error) {
        return NextResponse.json({ message: "An error occurred while trying to unsubscribe." }, { status: 500 });
    }

}