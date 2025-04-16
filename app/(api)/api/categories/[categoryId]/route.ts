"use server";
import { NextResponse } from "next/server";
import CategoryService from "@/services/CategoryService";
import AuthService from "@/services/AuthService";
import NextRequest from "@/types/NextRequest";

/**
 * GET handler for retrieving a category by its Id.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  request: NextRequest,

  { params }: { params: { categoryId: string } }
) {
  try {
    const { categoryId } = await params
    const category = await CategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ category });

  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a category by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { categoryId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");
    
    const { categoryId } = params;
    const category = await CategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { message: "Category not found." },
        { status: 404 }
      );
    }

    await CategoryService.deleteCategory(category.categoryId);

    return NextResponse.json(
      { message: "Category deleted successfully." }
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
  { params }: { params: { categoryId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");

    const { categoryId } = params;
    const post = await CategoryService.getCategoryById(categoryId);

    if (!post) {
      return NextResponse.json(
        { message: "Category not found." },
        { status: 404 }
      );
    }

    const data = await request.json();
    
    const updatedCategory = await CategoryService.updateCategory(post.categoryId, data);

    return NextResponse.json({ category: updatedCategory });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}