"use server";
import { NextResponse } from "next/server";
   
import UserService from "@/services/UserService";
import UserSessionService from "@/services/AuthService/UserSessionService";

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

    const { userId } = await params

    await UserSessionService.authenticateUserByRequest(request, "USER");

    const user = await UserService.getById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    return NextResponse.json({ user });

  }
  catch (error: any) {
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

    await UserSessionService.authenticateUserByRequest(request, "ADMIN");

    const { userId } = await params

    const user = await UserService.getById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "USER_NOT_FOUND" },
        { status: 404 }
      );
    }

    await UserService.delete(userId);

    return NextResponse.json(
      { message: "USER_DELETED" },
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

    await UserSessionService.authenticateUserByRequest(request, "ADMIN");
    const { userId } = await params
    const user = await UserService.getById(userId);

    if (!user) {
      return NextResponse.json(
        { message: "USER_NOT_FOUND" },
        { status: 404 }
      );
    } 

    // TODO: add update user logic
    
    return NextResponse.json({ user });

  }
  catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}