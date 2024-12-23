"use server";
import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import PostService from "@/services/PostService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {
    const { postId } = params;
    const post = await PostService.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ post });

  }
  catch (error : any) {
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
  { params }: { params: { postId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");

    const { postId } = params;
    const post = await PostService.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found." },
        { status: 404 }
      );
    }

    await PostService.deletePost(post.postId);

    return NextResponse.json(
      { message: "Post deleted successfully." }
    );
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the updated post data or an error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { postId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");
    
    const { postId } = params;
    const post = await PostService.getPostById(postId);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found." },
        { status: 404 }
      );
    }

    const {body} = await request.json();
    const updatedPost = await PostService.updatePost(post.postId, body);

    return NextResponse.json({ post: updatedPost });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}