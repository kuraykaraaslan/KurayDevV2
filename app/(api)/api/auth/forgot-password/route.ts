// Original path: app/api/auth/login/route.ts

 
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import AuthMessages from "@/messages/AuthMessages";
import UserSessionService from "@/services/AuthService/UserSessionService";
import RateLimiter from "@/libs/rateLimit";
import PasswordService from "@/services/AuthService/PasswordService";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.useRateLimit(request);

        const { email } = await request.json();

        await PasswordService.forgotPassword({ email });

        return NextResponse.json({
            message: AuthMessages.FORGOT_PASSWORD_SUCCESSFUL,
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
