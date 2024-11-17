"use server";
import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import UserService from "@/services/UserService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}

/**
 * DELETE handler for deleting a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");

    const { userId } = params;
    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const requestUser = AuthService.getUserFromRequest(request);

    // Check if the user is trying to delete themselves
    if (requestUser.userId === user.userId) {
      return NextResponse.json(
        { message: "You cannot delete yourself." },
        { status: 403 }
      );
    }

    await UserService.deleteUser(user.userId);

    return NextResponse.json(
      { message: "User deleted successfully." }
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
 * PUT handler for updating a user by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including userId
 * @returns A NextResponse containing the updated user data or an error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {

    AuthService.authenticateSync(request, "ADMIN");
    
    const { userId } = params;
    const user = await UserService.getUserById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "User not found." },
        { status: 404 }
      );
    }

    const {body} = await request.json();
    const updatedUser = await UserService.updateUser(user.userId, body);

    return NextResponse.json({ user: updatedUser });
  }
  catch (error : any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}