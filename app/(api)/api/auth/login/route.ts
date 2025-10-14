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

        return NextResponse.json({
            user,
            accessToken: rawAccessToken,
            refreshToken: rawRefreshToken,
            otpVerifyNeeded,
        }, {
            status: 200,
            headers: {
                "Set-Cookie": [
                    `accessToken=${rawAccessToken}; Path=/; HttpOnly; SameSite=Strict; Secure`,
                    `refreshToken=${rawRefreshToken}; Path=/; HttpOnly; SameSite=Strict; Secure`,
                ].join(", ")    
            }
        });

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
