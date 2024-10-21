"use server";
import { NextResponse } from "next/server";
import PostService from "@/services/PostService";

/**
 * GET handler for retrieving a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  request: Request,
  { params }: { params: { postSlug: string } }
) {
  try {
    const { postSlug } = params;
    const post = await PostService.getPostBySlug(postSlug);

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
  request: Request,
  { params }: { params: { postSlug: string } }
) {
  try {
    const { postSlug } = params;
    const post = await PostService.getPostBySlug(postSlug);

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
  request: Request,
  { params }: { params: { postSlug: string } }
) {
  try {
    const { postSlug } = params;
    const post = await PostService.getPostBySlug(postSlug);

    if (!post) {
      return NextResponse.json(
        { message: "Post not found." },
        { status: 404 }
      );
    }

    const data = await request.json();
    const updatedPost = await PostService.updatePost(post.postId, data);

    return NextResponse.json({ post: updatedPost });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}