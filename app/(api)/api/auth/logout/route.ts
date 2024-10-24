import ServerAuthService from "@/services/server/ServerAuthService";

import { Session } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";


export async function POST(req: NextRequest, res: NextResponse<Session>) {
    
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
        return NextResponse.json({ message: "MISSING_FIELDS" }, { status: 400 });
    }

}

