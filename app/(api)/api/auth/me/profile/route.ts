// path: app/api/auth/me/preferences/route.ts
import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserService from "@/services/UserService";
import RateLimiter from "@/libs/rateLimit";
import { UpdateProfileRequestSchema } from "@/dtos/AuthDTO";
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

        const { userProfile } = await request.json();

        console.log('Received userProfile:', userProfile);
        
        const parsedData = UpdateProfileRequestSchema.safeParse(userProfile);
        console.log('Parsed data:', parsedData);

        if (!parsedData.success) {
            console.log('Validation errors:', parsedData.error);
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
            data: { userProfile: parsedData.data }
        });


        return NextResponse.json(
            { 
                message: AuthMessages.PROFILE_UPDATED_SUCCESSFULLY,
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
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

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
