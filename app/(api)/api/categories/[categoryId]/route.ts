
import { NextResponse } from "next/server";
import CategoryService from "@/services/CategoryService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import CategoryMessages from "@/messages/CategoryMessages";
import { UpdateCategoryRequestSchema } from "@/dtos/CategoryDTO";

/**
 * GET handler for retrieving a category by its Id.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const category = await CategoryService.getCategoryById(categoryId);

    if (!category) {
      return NextResponse.json(
        { message: CategoryMessages.CATEGORY_NOT_FOUND },
        { status: 404 }
      );
    }

    return NextResponse.json({  message: CategoryMessages.CATEGORY_RETRIEVED, category });

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
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {

    await UserSessionService.authenticateUserByRequest({ request });


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
      {  message: CategoryMessages.CATEGORY_DELETED_SUCCESSFULLY }
    );
  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * PUT handler for updating a category by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including categoryId
 * @returns A NextResponse containing the updated category data or an error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {

    await UserSessionService.authenticateUserByRequest({ request });

    const { categoryId } = await params;

    const data = await request.json();
    data.categoryId = categoryId;

    const parsedData = UpdateCategoryRequestSchema.safeParse(data);

    if (!parsedData.success) {
      return NextResponse.json({
        error: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const category = await CategoryService.updateCategory(parsedData.data);

    return NextResponse.json({ category });

  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}
