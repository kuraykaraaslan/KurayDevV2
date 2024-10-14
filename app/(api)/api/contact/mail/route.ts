"use server";
import { NextRequest, NextResponse } from 'next/server';


type ResponseData = {
    message: string;
    mails: Array<{
        mail: string;
    }>;
};

export async function GET(req: NextRequest, res: NextResponse<ResponseData>) {

    const mails = [
        {
            "mail": "kuraykaraaslan@gmail.com"
        }
    ]

    return NextResponse.json({ message: "mails fetched successfully", mails });
}
//


