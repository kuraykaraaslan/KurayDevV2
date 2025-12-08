import { NextRequest, NextResponse } from "next/server";
import GeoAnalyticsService from "@/services/GeoAnalyticsService";
import DBGeoService from "@/services/DBGeoService";

export async function POST(request: NextRequest) {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0] ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  const result = await GeoAnalyticsService.process(ip);
  return NextResponse.json(result);
}

export async function GET() {
  const data = await DBGeoService.getAll();
  return NextResponse.json(data);
}
