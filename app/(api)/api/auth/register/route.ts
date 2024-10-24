import ServerAuthService from "@/services/server/ServerAuthService";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest, res: NextResponse) {

    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ message: "MISSING_FIELDS" }, { status: 400 });
    }

    try {
        const status = await ServerAuthService.register(email, password);
        return NextResponse.json({ message: "USER_REGISTERED" });
    }

    catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

}

