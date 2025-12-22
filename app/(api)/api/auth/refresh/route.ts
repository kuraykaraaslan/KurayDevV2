import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import AuthMessages from "@/messages/AuthMessages";
import { RefreshTokenRequestSchema } from "@/dtos/AuthDTO";

export async function POST(request: NextRequest) {

  const refreshToken = request.cookies.get("refreshToken")?.value;

  console.log("Refresh token request received.");

  if (!refreshToken) {
    return NextResponse.json({ message: AuthMessages.INVALID_TOKEN }, { status: 401 });
  }
  
  const parsedData = RefreshTokenRequestSchema.safeParse({ refreshToken });
  
  if (!parsedData.success) {
    return NextResponse.json({
      message: parsedData.error.errors.map(err => err.message).join(", ")
    }, { status: 400 });
  }

  try {
    const { rawAccessToken, rawRefreshToken } = await UserSessionService.rotateTokens(refreshToken);

    const response = NextResponse.json({ message: AuthMessages.TOKENS_REFRESHED_SUCCESSFULLY });

    response.cookies.set("accessToken", rawAccessToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    response.cookies.set("refreshToken", rawRefreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    });

    return response;

  } catch (e: any) {
    return NextResponse.json({ message: e.message || AuthMessages.INVALID_TOKEN }, { status: 500 });
  }
}