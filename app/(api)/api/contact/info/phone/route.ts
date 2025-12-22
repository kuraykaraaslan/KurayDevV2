
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

export async function GET(_request: NextRequest, _response: NextResponse<ResponseData>) {

    const phones = [
        {
            "CountryCode": "tr",
            "PhoneNumber": "+90 545 922 3554",
            "noSpacePhoneNumber": "+905459223554",
            "hasWhatsapp": false,
            "hasTelegram": false
        }
    ]

    return NextResponse.json({  message: "Contact phones retrieved successfully", phones });
}
//


