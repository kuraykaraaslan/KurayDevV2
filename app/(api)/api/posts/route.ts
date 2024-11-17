"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import { Post } from "@prisma/client";
import prisma from '@/libs/prisma';
import PostService from "@/services/PostService";
import AuthService from "@/services/AuthService";


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
        const onlyPublished = searchParams.get('onlyPublished') === 'true';
        const categoryId = searchParams.get('categoryId') || undefined;
        const search = searchParams.get('search') || undefined;

        const result = await PostService.getAllPosts(page, pageSize, search, onlyPublished, categoryId);

        return NextResponse.json({ posts: result.posts, total: result.total , page, pageSize });

    }
    catch (error: any) {
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

        AuthService.authenticateSync(request, "ADMIN");

        const {body} = await request.json();
        console.log(body);

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