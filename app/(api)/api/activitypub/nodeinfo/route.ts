import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

/**
 * GET /api/activitypub/nodeinfo
 * Full NodeInfo 2.1 document. Describes this server to other Fediverse software.
 */
export async function GET() {
  try {
    const data = await ActivityPubService.getNodeInfoData()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; profile="http://nodeinfo.diaspora.software/ns/schema/2.1#"; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
