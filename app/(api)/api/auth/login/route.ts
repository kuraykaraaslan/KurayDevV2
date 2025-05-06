// Original path: app/api/auth/login/route.ts

 
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import AuthMessages from "@/messages/AuthMessages";
import UserSessionService from "@/services/AuthService/UserSessionService";

export async function POST(request: NextRequest) {
    try {

        const { email, password } = await request.json();

        const user = await AuthService.login({ email, password });
        if (!user) {
            throw new Error(AuthMessages.INVALID_CREDENTIALS);
        }

        const { userSession, rawAccessToken, rawRefreshToken, otpVerifyNeeded } = await UserSessionService.createSession(user, request);

        return NextResponse.json({
            user,
            rawAccessToken,
            rawRefreshToken,
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
