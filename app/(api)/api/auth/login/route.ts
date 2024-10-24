import ServerAuthService from "@/services/server/ServerAuthService";

import { Session } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";



export async function POST(req: NextRequest, res: NextResponse<Session>) {
    
    const { email, password } = await req.json();

    if (!email || !password) {
        return NextResponse.json({ message: "Please fill in the required fields." }, { status: 400 });
    }

    try {
        const session = await ServerAuthService.login(email, password);
        return NextResponse.json(session);
    }

    catch (error: any) {
        console.error(error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }

}

//handler
export default function handler(req: NextRequest, res: NextResponse<any>) {
    if (req.method === "POST") {
        console.log("POST");
        return POST(req, res);
    }
    return NextResponse.json({ message: "Method not allowed" }, { status: 405 });
}

