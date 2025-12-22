import { NextRequest, NextResponse } from "next/server";
import GeoAnalyticsService from "@/services/GeoAnalyticsService";
import DBGeoService from "@/services/DBGeoService";
import { GetGeoAnalyticsRequestSchema } from "@/dtos/AnalyticsDTO";
import GEOAnalyticsMessages from "@/messages/GEOAnalyticsMessages";

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    await GeoAnalyticsService.process(ip);
    const data = await DBGeoService.getAll();
    
    GetGeoAnalyticsRequestSchema.safeParse({});
    
    return NextResponse.json({
      message: GEOAnalyticsMessages.GEO_ANALYTICS_RETRIEVED,
      data: data
    });
    
  } catch (error: any) {
    return NextResponse.json({
      message: error.message
    }, { status: 500 });
  }
}
