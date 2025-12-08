import { NextRequest, NextResponse } from "next/server";
import GeoAnalyticsService from "@/services/GeoAnalyticsService";
import DBGeoService from "@/services/DBGeoService";

export async function GET(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  await GeoAnalyticsService.process(ip);
  const data = await DBGeoService.getAll();
  return NextResponse.json(data);
}
