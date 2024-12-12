"use server";
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import SubscriptionService from '@/services/SubscriptionService';

type ResponseData = {
    message: string;
};

export async function POST(req: NextRequest, res: NextResponse<ResponseData>) {

    const { email } = await req.json();

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

export async function DELETE(req: NextRequest, res: NextResponse<ResponseData>) {

    const { email } = await req.json();

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