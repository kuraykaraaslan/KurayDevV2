// Original path: app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import RateLimiter from "@/libs/rateLimit";

import AuthService from "@/services/AuthService";
import { RegisterRequest } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.checkRateLimit(request);


        const parsedData = RegisterRequest.safeParse(await request.json());

        if (!parsedData.success) {
            return NextResponse.json({
                error: parsedData.error.errors.map(err => err.message).join(", ")
            }, { status: 400 });
        }

        const { name, email, password, phone } = parsedData.data;
        
        const user = await AuthService.register({
            name,
            email,
            password,
            phone,
        });

        if (!user) {
            return NextResponse.json({ error: "Something went wrong." }, { status: 400 });
        }

        return NextResponse.json({ message: "User registered successfully." }, { status: 201 });
    }

    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
