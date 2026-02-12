export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import { getBaseUrl } from '@/helpers/SitemapGenerator'
import redisInstance from '@/libs/redis'

const CACHE_KEY = 'feed:blog'
const CACHE_TTL = 60 * 60 // 1 hour

export async function GET() {
  // 1. First try from Redis
  const cached = await redisInstance.get(CACHE_KEY)
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    })
  }

  // 2. If not cached, fetch from DB/Service
  const BASE = getBaseUrl()
  const posts = await PostService.getAllPostSlugs()

  const rssItems = posts
    .map(
      (p) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE}/blog/${p.categorySlug}/${p.slug}</link>
      <guid isPermaLink="true">${BASE}/blog/${p.categorySlug}/${p.slug}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <author>kuray@kuray.dev (${escapeXml(p.authorName)})</author>
      <category>${escapeXml(p.categoryTitle)}</category>
      <description>${escapeXml(p.description || p.content?.substring(0, 300) + '...' || '')}</description>
      <content:encoded><![CDATA[${p.content || ''}]]></content:encoded>
    </item>`
    )
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Kuray Karaaslan Blog</title>
    <link>${BASE}/blog</link>
    <description>Software development, tech insights, and open-source projects by Kuray Karaaslan</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${BASE}/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>${BASE}/assets/img/og.png</url>
      <title>Kuray Karaaslan Blog</title>
      <link>${BASE}/blog</link>
    </image>
    ${rssItems}
  </channel>
</rss>`

  // 3. Redis'e yaz
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL)

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}

function escapeXml(str: string | null | undefined): string {
  if (!str) return ''
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp;'
      case "'":
        return '&apos;'
      case '"':
        return '&quot;'
      default:
        return c
    }
  })
}
