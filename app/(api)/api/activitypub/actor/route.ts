import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

const AP_CONTENT_TYPE = 'application/activity+json; charset=utf-8'

/**
 * GET /api/activitypub/actor
 * Returns the ActivityPub Actor JSON-LD object for the blog account.
 */
export async function GET() {
  try {
    const actor = ActivityPubService.getActorJson()

    return NextResponse.json(actor, {
      status: 200,
      headers: {
        'Content-Type': AP_CONTENT_TYPE,
        'Cache-Control': 'public, max-age=3600',
      },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
