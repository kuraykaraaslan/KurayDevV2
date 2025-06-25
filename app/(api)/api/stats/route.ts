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

        await UserSessionService.authenticateUserByRequest(request);

        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const stats = await StatService.getAllStats();

        console.log("Stats:", stats);

        const values = {
            totalPosts: stats[0],
            totalCategories: stats[1],
            totalUsers: stats[2],
            totalViews: stats[3],
            totalComments: stats[4]
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
