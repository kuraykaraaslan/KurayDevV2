// path: app/api/auth/me/preferences/route.ts
import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserService from "@/services/UserService";
import RateLimiter from "@/libs/rateLimit";
import { UserPreferencesSchema } from "@/types/UserTypes";

// NextRequest is declared globally in global.d.ts

export async function PUT(request: NextRequest) {
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

        const body = await request.json();
        
        // Validate preferences data
        const preferencesValidation = UserPreferencesSchema.safeParse(body.userPreferences);

        if (!preferencesValidation.success) {
            return NextResponse.json(
                { 
                    message: "Invalid preferences",
                    errors: preferencesValidation.error.errors
                },
                { status: 400 }
            );
        }

        // Update user preferences
        const updatedUser = await UserService.update({
            userId,
            data: {
                userPreferences: preferencesValidation.data
            }
        });

        return NextResponse.json(
            { 
                message: "Preferences updated successfully",
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
