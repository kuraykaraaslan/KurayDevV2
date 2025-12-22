import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import OTPService from "@/services/AuthService/OTPService";
import AuthMessages from "@/messages/AuthMessages";
import AuthService from "@/services/AuthService";
import MailService from "@/services/NotificationService/MailService";
import SMSService from "@/services/NotificationService/SMSService";
import { OTPSendRequestSchema } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {
  try {
    // Authenticate the user
    const { user, userSession } = await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: "USER", otpVerifyBypass: true });

    const body = await request.json();

    // Validate request with schema
    const parsedData = OTPSendRequestSchema.safeParse(body);

    if (!parsedData.success) {
      return NextResponse.json(
        { success: false, message: parsedData.error.errors.map(err => err.message).join(", ") },
        { status: 400 }
      );
    }

    const { method, action } = parsedData.data;

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);

    // check if method is enabled
    if (!userSecurity.otpMethods.includes(method)) {
      console.log("OTP method not enabled:", method);
      return NextResponse.json(
        { success: false, message: AuthMessages.OTP_METHOD_NOT_ENABLED },
        { status: 400 }
      );
    }

    if (method === 'TOTP_APP') {
      console.log("TOTP method selected; no send needed.");
      return NextResponse.json({ 
        success: true, 
        message: AuthMessages.USE_AUTHENTICATOR_APP 
      });
    }

    else if (method === 'EMAIL') {
      const { otpToken } = await OTPService.requestOTP({ user, userSession, method, action });
      await MailService.sendOTPEmail({
        email: user.email,
        name: user.userProfile?.name,
        otpToken,
      });
    } 
   
    else if (method === 'SMS') {
      const { otpToken } = await OTPService.requestOTP({ user, userSession, method, action });
      await SMSService.sendShortMessage({
        to: user.phone!,
        body: "Your OTP code for " + action + " " + method + " is: " + otpToken
      });
    }
    
    else {
      return NextResponse.json(
        { success: false, message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: AuthMessages.OTP_SENT_SUCCESSFULLY 
    });


  } catch (err: any) {
    console.error("Send OTP Error:", err);
    return NextResponse.json(
      {
        success: false,
        message: err.message || AuthMessages.OTP_SEND_FAILED,
      },
      { status: 500 }
    );
  }
}

