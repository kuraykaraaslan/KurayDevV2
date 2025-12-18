import { NextResponse } from "next/server";
import CategoryService from "@/services/CategoryService";
import UserSessionService from "@/services/AuthService/UserSessionService";   


/**
 * GET handler for retrieving all posts with optional pagination and search.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '1', 10) : 1;
        const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') || '10', 10) : 10;
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
export async function POST(request: NextRequest) {
    try {

        await UserSessionService.authenticateUserByRequest({ request });

        const body = await request.json();

        const { title, description, slug, image } = body;

        const data = {
            title,
            description,
            slug,
            image,
        };

        const category = await CategoryService.createCategory(data);

        return NextResponse.json({ category });

    } catch (error: any) {
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

export async function DELETE(_request: Request) {
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