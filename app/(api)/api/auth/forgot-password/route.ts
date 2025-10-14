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
