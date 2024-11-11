// Original path: app/api/auth/login/route.ts

import { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";


export async function POST(req: NextRequest) {
    try {

        const { email, password } = await req.json();
        const { session }  = await AuthService.login(email, password);

        return NextResponse.json({ session }, { status: 200 });
    }
    catch (error: any) {
        console.error(error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
