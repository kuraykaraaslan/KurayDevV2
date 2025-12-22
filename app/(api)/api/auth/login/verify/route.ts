import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import OTPService from "@/services/AuthService/OTPService";
import TOTPService from "@/services/AuthService/TOTPService";
import AuthMessages from "@/messages/AuthMessages";
import { LoginVerifyRequestSchema } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER", otpVerifyBypass: true });

    const body = await request.json();
    
    const parsedData = LoginVerifyRequestSchema.safeParse(body);
    
    if (!parsedData.success) {
      return NextResponse.json({
        message: parsedData.error.errors.map(err => err.message).join(", ")
      }, { status: 400 });
    }

    const { method, otpToken, action } = parsedData.data;

    if (action !== "authenticate") {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_ACTION },
        { status: 400 }
      );
    }

    if (method === "TOTP_APP") {
      const isTOTPValid = await TOTPService.verifyAuthenticate({ user: user, otpToken });

      if (!isTOTPValid) {
        return NextResponse.json(
          { message: AuthMessages.INVALID_TOKEN },
          { status: 400 }
        );
      }
    }
    else { await OTPService.verifyOTP({ user, userSession, method, otpToken, action });
    }

    await UserSessionService.updateSession(userSession.userSessionId, { otpVerifyNeeded: false });

    return NextResponse.json({ success: true, message: AuthMessages.OTP_VERIFIED_SUCCESSFULLY });

  } catch (err: any) {
    console.error("Send OTP Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || "OTP could not be sent",
      },
      { status: 400 }
    );
  }
}

