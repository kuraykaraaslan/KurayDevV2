// Original path: app/api/auth/callback/route.ts

import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import SSOService from "@/services/SSOService";
import MailService from "@/services/NotificationService/MailService";

export async function GET(request: NextRequest,
    { params }: { params: { provider: string } }) {

    try {
        const { provider } = params;

        const searchParams = request.nextUrl.searchParams;

        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
            //redirect to frontend
            NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
        }

        const user = await SSOService.authCallback(provider, code as string, state as string);

        if (!user) {
            //redirect to frontend

        }

        const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request);

        await MailService.sendWelcomeEmail(user);

        if (!userSession) {
            //redirect to frontend
            return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
        }

        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`);

    } catch (error: any) {

        return NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=' + error.message);


    }
}



// POST VERSION OF THE SAME FUNCTION ABOVE
export async function POST(request: NextRequest,
    { params }: { params: { provider: string } }) {

    try {
        const { provider } = params;

        const { code, state } = await request.json();

        if (!code) {
            //redirect to frontend
            NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=Missing code');
        }

        const user = await SSOService.authCallback(provider, code as string, state as string);

        if (!user) {
            //redirect to frontend

        }

        const { userSession, rawAccessToken, rawRefreshToken } = await UserSessionService.createSession(user, request);

        await MailService.sendWelcomeEmail(user);

        if (!userSession) {
            //redirect to frontend
            return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/login?error=Failed to create session`);
        }

        //redirect to frontend
        return NextResponse.redirect(`${process.env.APPLICATION_HOST}/auth/callback?rawAccessToken=${rawAccessToken}&rawRefreshToken=${rawRefreshToken}`);

    } catch (error: any) {

        return NextResponse.redirect(process.env.APPLICATION_HOST + '/auth/login?error=' + error.message);


    }
}


