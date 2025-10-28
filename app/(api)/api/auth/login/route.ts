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

        // Set cookies properly for both production and development
        const isProduction = process.env.NODE_ENV === 'production';
        
        response.cookies.set('accessToken', rawAccessToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });
        
        response.cookies.set('refreshToken', rawRefreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        });

        return response;

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
