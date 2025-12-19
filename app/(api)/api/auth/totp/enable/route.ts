import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {
  try {
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const { otpToken } = await request.json();
    if (!otpToken) {
      return NextResponse.json({ success: false, message: AuthMessages.INVALID_OTP }, { status: 400 });
    }

    await TOTPService.verifyAndEnable({ user, userSession, otpToken });

    return NextResponse.json({ success: true, message: "TOTP enabled successfully" });
  } catch (err: any) {
    console.error("TOTP Enable Error:", err);
    return NextResponse.json({ success: false, message: err.message || "TOTP could not be enabled" }, { status: 400 });
  }
}
