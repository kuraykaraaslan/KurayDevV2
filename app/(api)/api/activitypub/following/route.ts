import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

const AP_CONTENT_TYPE = 'application/activity+json; charset=utf-8'

/**
 * GET /api/activitypub/following
 * Returns the OrderedCollection of actors our blog account follows.
 * A personal blog doesn't follow other accounts, so this is always empty.
 */
export async function GET() {
  const followingUrl = `${ActivityPubService.getActorUrl().replace('/actor', '/following')}`

  return NextResponse.json(
    {
      '@context': 'https://www.w3.org/ns/activitystreams',
      id: followingUrl,
      type: 'OrderedCollection',
      totalItems: 0,
      orderedItems: [],
    },
    { status: 200, headers: { 'Content-Type': AP_CONTENT_TYPE } }
  )
}
