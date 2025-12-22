
import { NextRequest, NextResponse } from 'next/server';


type ResponseData = {
    message: string;
    mails: Array<{
        mail: string;
    }>;
};

export async function GET(_request: NextRequest, _response: NextResponse<ResponseData>) {

    const mails = [
        {
            "mail": "kuraykaraaslan@gmail.com"
        }
    ]

    return NextResponse.json({  message: "Contact mails retrieved successfully", mails });
}
//


