import { NextResponse } from "next/server";
import UserSessionService from "@/services/AuthService/UserSessionService";
import AuthMessages from "@/messages/AuthMessages";

export async function POST(request: NextRequest) {

  const refreshToken = request.cookies.get("refreshToken")?.value;

  console.log("Refresh token request received.");

  if (!refreshToken) {
    return NextResponse.json({ message: AuthMessages.INVALID_TOKEN }, { status: 401 });
  }

  try {
    const { rawAccessToken, rawRefreshToken } = await UserSessionService.rotateTokens(refreshToken);

    const response = NextResponse.json({ ok: true });

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
    return NextResponse.json({ message: e.message }, { status: 401 });
  }
}