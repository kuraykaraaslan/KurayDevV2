"use server";

import { NextResponse } from "next/server";
import StatService from "@/services/StatService";
import UserSessionService from "@/services/AuthService/UserSessionService";

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest) {

    try {

        await UserSessionService.authenticateUserByRequest(request, "ADMIN");

        // Extract query parameters
        const stats = await StatService.getAllStats();

        const values = {
            totalPosts: stats.totalPosts || 0,
            totalCategories: stats.totalCategories || 0,
            totalUsers: stats.totalUsers || 0,
            totalViews: stats.totalViews || 0,
            totalComments: stats.totalComments || 0,
        };
        
        return NextResponse.json({ values });

    }
    catch (error: any) {
        console.error("Error in GET /api/stats:", error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
