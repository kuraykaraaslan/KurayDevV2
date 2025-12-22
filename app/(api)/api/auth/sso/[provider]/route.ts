// Original path: app/api/auth/callback/route.ts
import { NextResponse } from "next/server";
import SSOService from "@/services/AuthService/SSOService";
import RateLimiter from "@/libs/rateLimit";
import { SSOProviderRequestSchema } from "@/dtos/AuthDTO";
import AuthMessages from "@/messages/AuthMessages";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> }
) {
  const { provider } = await params;
  
  const parsedData = SSOProviderRequestSchema.safeParse({ provider });
  
  if (!parsedData.success) {
    return NextResponse.json({
      message: parsedData.error.errors.map(err => err.message).join(", ")
    }, { status: 400 });
  }

  try {
    await RateLimiter.checkRateLimit(request);

    const url = await SSOService.generateAuthUrl(provider);

    return NextResponse.json({ url });

  } catch (error: any) {

    console.error(`Error generating SSO link for ${provider}:`, error);
    
    return NextResponse.json(
      { message: AuthMessages.SSO_GENERATION_FAILED },
      { status: 500 }
    );
  }
}




