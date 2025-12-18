import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserService from "@/services/UserService";
import { UpdateUserSchema } from "@/types/UserTypes";

/**
 * GET handler for retrieving current user profile.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest(request, "USER");

    return NextResponse.json({ user });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 401 }
    );
  }
}

/**
 * PUT handler for updating current user profile.
 */
export async function PUT(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest(request, "USER");

    const data = await request.json();

    // Validate data
    const validation = UpdateUserSchema.safeParse(data);

    if (!validation.success) {
      return NextResponse.json(
        { message: "INVALID_USER_DATA", errors: validation.error.errors },
        { status: 400 }
      );
    }

    // Update the user
    const updatedUser = await UserService.update({
      userId: user.userId,
      data: validation.data,
    });

    if (!updatedUser) {
      return NextResponse.json(
        { message: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user: updatedUser });
  } catch (error: any) {
    console.error("Update user error:", error);
    return NextResponse.json(
      { message: error.message },
      { status: 400 }
    );
  }
}
