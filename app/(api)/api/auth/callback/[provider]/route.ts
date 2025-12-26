// Original path: app/api/auth/callback/route.ts

import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import SSOService from "@/services/AuthService/SSOService";
import MailService from "@/services/NotificationService/MailService";
import { SSOMessages } from "@/messages/SSOMessages";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    const searchParams = request.nextUrl.searchParams;

    const code = searchParams.get('code');
    //const state = searchParams.get('state');

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.CODE_NOT_FOUND}`);
    }

    const { user, userSecurity, newUser } = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.AUTHENTICATION_FAILED}`);

    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession({ user, userSecurity, request });

    if (newUser) {
        await MailService.sendWelcomeEmail(user);
    } else {
        await MailService.sendNewLoginEmail(user, userSession);
    }

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.AUTHENTICATION_FAILED}`);
    }

    const response = NextResponse.redirect(
        `${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`
    )

    // Determine if we're in a secure context (HTTPS)
    const origin = request.headers.get('origin') || '';
    const protocol = request.headers.get('x-forwarded-proto') || request.headers.get('x-scheme') || 'http';
    const isSecure = origin.startsWith('https://') || protocol === 'https';
    
    const cookieOptions = isSecure ? {
        httpOnly: true,
        secure: true,
        sameSite: 'none' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    } : {
        httpOnly: true,
        sameSite: 'lax' as const,
        path: '/',
        maxAge: 60 * 60 * 24 * 7,
    };
    
    response.cookies.set('accessToken', rawAccessToken, cookieOptions);
    response.cookies.set('refreshToken', rawRefreshToken, cookieOptions);

    return response;

}


export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ provider: string }> }
) {
    const { provider } = await params;

    const { code } = await request.json();

    if (!code) {
        //redirect to frontend
        NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.CODE_NOT_FOUND}`);
    }

    const { user, userSecurity, newUser } = await SSOService.authCallback(provider, code as string);

    if (!user) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.AUTHENTICATION_FAILED}`);
    }

    const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession({ user, userSecurity, request });

    if (newUser) {
        await MailService.sendWelcomeEmail(user);
    } else {
        await MailService.sendNewLoginEmail(user, userSession);
    }

    if (!userSession) {
        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=${SSOMessages.AUTHENTICATION_FAILED}`);
    }

    //redirect to frontend
    return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`);

}


