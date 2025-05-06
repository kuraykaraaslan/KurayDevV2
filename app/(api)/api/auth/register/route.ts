// Original path: app/api/auth/register/route.ts

import { NextResponse } from "next/server";
import RateLimiter from "@/libs/rateLimit";

import AuthService from "@/services/AuthService";

export async function POST(request: NextRequest) {
    try {

        await RateLimiter.useRateLimit(request);

        const { name, email, password, phone } = await request.json();

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
