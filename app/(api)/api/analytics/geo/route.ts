import { NextResponse } from 'next/server'
import GeoAnalyticsService from '@/services/GeoAnalyticsService'
import DBGeoService from '@/services/DBGeoService'
import GEOAnalyticsMessages from '@/messages/GEOAnalyticsMessages'

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    // Track the visitor (deduped by device fingerprint via Redis).
    // Failures (e.g. MaxMind 403) are non-fatal; data fetch continues regardless.
    await GeoAnalyticsService.process(ip).catch(() => undefined)

    // Serve from Redis cache (5-minute TTL); falls back to DB on cache miss
    const data = await DBGeoService.getAll()

    return NextResponse.json({
      message: GEOAnalyticsMessages.GEO_ANALYTICS_RETRIEVED,
      data,
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
