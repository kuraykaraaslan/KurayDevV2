"use server";

import { NextResponse } from "next/server";
import { Post } from "@prisma/client";
import prisma from '@/libs/prisma';
import CategoryService from "@/services/CategoryService";


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

        const result = await CategoryService.getAllCategories(page, pageSize, search);

        return NextResponse.json({ categories: result.categories, total: result.total });

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


        const body = await request.json();

        //check if the body is [] or {},
        if (Object.keys(body).length === 0) {

            const { title, description, slug, image } = body;

            const data = {
                title,
                description,
                slug,
                image,
            };

            const category = await CategoryService.createCategory(data);

            return NextResponse.json({ category });
        } else {
            //if the body is an array then loop through the array and create the categories
            const categories = [];

            for (const category of body) {

                const { title, description, slug, image } = category;

                const data = {
                    title,
                    description,
                    slug,
                    image,
                };

                const newCategory = await CategoryService.createCategory(data);
                categories.push(newCategory);
            }

            return NextResponse.json({ categories });
        }

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
 * DELETE handler for deleting all categories.
 * @param request - The incoming request object
 * @returns A NextResponse containing a success message or an error message
 * */

export async function DELETE(request: Request) {
    try {
        await CategoryService.deleteAllCategories();

        return NextResponse.json(
            { message: "All categories deleted successfully." }
        );
    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}