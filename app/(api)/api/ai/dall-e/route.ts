"use server";

import { NextResponse } from "next/server";
import OpenAIService from "@/services/OpenAIService";
import UserSessionService from "@/services/AuthService/UserSessionService";
/**
 * POST handler for creating a new post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new post data or an error message
 */
export async function POST(request: NextRequest) {
    try {
        await UserSessionService.authenticateUserByRequest(request);
        const { prompt } = await request.json();
        const url = await OpenAIService.generateImage(prompt);
        return NextResponse.json({ url });
    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}