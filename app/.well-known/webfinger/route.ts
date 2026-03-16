import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

/**
 * GET /.well-known/webfinger?resource=acct:kuray@kuray.dev
 * WebFinger discovery endpoint (RFC 7033).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const resource = searchParams.get('resource')

  if (!resource) {
    return NextResponse.json({ error: 'Missing resource parameter' }, { status: 400 })
  }

  try {
    const data = ActivityPubService.getWebFingerData(resource)

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/jrd+json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: unknown) {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: statusCode })
  }
}
