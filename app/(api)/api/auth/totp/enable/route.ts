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
        
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const { otpToken } = parsedData.data;

    const result = await TOTPService.verifyAndEnable({ user, userSession, otpToken });

    return NextResponse.json({  message: AuthMessages.TOTP_ENABLED_SUCCESSFULLY, backupCodes: result.backupCodes });
  } catch (err: any) {
    return NextResponse.json({ message: err.message || AuthMessages.TOTP_ENABLE_FAILED }, { status: 500 });
  }
}
