// Original path: app/api/auth/login/route.ts

import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";
import RateLimiter from "@/libs/rateLimit";
import PasswordService from "@/services/AuthService/PasswordService";
import { ForgotPasswordRequest } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);

        const parsedData = ForgotPasswordRequest.safeParse(await request.json());

        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const { email } = parsedData.data;

        await PasswordService.forgotPassword({ email });

        const response = NextResponse.json({
            message: AuthMessages.FORGOT_PASSWORD_SUCCESSFUL,
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
