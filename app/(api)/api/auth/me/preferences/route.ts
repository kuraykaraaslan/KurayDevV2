// path: app/api/auth/me/preferences/route.ts
import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserService from "@/services/UserService";
import RateLimiter from "@/libs/rateLimit";
import { UserPreferencesSchema } from '@/types/user/UserTypes';
import { UpdatePreferencesRequestSchema } from "@/dtos/AuthDTO";
import AuthMessages from "@/messages/AuthMessages";

// NextRequest is declared globally in global.d.ts

export async function PUT(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

        const userId = request.user?.userId;
        if (!userId) {
            return NextResponse.json(
                { message: AuthMessages.USER_NOT_AUTHENTICATED },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        const parsedData = UpdatePreferencesRequestSchema.safeParse(body);

        if (!parsedData.success) {
            return NextResponse.json(
                { 
                    message: parsedData.error.errors.map(err => err.message).join(", ")
                },
                { status: 400 }
            );
        }

        // Update user preferences
        const updatedUser = await UserService.update({
            userId,
            data: parsedData.data
        });

        return NextResponse.json(
            { 
                message: AuthMessages.PREFERENCES_UPDATED_SUCCESSFULLY,
                userPreferences: updatedUser.userPreferences
            },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        await RateLimiter.checkRateLimit(request);
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

        const userId = request.user?.userId;
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const {userPreferences} = await UserService.getById(userId);
        
        return NextResponse.json(
            { userPreferences: userPreferences},
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}
