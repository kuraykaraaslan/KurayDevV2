"use server";

import { NextResponse } from "next/server";
import { Post } from "@prisma/client";
import prisma from '@/libs/prisma';
import { auth } from "@/libs/auth";


type ResponseData = {
    message?: string;
    data?: Post[];
    page?: number;
    pageSize?: number;
    total?: number;
};

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

        // Validate page and pageSize
        if (page < 1) {
            return NextResponse.json(
                { message: 'Page number must be greater than 0.' },
                { status: 400 }
            );
        }
        if (pageSize < 1) {
            return NextResponse.json(
                { message: 'Page size must be greater than 0.' },
                { status: 400 }
            );
        }

        // Regular expression for search query validation
        const searchQueryRegex = /^[a-zA-Z0-9\s]{0,100}$/;

        // Regex validation for search query
        if (search && !searchQueryRegex.test(search)) {
            return NextResponse.json(
                {
                    message:
                        'Search query can only contain letters, numbers, and spaces, up to 100 characters.',
                },
                { status: 400 }
            );
        }

        const skip = (page - 1) * pageSize;

        // Build the where clause
        const where: any = {};

        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Fetch posts and total count using a transaction
        const [posts, total] = await prisma.$transaction([
            prisma.post.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: { createdAt: 'desc' },
            }),
            prisma.post.count({ where }),
        ]);

        // Return the posts data
        return NextResponse.json(
            {
                data: posts,
                page,
                pageSize,
                total,
            },
            { status: 200 }
        );
    } catch (error: any) {
        console.error('Error fetching posts:', error);
        return NextResponse.json(
            { message: 'An error occurred while fetching posts.' },
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
        const session = await auth()

        if (!session || !session.user || !session.user.id) {
            return NextResponse.json(
                { message: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { title, content } = await request.json();

        const newPost = await prisma.post.create({
            data: {
                title,
                content,
                slug: title.toLowerCase().replace(/\s+/g, '-'), // Example slug generation
                authorId: session.user.id,
            },
        });

        // Return the new post data
        return NextResponse.json({ data: newPost }, { status: 201 });

    } catch (error: any) {

        console.error('Error creating post:', error);
        return NextResponse.json(
            { message: 'An error occurred while creating the post.' },
            { status: 500 }
        );
        
    }
}