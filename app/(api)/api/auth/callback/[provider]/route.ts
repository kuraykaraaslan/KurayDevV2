// Original path: app/api/auth/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import SSOService from "@/services/AuthService/SSOService";
import MailService from "@/services/NotificationService/MailService";

// @ts-ignore
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
    }

    const user = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to authenticate user`);

    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request as any);

    await MailService.sendWelcomeEmail(user);

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
    }

    const response = NextResponse.redirect(
        `${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`
    )

    response.headers.set(
        'Set-Cookie',
        [
            `accessToken=${rawAccessToken}; Path=/; HttpOnly; SameSite=Strict; Secure`,
            `refreshToken=${rawRefreshToken}; Path=/; HttpOnly; SameSite=Strict; Secure`
        ].join(', ')
    )

    return response;

}



// @ts-ignore
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    const { code, state } = await request.json();

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
    }

    const user = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend

    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request as any);

    await MailService.sendWelcomeEmail(user);

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
    }

    //redirect to frontend
    return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`);

}


