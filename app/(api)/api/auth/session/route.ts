// path: app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import RateLimiter from "@/libs/rateLimit";

export async function GET(request: NextRequest) {
    try {
        await RateLimiter.checkRateLimit(request);
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });
        return NextResponse.json({ user: request.user }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}