// path: app/api/auth/me/route.ts
import { NextResponse  } from "next/server";
import NextRequest from "@/types/NextRequest";
import AuthService from "@/services/AuthService";

export async function GET(req: NextRequest) {

    const user = req.session?.user;

    return NextResponse.json({ user });

}