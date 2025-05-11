"use server";

import { NextResponse } from "next/server";
   
import UserService from "@/services/UserService";
import UserSessionService from "@/services/AuthService/UserSessionService";

/**
 * GET handler for retrieving all users.
 * @param request - The incoming request object
 * @returns A NextResponse containing the user data or an error message
 */
export async function GET(request: NextRequest) {

    try {

        await UserSessionService.authenticateUserByRequest(request, "ADMIN");


        const { searchParams } = new URL(request.url);

        // Extract query parameters
        const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '1', 10) : 1;
        const pageSize = searchParams.get('pageSize') ? parseInt(searchParams.get('pageSize') || '10', 10) : 10;
        const search = searchParams.get('search') || undefined;


        const {users, total} = await UserService.getAll({
            page,
            pageSize,
            search
        });

        console.log(request.user)
        

        
        if (request.user.userRole !== "ADMIN") {
            //omit user data only id and name
            users.forEach((user: any) => {
                delete user.email;
                delete user.password;
                delete user.role;
                delete user.image;
                delete user.phone;
            });
        }

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

        await UserSessionService.authenticateUserByRequest(request, "ADMIN");

        const { email, password, name , phone, userRole } = await request.json();

        const user = await UserService.create({
            email,
            password,
            name,
            phone,
            userRole
        });

        return NextResponse.json({ user });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}
