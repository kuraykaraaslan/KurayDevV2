"use server";

import { NextResponse } from "next/server";
import { Post } from "@prisma/client";
import prisma from '@/libs/prisma';
import { auth } from "@/libs/auth";
import PostService from "@/services/PostService";


/**
 * GET handler for retrieving all posts with optional pagination and search.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || undefined;

        const result = await PostService.getAllPosts(page, pageSize, search);

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
export async function POST(request: Request) {
    try {
        const session = await auth();

        if (!session) {
            console.error('Unauthorized');
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

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