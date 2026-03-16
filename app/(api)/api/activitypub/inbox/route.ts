import { NextResponse } from 'next/server'
import ActivityPubService from '@/services/ActivityPubService'
import { InboxActivitySchema } from '@/dtos/ActivityPubDTO'
import Logger from '@/libs/logger'

/**
 * POST /api/activitypub/inbox
 * Receives incoming ActivityPub activities from remote Fediverse servers.
 * This endpoint is exempt from CSRF (server-to-server, no browser cookies).
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()

    let body: unknown
    try {
      body = JSON.parse(rawBody)
    } catch {
      return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const parsed = InboxActivitySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid activity', details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const url = new URL(request.url)
    const headers: Record<string, string | string[] | undefined> = {}
    request.headers.forEach((value, key) => { headers[key] = value })

    const signatureValid = await ActivityPubService.verifyHttpSignature(
      request.method,
      url.pathname,
      headers
    )

    if (!signatureValid) {
      const actorId = typeof parsed.data.actor === 'string' ? parsed.data.actor : parsed.data.actor.id
      Logger.warn(`[ActivityPub] Inbox: signature verification failed for actor ${actorId} (${parsed.data.type})`)
      return NextResponse.json({ error: 'Signature verification failed' }, { status: 401 })
    }

    await ActivityPubService.handleInboxActivity(parsed.data as Record<string, unknown>)

    return NextResponse.json({ ok: true }, { status: 202 })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Internal server error'
    Logger.error(`[ActivityPub] Inbox error: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
