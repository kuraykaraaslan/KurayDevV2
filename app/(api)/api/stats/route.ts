"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import StatService from "@/services/StatService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest) {

    try {

        AuthService.authenticateSync(request, "ADMIN");

        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const stats = await StatService.getAllStats();

        const values = {
            totalPosts: stats[0],
            totalCategories: stats[1],
            totalUsers: stats[2],
            totalViews: stats[3]._sum.views,
            totalComments: stats[4]
        };


        return NextResponse.json({ values });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
