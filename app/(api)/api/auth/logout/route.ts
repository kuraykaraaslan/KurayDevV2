// Original path: app/api/auth/logout/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";
import UserSessionService from "@/services/AuthService/UserSessionService";

export async function POST(request: NextRequest) {
    try {

        const { userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER", otpVerifyBypass: true });

        const response = NextResponse.json({
            
            message: AuthMessages.LOGGED_OUT_SUCCESSFULLY,
        }, {
            status: 200,
        });

        // Determine if we're in a secure context (HTTPS)
        const origin = request.headers.get('origin') || '';
        const protocol = request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http';
        const isSecure = origin.startsWith('https://') || protocol === 'https';
        
        response.cookies.set('accessToken', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: isSecure ? 'none' as const : 'lax' as const,
            path: '/',
            maxAge: 0,
        });
        
        response.cookies.set('refreshToken', '', {
            httpOnly: true,
            secure: isSecure,
            sameSite: isSecure ? 'none' as const : 'lax' as const,
            path: '/',
            maxAge: 0,
        });

        await UserSessionService.deleteSession(userSession);

        return response;

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ 
            
            message: error.message || AuthMessages.LOGOUT_FAILED 
        }, { status: 500 });
    }
}
