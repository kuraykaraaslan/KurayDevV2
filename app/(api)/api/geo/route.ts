import { NextRequest, NextResponse } from 'next/server'
import UserAgentService from '@/services/UserAgentService'

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      request.headers.get('x-real-ip') ||
      '127.0.0.1'

    const geo = await UserAgentService.getGeoLocationFromMaxMind(ip)
    const countryCode = geo.countryCode ?? null

    return NextResponse.json({ countryCode })
  } catch {
    return NextResponse.json({ countryCode: null })
  }
}
