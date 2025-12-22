

import { NextResponse } from "next/server";
import SettingService from "@/services/SettingService";
import UserSessionService from "@/services/AuthService/UserSessionService";
import { UpdateSettingsRequestSchema } from "@/dtos/SettingsDTO";
/**
 * GET handler for retrieving all settings.
 * @param request - The incoming request object
 * @returns A NextResponse containing the posts data or an error message
 */
export async function GET(_request: NextRequest) {
    try {

        const settings = await SettingService.getSettings();

        return NextResponse.json({ success: true, settings });

    }
    catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
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

        await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "ADMIN" });
        
        const body = await request.json();
        
        const parsedData = UpdateSettingsRequestSchema.safeParse(body);
        
        if (!parsedData.success) {
          return NextResponse.json({
            success: false,
            message: parsedData.error.errors.map(err => err.message).join(", ")
          }, { status: 400 });
        }
        
        const { settings } = parsedData.data;
        const result = await SettingService.updateSettings(settings);

        return NextResponse.json({ success: true, settings: result });

    }
    catch (error: any) {
        return NextResponse.json(
            { success: false, message: error.message },
            { status: 500 }
        );
    }
}