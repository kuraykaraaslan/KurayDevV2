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

    // if URL is localhost or request is from ::1, not incrementing view count
    if (request.headers.get('host') === 'localhost' || request.headers.get('host') === '::1') {
      return NextResponse.json({ message: "View count not incremented." });
    }

    await PostService.incrementViewCount(postId);
    return NextResponse.json({ message: "View count incremented." });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
