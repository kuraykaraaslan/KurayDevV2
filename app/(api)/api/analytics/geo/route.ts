import { NextRequest, NextResponse } from "next/server";
import GeoAnalyticsService from "@/services/GeoAnalyticsService";
import DBGeoService from "@/services/DBGeoService";
import { GetGeoAnalyticsRequestSchema } from "@/dtos/AnalyticsDTO";

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "127.0.0.1";

    await GeoAnalyticsService.process(ip);
    const data = await DBGeoService.getAll();
    
    const parsedResponse = GetGeoAnalyticsRequestSchema.safeParse({});
    
    return NextResponse.json({
      success: true,
      message: 'Geo analytics retrieved successfully',
      data: data
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      message: error.message
    }, { status: 500 });
  }
}
