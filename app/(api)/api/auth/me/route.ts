// path: app/api/auth/me/route.ts
import { NextResponse  } from "next/server";
import NextRequest from "@/types/NextRequest";
import AuthService from "@/services/AuthService";



export async function GET(req: NextRequest) {

    //await AuthService.authenticate(req);

    AuthService.authenticate(req);

    return NextResponse.json({ user: req.session });

}