// Original path: app/api/auth/login/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";
import RateLimiter from "@/libs/rateLimit";
import PasswordService from "@/services/AuthService/PasswordService";
import { ResetPasswordRequest } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.useRateLimit(request);

        const { email , resetToken, password } = await request.json();

        const parsedData = ResetPasswordRequest.safeParse({ email, resetToken, password });

        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        await PasswordService.resetPassword(parsedData.data);

        return NextResponse.json({
            message: AuthMessages.PASSWORD_RESET_SUCCESSFUL,
        }, {
            status: 200,
            headers: {
                "Set-Cookie": [
                    `accessToken=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`,
                    `refreshToken=; Path=/; HttpOnly; SameSite=Strict; Secure; Max-Age=0`,
                ].join(", ")
            }
        });

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: AuthMessages.PASSWORD_RESET_FAILED }, { status: 500 });
    }
}
