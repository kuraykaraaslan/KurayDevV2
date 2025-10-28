// Original path: app/api/auth/logout/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {
    try {

        const response = NextResponse.json({
            message: AuthMessages.LOGGED_OUT_SUCCESSFULLY,
        }, {
            status: 200,
        });

        // Determine if we're in a secure context (HTTPS)
        const protocol = request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http';
        const isSecure = protocol === 'https';
        
        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/',
            maxAge: 0,
        });
        
        response.cookies.set('refreshToken', '', {
            httpOnly: true,
            secure: isSecure,
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
