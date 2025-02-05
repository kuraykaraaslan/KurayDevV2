// path: app/api/auth/me/route.ts
import NextRequest from "@/types/NextRequest";
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";

export async function GET(req: NextRequest) {

    try {
        await AuthService.authenticate(req, 'USER');
        const session = req.session;

        return NextResponse.json({ session });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status });
    }



}