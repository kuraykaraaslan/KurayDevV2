// path: app/api/auth/me/route.ts
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import UserSessionService from "@/services/AuthService/UserSessionService";

export async function GET(request: NextRequest) {
    try {
        await UserSessionService.authenticateUserByRequest(request, "USER");
        return NextResponse.json({ user: request.user }, { status: 200 });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}