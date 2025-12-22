import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthMessages from "@/messages/AuthMessages";
import { TOTPEnableRequestSchema } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const body = await request.json();
    
    const parsedData = TOTPEnableRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json({
        success: false,
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const { otpToken } = parsedData.data;

    const result = await TOTPService.verifyAndEnable({ user, userSession, otpToken });

    return NextResponse.json({ success: true, message: "TOTP enabled successfully", backupCodes: result.backupCodes });
  } catch (err: any) {
    console.error("TOTP Enable Error:", err);
    return NextResponse.json({ success: false, message: err.message || "TOTP could not be enabled" }, { status: 400 });
  }
}
