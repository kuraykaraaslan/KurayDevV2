"use server";
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';
import DiscordService from '@/services/DiscordService';
import ContactFormService from '@/services/ContactFormService';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

type ResponseData = {
    message: string;
};


export async function POST(req: NextRequest, res: NextResponse<ResponseData>) {

    const { name, email, phone, message } = await req.json();

    if (!name || !email || !phone || !message) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }

    const data = {
        name: name,
        email: email,
        phone: phone,
        message: message
    };
    
    try {
        const contactForm = await ContactFormService.createContactForm(data);
        return NextResponse.json({ message: "message sent successfully" });
    }

    catch (error) {
        console.error(error);
        return NextResponse.json({ message: "An error occurred while sending the message." }, { status: 500 });
    }

}




