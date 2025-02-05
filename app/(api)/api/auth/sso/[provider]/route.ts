// Original path: app/api/auth/callback/route.ts

import NextRequest  from "@/types/NextRequest";
import SessionWithUser from "@/types/SessionWithUser";
import { NextResponse } from "next/server";
import AuthService from "@/services/AuthService";
import SSOService from "@/services/SSOService";

export async function GET(req: NextRequest,
  { params }: { params: { provider: string } }) {

  try {

    const provider = params.provider;

    const url = await SSOService.generateAuthUrl(provider);

    return NextResponse.json({ url });

  } catch (error: any) {

    return NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=' + error.message);

  }
}




