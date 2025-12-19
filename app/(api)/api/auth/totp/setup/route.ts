import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthService from "@/services/AuthService";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
    if (userSecurity.otpMethods.includes("TOTP_APP" as any)) {
      return NextResponse.json({ success: false, message: "TOTP already enabled" }, { status: 400 });
    }

    const { secret, otpauthUrl } = await TOTPService.requestSetup({ user, userSession });

    return NextResponse.json({ success: true, secret, otpauthUrl });
  } catch (err: any) {
    console.error("TOTP Setup Error:", err);
    return NextResponse.json({ success: false, message: err.message || AuthMessages.INVALID_OTP }, { status: 400 });
  }
}
