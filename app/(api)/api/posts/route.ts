
import { NextResponse } from "next/server";
import PostService from "@/services/PostService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import KnowledgeGraphService from "@/services/KnowledgeGraphService";
import PostCoverService from "@/services/PostService/PostCoverService";
import { CreatePostRequestSchema, UpdatePostRequestSchema } from "@/dtos/PostDTO";
import { PostStatusEnum } from "@/types/content/BlogTypes";

export async function GET(request: NextRequest) {
    try {

        console.log("GET /api/posts called");

        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '0', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const postId = searchParams.get('postId') || undefined;
        const authorId = searchParams.get('authorId') || undefined;
        const status = searchParams.get('status') || PostStatusEnum.enum.PUBLISHED;
        const categoryId = searchParams.get('categoryId') || undefined;
        const search = searchParams.get('search') || undefined;
        const language = searchParams.get('lang') || searchParams.get('language') || 'en';
        const slug = searchParams.get('slug') || undefined;

        const result = await PostService.getAllPosts({
            page,
            pageSize,
            status,
            categoryId,
            search,
            postId,
            authorId,
            slug,
            language,
        });

        return NextResponse.json({ posts: result.posts, total: result.total, page, pageSize, language });

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

        UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const body = await request.json();
        
        const parsedData = CreatePostRequestSchema.safeParse(body);
        
        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const post = await PostService.createPost(parsedData.data);

        await KnowledgeGraphService.queueUpdatePost(post.postId);
        
        if (!post.image) {
            await PostCoverService.resetById(post.postId);
        }


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

        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        const data = await request.json();
        
        const parsedData = UpdatePostRequestSchema.safeParse(data);
        
        if (!parsedData.success) {
            console.log("Validation errors:", parsedData.error.errors);
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        console.log("Updating post:", parsedData.data.postId);
        const post = await PostService.updatePost(parsedData.data);

        await KnowledgeGraphService.queueUpdatePost(post.postId);
        if (!post.image) {
            await PostCoverService.resetById(post.postId);
        }

        return NextResponse.json({ post });

    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

/**
 * DELETE handler for archiving all posts.
 * @param request - The incoming request object
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(request: NextRequest) {
    try {
        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

        await PostService.deleteAllPosts();

        return NextResponse.json(
            { message: "All posts archived successfully." }
        );
    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

