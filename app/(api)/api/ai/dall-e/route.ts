"use server";

import { NextResponse, NextRequest } from "next/server";

import { Post } from "@prisma/client";
import OpenAIService from "@/services/OpenAIService";

/**
 * POST handler for creating a new post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new post data or an error message
 */
export async function POST(req: NextRequest) {
    try {

        const { prompt } = await req.json();
       

        const url = await OpenAIService.generateImage(prompt);

        return NextResponse.json({ url });
    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}