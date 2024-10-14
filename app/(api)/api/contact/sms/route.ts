"use server";
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

//Log service   
import LogService from '@/services/LogService';

//SMS service
import SMSService from '@/services/SMSService';
import twillio from 'twilio';
import { t } from 'i18next';

type ResponseData = {
    message: string;
};


export async function POST(req: NextRequest, res: NextResponse<ResponseData>) {

    try {

        const body = await req.body;

        return NextResponse.json({ message: "SMS sent successfully" });

    }

    catch (error: any) {
        console.error(error);
        await LogService.error(error.message);
        return NextResponse.json({ message: "An error occurred while sending the SMS." }, { status: 500 });
    }
}

