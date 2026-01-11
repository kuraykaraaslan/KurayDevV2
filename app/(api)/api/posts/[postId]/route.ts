import { NextResponse } from "next/server";
import PostService from "@/services/PostService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import PostMessages from "@/messages/PostMessages";

/**
 * GET handler for retrieving a post by its Id.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || searchParams.get('language') || 'en';

    const post = await PostService.getPostById(postId, language);

    if (!post) {
      return NextResponse.json(
        { message: PostMessages.POST_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ post, language });

  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const { postId } = await params;
    const post = await PostService.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { message: PostMessages.POST_NOT_FOUND },
        { status: 404 }
      );
    }

    await PostService.deletePost(post.postId);

    return NextResponse.json(
      { message: PostMessages.POST_DELETED_SUCCESSFULLY }
    );
  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
