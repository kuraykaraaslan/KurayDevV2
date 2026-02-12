export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import { getBaseUrl, renderUrlSet } from '@/helpers/SitemapGenerator'
import redisInstance from '@/libs/redis'
import type { SitemapUrl } from '@/types/common/SitemapTypes'

const CACHE_KEY = 'sitemap:blog'
const CACHE_TTL = 60 * 60 // 1 hour

export async function GET() {
  // 1. First try from Redis
  const cached = await redisInstance.get(CACHE_KEY)
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }

  // 2. If not cached, fetch from DB/Service
  const BASE = getBaseUrl()
  const posts = await PostService.getAllPostSlugs()

  const urls: SitemapUrl[] = posts.map((p: any) => ({
    loc: `${BASE}/blog/${p.categorySlug}/${p.slug}`,
    lastmod: new Date(p.updatedAt || p.createdAt).toISOString(),
    changefreq: 'daily',
    priority: 0.8,
  }))

  const xml = renderUrlSet(urls)

  // 3. Redis’e yaz
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL)

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
