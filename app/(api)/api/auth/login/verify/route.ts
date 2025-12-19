import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import OTPService from "@/services/AuthService/OTPService";
import TOTPService from "@/services/AuthService/TOTPService";
import { OTPMethodEnum, OTPActionEnum } from "@/types/UserSecurityTypes";
import AuthMessages from "@/messages/AuthMessages";
import AuthService from "@/services/AuthService";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER", otpVerifyBypass: true });

    const { method, action, otpToken } = await request.json();

    // Validate method
    if (!Object.values(OTPMethodEnum.Enum).includes(method)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

 if (!Object.values(OTPActionEnum.Enum).includes(action) && action === OTPActionEnum.Enum.authenticate) {
      console.log("Invalid OTP action:", action);
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_ACTION },
        { status: 400 }
      );
    } 

      if (method === OTPMethodEnum.Enum.TOTP_APP) {
        await TOTPService.verifyAuthenticateOrBackup({ user, otpToken });
    } 
    
    else if (method === OTPMethodEnum.Enum.EMAIL) {
      await OTPService.verifyOTP({ user, userSession, method, action, otpToken });
    }

    else if (method === OTPMethodEnum.Enum.SMS) {
      await OTPService.verifyOTP({ user, userSession, method, action, otpToken });
    }
    
    else {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    await UserSessionService.updateSession(userSession.userSessionId, { otpVerifyNeeded: false });

    return NextResponse.json({ success: true, message: "OTP verified successfully" });

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

