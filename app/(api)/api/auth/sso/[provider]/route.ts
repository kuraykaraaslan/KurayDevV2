// Original path: app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import SSOService from "@/services/AuthService/SSOService";
import RateLimiter from "@/libs/rateLimit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;

  try {
    await RateLimiter.useRateLimit(request);

    const url = await SSOService.generateAuthUrl(provider);

    return NextResponse.json({ url });
  } catch (error: any) {
    console.error(`Error generating SSO link for ${provider}:`, error);
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




