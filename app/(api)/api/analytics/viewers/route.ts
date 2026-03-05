import { NextResponse } from 'next/server'
import ViewerService from '@/services/ViewerService'
import { ViewerHeartbeatSchema } from '@/dtos/ViewerDTO'

/** GET /api/analytics/viewers?slug=... — returns current viewer count without registering */
export async function GET(request: NextRequest) {
  const slug = request.nextUrl.searchParams.get('slug')
  if (!slug) {
    return NextResponse.json({ error: 'slug is required' }, { status: 400 })
  }

  const count = await ViewerService.getCount(slug)
  return NextResponse.json({ count })
}

/** POST /api/analytics/viewers — heartbeat: register/refresh viewer, returns updated count */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = ViewerHeartbeatSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const { slug, token } = parsed.data
  const count = await ViewerService.heartbeat(slug, token)
  return NextResponse.json({ count })
}
