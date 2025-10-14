
import UserSessionService from '@/services/AuthService/UserSessionService';
import CommentService from '@/services/CommentService';
import PostService from '@/services/PostService';
import { NextResponse } from "next/server";

export async function POST(request: NextRequest, _response: NextResponse) {

    try {
        await UserSessionService.authenticateUserByRequest(request, "USER");

        const { content, postId, parentId, email, name } = await request.json();

        if (!name || !email || !content) {
            return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
        }

        // Check if the post exists
        const post = await PostService.getPostById(postId);

        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        // Create the comment
        await CommentService.createComment({
            content,
            postId,
            parentId,
            email,
            name,
            status: "NOT_PUBLISHED", // New comments are not published by default
            createdAt: new Date(), // current date and time
        });

        return NextResponse.json({ message: "Comment created successfully." }, { status: 201 });

    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}


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
        const search = searchParams.get('search') || undefined;
        const pending = searchParams.get('pending') === 'true';

        if (pending) {
            // only allow admins to view pending comments
            await UserSessionService.authenticateUserByRequest(request, "ADMIN");
        } else {
            await UserSessionService.authenticateUserByRequest(request, "GUEST");
        }



        const data = {
            page,
            pageSize,
            search,
            postId,
            pending
        }

        const result = await CommentService.getAllComments(data);
        return NextResponse.json({ comments: result.comments, total: result.total, page, pageSize });

    }
    catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest, _response: NextResponse) {

    try {
        await UserSessionService.authenticateUserByRequest(request, "ADMIN");
        const data = await request.json();
        await CommentService.updateComment(data);
        return NextResponse.json({ message: "Comment updated successfully." });
    } catch (error: any) {
        console.error(error.message);
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }

}
