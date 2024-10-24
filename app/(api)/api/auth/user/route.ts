import ServerAuthService from "@/services/server/ServerAuthService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, res: NextResponse) {
    try {
        await ServerAuthService.authenticate(req);
        return NextResponse.json({ user: req.user });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Authentication failed" }, { status: 401 });
    }
}