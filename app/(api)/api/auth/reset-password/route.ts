// Original path: app/api/auth/login/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";
import RateLimiter from "@/libs/rateLimit";
import PasswordService from "@/services/AuthService/PasswordService";
import { ResetPasswordRequest } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);

        const { email , resetToken, password } = await request.json();

        const parsedData = ResetPasswordRequest.safeParse({ email, resetToken, password });

        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        await PasswordService.resetPassword(parsedData.data);

        const response = NextResponse.json({
            message: AuthMessages.PASSWORD_RESET_SUCCESSFUL,
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
        return NextResponse.json({ error: AuthMessages.PASSWORD_RESET_FAILED }, { status: 500 });
    }
}
