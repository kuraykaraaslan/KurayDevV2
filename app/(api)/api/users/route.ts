"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import UserService from "@/services/UserService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest) {

    try {

        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = parseInt(searchParams.get('page') || '1', 10);
        const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
        const search = searchParams.get('search') || undefined;

        const {users, total} = await UserService.getAllUsers({ page, pageSize, search });

        return NextResponse.json({ users, total, page, pageSize });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}

/**
 * POST handler for creating a new user.
 * @param request - The incoming request object
 * @returns A NextResponse containing the new user data or an error message
 */
export async function POST(request: NextRequest) {
    try {

        AuthService.authenticateSync(request, "ADMIN");

        const body = await request.json();

        const { email, password, role, userSlug , image, name } = body;

        const user = await UserService.createUser(email, password, role, userSlug, image, name);

        return NextResponse.json({ user });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
