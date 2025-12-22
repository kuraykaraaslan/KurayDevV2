

import { NextResponse } from "next/server";
import StatService from "@/services/StatService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import { GetStatsRequestSchema } from "@/dtos/StatsDTO";

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function POST(request: NextRequest) {

    try {

        const body = await request.json();
        
        const parsedData = GetStatsRequestSchema.safeParse(body);
        
        if (!parsedData.success) {
          return NextResponse.json({
            success: false,
            message: parsedData.error.errors.map(err => err.message).join(", ")
          }, { status: 400 });
        }

        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const { frequency } = parsedData.data;
        
        const stats = await StatService.getAllStats(frequency);

        const values = {
            totalPosts: stats.totalPosts || 0,
            totalCategories: stats.totalCategories || 0,
            totalUsers: stats.totalUsers || 0,
            totalViews: stats.totalViews || 0,
            totalComments: stats.totalComments || 0,
        };
        
        return NextResponse.json({ 
            success: true,
            message: 'Statistics retrieved successfully',
            totalPosts: values.totalPosts,
            totalCategories: values.totalCategories,
            totalUsers: values.totalUsers,
            totalViews: values.totalViews,
            totalComments: values.totalComments,
        });

    }
    catch (error: any) {
        console.error("Error in POST /api/stats:", error);
        return NextResponse.json({
            success: false,
            message: error.message 
        }, { status: 500 });
    }
}
