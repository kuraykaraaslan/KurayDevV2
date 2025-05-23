"use server";

import { NextResponse } from "next/server";
   
import PostService from "@/services/PostService";
import AuthService from "@/services/AuthService";
import UserSessionService from "@/services/AuthService/UserSessionService";


/**
 * GET handler for retrieving all posts with optional pagination and search.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(request: NextRequest) {
    try {

        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const postId = searchParams.get('postId') || undefined;
        const userId = searchParams.get('userId') || undefined;
        const status = searchParams.get('status') || 'PUBLISHED';
        const categoryId = searchParams.get('categoryId') || undefined;
        const search = searchParams.get('search') || undefined;

        const result = await PostService.getAllPosts({
            page,
            pageSize,
            status,
            categoryId,
            search,
            postId,
            userId
        });

        return NextResponse.json({ posts: result.posts, total: result.total , page, pageSize });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST handler for creating a new post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new post data or an error message
 */
export async function POST(request: NextRequest) {
    try {

        UserSessionService.authenticateUserByRequest(request, "ADMIN");

        const body = await request.json();

        const post = await PostService.createPost(body);
        
        return NextResponse.json({ post });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

/**
 * PUT handler for updating a post.
 * @param request - The incoming request object
 * @returns A NextResponse containing the updated post data or an error message
 */
export async function PUT(request: NextRequest) {
    try {

        await UserSessionService.authenticateUserByRequest(request, "ADMIN");

        const data = await request.json();
 
        const post = await PostService.updatePost(data);
        
        return NextResponse.json({ post });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

