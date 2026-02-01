import { NextResponse } from "next/server";
import CategoryService from "@/services/CategoryService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import { CreateCategoryRequestSchema } from "@/dtos/CategoryDTO";


/**
 * GET handler for retrieving all posts with optional pagination and search.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '0', 10) : 0;
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
        
        const parsedData = CreateCategoryRequestSchema.safeParse(body);
        
        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const category = await CategoryService.createCategory(parsedData.data);

        return NextResponse.json({ category });

    } catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
