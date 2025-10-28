// Original path: app/api/auth/login/route.ts
 
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import AuthMessages from "@/messages/AuthMessages";
import UserSessionService from "@/services/AuthService/UserSessionService";
import RateLimiter from "@/libs/rateLimit";
import { LoginRequest } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);


        const parsedData = LoginRequest.safeParse(await request.json());

        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const { email, password } = parsedData.data;

        const user = await AuthService.login({ email, password });

        if (!user) {
            throw new Error(AuthMessages.INVALID_CREDENTIALS);
        }

        const { rawAccessToken, rawRefreshToken, otpVerifyNeeded } = await UserSessionService.createSession(user, request);

        const response = NextResponse.json({
            user,
            accessToken: rawAccessToken,
            refreshToken: rawRefreshToken,
            otpVerifyNeeded,
        }, {
            status: 200,
        });

        // Determine if we're in a secure context (HTTPS)
        const protocol = request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http';
        const isSecure = protocol === 'https';
        
        console.log('[LOGIN] Setting cookies - isSecure:', isSecure, 'protocol:', protocol);
        console.log('[LOGIN] Request headers:', {
            host: request.headers.get('host'),
            origin: request.headers.get('origin'),
            'x-forwarded-host': request.headers.get('x-forwarded-host'),
            'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
        });
        
        // Set cookies with appropriate security settings
        response.cookies.set('accessToken', rawAccessToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        response.cookies.set('refreshToken', rawRefreshToken, {
            httpOnly: true,
            secure: isSecure,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        console.log('[LOGIN] Cookies set successfully');

        return response;

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
