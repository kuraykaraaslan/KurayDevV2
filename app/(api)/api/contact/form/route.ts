"use server";
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import DiscordService from '@/services/DiscordService';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type ResponseData = {
    message: string;
};


export async function POST(req: NextRequest, res: NextResponse<ResponseData>) {

    const { name, email, phone, message } = await req.json();

    if (!name || !email || !phone || !message) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }

    const date = new Date();

    const data = {
        name: name,
        email: email,
        phone: phone,
        message: message,
        date: date,
    };

    var dm = `**${data.name}** sent a message from the website:\n\n
        **Email:** ${data.email}\n
        **Phone:** ${data.phone}\n
        **Message:** ${data.message}\n
        **Date:** ${data.date}\n
        `;
    try {
        await DiscordService.sendWebhookMessage(dm);
        return NextResponse.json({ message: "message sent successfully" });
    }

    catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred while sending the message." }, { status: 500 });
    }

}




