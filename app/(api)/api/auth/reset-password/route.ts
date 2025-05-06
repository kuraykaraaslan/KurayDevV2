// Original path: app/api/auth/login/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";
import RateLimiter from "@/libs/rateLimit";
import PasswordService from "@/services/AuthService/PasswordService";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.useRateLimit(request);

        const { email , resetToken, password  } = await request.json();

        await PasswordService.resetPassword({
            email,
            resetToken,
            password,
        });

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
