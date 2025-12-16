// path: app/api/auth/me/preferences/route.ts
import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserService from "@/services/UserService";
import RateLimiter from "@/libs/rateLimit";
import { UserPreferencesSchema } from "@/types/UserTypes";
import { UserProfileSchema } from "@/types/UserProfileTypes";
import { use } from "react";

// NextRequest is declared globally in global.d.ts

export async function PUT(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);
        await UserSessionService.authenticateUserByRequest(request, "USER");

        const userId = request.user?.userId;
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        
        // Validate preferences data
        const profilesValidation = UserProfileSchema.safeParse(body.userProfile);

        if (!profilesValidation.success) {
            return NextResponse.json(
                { 
                    message: "Invalid profile",
                    errors: profilesValidation.error.errors
                },
                { status: 400 }
            );
        }

        // Update user preferences
        const updatedUser = await UserService.update({
            userId,
            data: {
                userProfile: profilesValidation.data
            }
        });

        return NextResponse.json(
            { 
                message: "Preferences updated successfully",
                userProfile: updatedUser.userProfile
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
        await UserSessionService.authenticateUserByRequest(request, "USER");

        const userId = request.user?.userId;
        if (!userId) {
            return NextResponse.json(
                { message: "Unauthorized" },
                { status: 401 }
            );
        }

        const {userProfile} = await UserService.getById(userId);
        
        return NextResponse.json(
            { userProfile },
            { status: 200 }
        );
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message || "An error occurred" },
            { status: 500 }
        );
    }
}
