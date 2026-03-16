import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

const AP_CONTENT_TYPE = 'application/activity+json; charset=utf-8'

/**
 * GET /api/activitypub/followers
 * Returns the OrderedCollection of actors that follow our blog account.
 * Supports ?page=true for a full listing.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const followersUrl = `${ActivityPubService.getActorUrl().replace('/actor', '/followers')}`
    const isPage = searchParams.get('page') === 'true'
    const total = await ActivityPubService.getFollowerCount()

    if (!isPage) {
      return NextResponse.json(
        {
          '@context': 'https://www.w3.org/ns/activitystreams',
          id: followersUrl,
          type: 'OrderedCollection',
          totalItems: total,
          first: `${followersUrl}?page=true`,
        },
        { status: 200, headers: { 'Content-Type': AP_CONTENT_TYPE } }
      )
    }

    const followers = await ActivityPubService.getFollowers()

    return NextResponse.json(
      {
        '@context': 'https://www.w3.org/ns/activitystreams',
        id: `${followersUrl}?page=true`,
        type: 'OrderedCollectionPage',
        partOf: followersUrl,
        totalItems: total,
        orderedItems: followers.map((f) => f.actorUrl),
      },
      { status: 200, headers: { 'Content-Type': AP_CONTENT_TYPE } }
    )
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
