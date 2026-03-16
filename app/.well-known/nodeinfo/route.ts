import { NextResponse } from 'next/server'

/**
 * GET /.well-known/nodeinfo
 *
 * NodeInfo 2.1 discovery endpoint.
 * Some Fediverse software queries this to understand the server type and version.
 * Points to the full nodeinfo document at /api/activitypub/nodeinfo.
 */
export async function GET() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ?? ''

  return NextResponse.json(
    {
      links: [
        {
          rel: 'http://nodeinfo.diaspora.software/ns/schema/2.1',
          href: `${siteUrl}/api/activitypub/nodeinfo`,
        },
      ],
    },
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=3600',
      },
    }
  )
}
