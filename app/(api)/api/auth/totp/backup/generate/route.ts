import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const { count } = await request.json().catch(() => ({ count: 10 }));
    const n = typeof count === 'number' && count > 0 && count <= 20 ? count : 10;

    const { codes } = await TOTPService.generateBackupCodes({ user, count: n });

    // Return plaintext codes for user to store securely
    return NextResponse.json({ success: true, codes });
  } catch (err: any) {
    console.error("Backup Codes Generate Error:", err);
    return NextResponse.json(
      { success: false, message: err.message || AuthMessages.INVALID_OTP_METHOD },
      { status: 400 }
    );
  }
}
