"use server";
import { NextResponse , NextRequest} from 'next/server';

type ResponseData = {
    message: string;
    phones: Array<{
        CountryCode: string;
        PhoneNumber: string;
        noSpacePhoneNumber: string;
        hasTelegram: boolean;
        hasWhatsapp: boolean;
    }>;
};

export async function GET(req: NextRequest, res: NextResponse<ResponseData>) {

    const phones = [
        {
            "CountryCode": "gb",
            "PhoneNumber": "+44 7456 373554",
            "noSpacePhoneNumber": "+447456373554",
            "hasWhatsapp": false,
            "hasTelegram": false
        },
        {
            "CountryCode": "us",
            "PhoneNumber": "+1 251 564 0856",
            "noSpacePhoneNumber": "+1 251 564 0856",
            "hasWhatsapp": false,
            "hasTelegram": false
        },
        {
            "CountryCode": "tr",
            "PhoneNumber": "+90 545 922 3554",
            "noSpacePhoneNumber": "+905459223554",
            "hasWhatsapp": false,
            "hasTelegram": false
        }
    ]

    return NextResponse.json({ message: "phones fetched successfully", phones });
}
//


