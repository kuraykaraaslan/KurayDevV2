import { NextResponse } from "next/server";
import CategoryService from "@/services/CategoryService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import CategoryMessages from "@/messages/CategoryMessages";

/**
 * GET handler for retrieving a category by its Id.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including categoryId
 * @returns A NextResponse containing the category data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || searchParams.get('language') || 'en';

    const category = await CategoryService.getCategoryById(categoryId, language);

    if (!category) {
      return NextResponse.json(
        { message: CategoryMessages.CATEGORY_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({ message: CategoryMessages.CATEGORY_RETRIEVED, category, language });

  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a category by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including categoryId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {

    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });

    const { categoryId } = await params;
    const category = await CategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { message: CategoryMessages.CATEGORY_NOT_FOUND },
        { status: 404 }
      );
    }

    await CategoryService.deleteCategory(category.categoryId);

    return NextResponse.json(
      { message: CategoryMessages.CATEGORY_DELETED_SUCCESSFULLY }
    );
  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
