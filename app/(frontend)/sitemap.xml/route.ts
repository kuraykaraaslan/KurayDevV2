// app/sitemap.xml/route.ts
import { NextResponse } from 'next/server'
import { getBaseUrl, renderSitemapIndex } from '@/helpers/SitemapGenerator'

export async function GET() {
  const BASE = getBaseUrl()

  const xml = renderSitemapIndex([
    `${BASE}/sitemap-static.xml`,
    `${BASE}/blog/sitemap.xml`,
    `${BASE}/projects/sitemap.xml`,
  ])

  console.log('Sitemap index generated.')

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
