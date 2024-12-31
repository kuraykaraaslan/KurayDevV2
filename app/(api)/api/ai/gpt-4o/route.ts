"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";

import { Post } from "@prisma/client";
import OpenAIService from "@/services/OpenAIService";
import AuthService from "@/services/AuthService";


/**
 * POST handler for creating a new post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new post data or an error message
 */
export async function POST(req: NextRequest) {
    try {

        AuthService.authenticateSync(req, "ADMIN");
        
        const { prompt } = await req.json();
       

        const text = await OpenAIService.generateText(prompt);

        return NextResponse.json({ text });
    }
    catch (error: any) {
        return NextResponse.json(
            { error: error.message },
            { status: 500 }
        );
    }
}