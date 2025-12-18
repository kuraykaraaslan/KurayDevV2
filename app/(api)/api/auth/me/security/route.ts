import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import AuthService from "@/services/AuthService";

export async function GET(request: NextRequest) {
  try {
    // Authenticate the user
    const { user } = await UserSessionService.authenticateUserByRequest(request, "USER");

    const { userSecurity } = await AuthService.getUserSecurity(user.userId);

    console.log("User Security:", userSecurity);

    return NextResponse.json({ userSecurity });

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
