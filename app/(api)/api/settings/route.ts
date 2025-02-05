"use server";

import { NextResponse } from "next/server";
import NextRequest from "@/types/NextRequest";
import SettingService from "@/services/SettingService";
import AuthService from "@/services/AuthService";

/**
 * GET handler for retrieving all settings.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(request: NextRequest) {
    try {

        AuthService.authenticateSync(request, "ADMIN");
        
        const result = await SettingService.getSettings();

        return NextResponse.json({ settings: result });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}


/**
 * POST handler for updating settings.
 * @param request - The incoming request object
 * @returns A NextResponse containing the updated settings or an error message
 */
export async function POST(request: NextRequest) {
    try {

        AuthService.authenticateSync(request, "ADMIN");
        
        const { settings } = await request.json();
        const result = await SettingService.updateSettings(settings);

        return NextResponse.json({ settings: result });

    }
    catch (error: any) {
        return NextResponse.json(
            { message: error.message },
            { status: 500 }
        );
    }
}