import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'

const AP_CONTENT_TYPE = 'application/activity+json; charset=utf-8'

/**
 * GET /api/activitypub/outbox
 * Returns the OrderedCollection of published Create(Article) activities.
 * Supports ?page=true&p=0 for paginated OrderedCollectionPage responses.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const isPage = searchParams.get('page') === 'true'
    const pageNum = Math.max(0, parseInt(searchParams.get('p') ?? '0', 10))

    const data = isPage
      ? await ActivityPubService.getOutboxPage(pageNum)
      : await ActivityPubService.getOutboxCollection()

    return NextResponse.json(data, {
      status: 200,
      headers: { 'Content-Type': AP_CONTENT_TYPE },
    })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
