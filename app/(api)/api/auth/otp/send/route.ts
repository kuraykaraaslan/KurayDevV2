import {  NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import UserSessionOTPService from "@/services/AuthService/UserSessionOTPService";
import { OTPMethodEnum, OTPActionEnum } from "@/types/OTPTypes";
import AuthMessages from "@/messages/AuthMessages";
import { OTPMethod } from "@prisma/client";

export async function POST(request: NextRequest) {

  try {
    // 1) Kullanıcı doğrula
    const { user, userSession } = await UserSessionService.authenticateUserByRequest(request, "USER");
    const { method, action } = await request.json();

    if (!method || !Object.values(OTPMethodEnum.Enum).includes(method)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_METHOD },
        { status: 400 }
      );
    }

    if (!action || !Object.values(OTPActionEnum.Enum).includes(action)) {
      return NextResponse.json(
        { message: AuthMessages.INVALID_OTP_ACTION },
        { status: 400 }
      );
    }
    // 7) OTP gönder (mail/sms)
    await UserSessionOTPService.sendOTP({
      user,
      userSession,
      method,
      action
    });

    return NextResponse.json({ success: true, message: "OTP sent" });

  } catch (err: any) {
    console.error("OTP ENABLE ERROR:", err);

    return NextResponse.json(
      {
        success: false,
        message: err.message || "OTP could not be sent",
      },
      { status: 400 }
    );
  }
}
  
