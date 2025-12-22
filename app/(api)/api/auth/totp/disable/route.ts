import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthMessages from "@/messages/AuthMessages";
import { TOTPDisableRequestSchema } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
  try {
    const { user } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const body = await request.json();
    
    const parsedData = TOTPDisableRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json({
        
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const { otpToken } = parsedData.data;

    await TOTPService.disable({ user, otpToken });

    return NextResponse.json({  message: AuthMessages.TOTP_DISABLED_SUCCESSFULLY });
  } catch (err: any) {
    console.error("TOTP Disable Error:", err);
    return NextResponse.json({ message: err.message || AuthMessages.TOTP_DISABLE_FAILED }, { status: 500 });
  }
}
