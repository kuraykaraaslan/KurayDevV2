import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import OTPService from "@/services/AuthService/OTPService";
import { OTPMethodEnum, OTPActionEnum } from "@/types/UserSecurityTypes";
import AuthMessages from "@/messages/AuthMessages";
import AuthService from "@/services/AuthService";
import MailService from "@/services/NotificationService/MailService";
import SMSService from "@/services/NotificationService/SMSService";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER", otpVerifyBypass: true });

    const { method, action } = await request.json();

    // Validate method = authentication method
    if (!Object.values(OTPMethodEnum.Enum).includes(method)) {
      console.log("Invalid OTP method:", method);
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

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);

    // check if method is enabled
    if (!userSecurity.otpMethods.includes(method)) {
      console.log("OTP method not enabled:", method);
      return NextResponse.json(
        { message: "OTP method is not enabled" },
        { status: 400 }
      );
    }

    if (method === OTPMethodEnum.Enum.TOTP_APP) {
      console.log("TOTP method selected; no send needed.");
      return NextResponse.json({ success: true, message: "Use your authenticator app to generate the code" });
    }

    else if (method === OTPMethodEnum.Enum.EMAIL) {
      const { otpToken } = await OTPService.requestOTP({ user, userSession, method, action });
      await MailService.sendOTPEmail({
        email: user.email,
        name: user.userProfile?.name,
        otpToken,
      });
    } 
   
    else if (method === OTPMethodEnum.Enum.SMS) {
      const { otpToken } = await OTPService.requestOTP({ user, userSession, method, action });
      await SMSService.sendShortMessage({
        to: user.phone!,
        body: "Your OTP code for " + action + " " + method + " is: " + otpToken
      });
    }
    
    else {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP sent successfully" });


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

