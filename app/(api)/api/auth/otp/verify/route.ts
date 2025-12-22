import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import OTPService from "@/services/AuthService/OTPService";
import { OTPMethodEnum, OTPActionEnum } from "@/types/UserSecurityTypes";
import AuthMessages from "@/messages/AuthMessages";
import AuthService from "@/services/AuthService";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER" });

    const { method, action, otpToken } = await request.json();

    // Validate method
    if (!Object.values(OTPMethodEnum.Enum).includes(method)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    if (!Object.values(OTPActionEnum.Enum).includes(action)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_ACTION },
        { status: 400 }
      );
    }

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);
 
    const userOTPMethods = userSecurity.otpMethods;

    await OTPService.verifyOTP({ user, userSession, method, action, otpToken });
    // Update user security settings based on action
    
    if (action === OTPActionEnum.Enum.enable && !userOTPMethods.includes(method)) {
      
        const updatedMethods = [...userOTPMethods, method];
        await AuthService.updateUserSecurity(user.userId, { otpMethods: updatedMethods });
    }

    if (action === OTPActionEnum.Enum.disable && userOTPMethods.includes(method)) {
      
        const updatedMethods = userOTPMethods.filter(m => m !== method);
        await AuthService.updateUserSecurity(user.userId, { otpMethods: updatedMethods });
    }

    return NextResponse.json({ success: true, message: "OTP verified successfully" }, { status: 200 });


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

