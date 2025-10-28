// Original path: app/api/auth/logout/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(_request: NextRequest) {
    try {

        const response = NextResponse.json({
            message: AuthMessages.LOGGED_OUT_SUCCESSFULLY,
        }, {
            status: 200,
        });

        // Clear cookies properly for both production and development
        const isProduction = process.env.NODE_ENV === 'production';
        
        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        
        response.cookies.set('refreshToken', '', {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });

        return response;

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
