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
    const { user } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const { method, action } = await request.json();

    // Validate method
    if (!Object.values(OTPMethodEnum.Enum).includes(method)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    if (!Object.values(OTPActionEnum.Enum).includes(action)) {
      console.log("Invalid OTP action:", action);
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_ACTION },
        { status: 400 }
      );
    }

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
 

    const { otpToken } = await OTPService.requestOTP({ user, method, action });

    const userOTPMethods = userSecurity.otpMethods;

    if (action === OTPActionEnum.Enum.enable && userOTPMethods.includes(method)) {
      console.log("OTP method already enabled:", method);
      return NextResponse.json(
        { message: "OTP method is already enabled" },
        { status: 400 }
      );
    }

    if (action === OTPActionEnum.Enum.disable && !userOTPMethods.includes(method)) {
      console.log("OTP method not enabled:", method);
      return NextResponse.json(
        { message: "OTP method is not enabled" },
        { status: 400 }
      );
    }

    if (method === OTPMethodEnum.Enum.EMAIL) {
      console.log("Sending OTP via Email to:", user.email);
      await MailService.sendOTPEmail({
        email: user.email,
        name: user.userProfile?.name,
        otpToken,
      });
    } else if (method === OTPMethodEnum.Enum.SMS) {
      console.log("Sending OTP via SMS to:", user.phone);
      await SMSService.sendShortMessage({
        to: user.phone!,
        body: "Your OTP code for " + action + " " + method + " is: " + otpToken
      });
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

