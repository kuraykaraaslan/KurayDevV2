// Original path: app/api/auth/logout/route.ts

 
import { NextResponse } from "next/server";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {
    try {

        return NextResponse.json({
            message: AuthMessages.LOGGED_OUT_SUCCESSFULLY,
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
