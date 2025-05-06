// Original path: app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import SSOService from "@/services/SSOService";
import RateLimiter from "@/libs/rateLimit";

export async function GET(request: NextRequest,
  { params }: { params: { provider: string } }) {

  try {
    await RateLimiter.useRateLimit(request);

    const provider = params.provider;
    const url = await SSOService.generateAuthUrl(provider);

    return NextResponse.json({ url });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message },
      { status: 500 }
    );
  }
}




