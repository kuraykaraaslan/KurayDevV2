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
    // @ts-ignore
    const state = searchParams.get('state');

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
    }

    const { user, newUser } = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to authenticate user`);

    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request as any);

    if (newUser) {
        await MailService.sendWelcomeEmail(user);
    } else {
        await MailService.sendNewLoginEmail(user, userSession);
    }

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
    }

    const response = NextResponse.redirect(
        `${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`
    )

    // Determine if we're in a secure context (HTTPS)
    const protocol = request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http';
    const isSecure = protocol === 'https';
    
    response.cookies.set('accessToken', rawAccessToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });
    
    response.cookies.set('refreshToken', rawRefreshToken, {
        httpOnly: true,
        secure: isSecure,
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;

}



// @ts-ignore
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    // @ts-ignore
    const { code, state } = await request.json();

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
    }

    const { user, newUser } = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend

    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request as any);

    if (newUser) {
        await MailService.sendWelcomeEmail(user);
    } else {
        await MailService.sendNewLoginEmail(user, userSession);
    }

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
    }

    //redirect to frontend
    return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`);

}


