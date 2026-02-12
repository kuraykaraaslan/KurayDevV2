// app/sitemap-static.xml/route.ts
import { NextResponse } from 'next/server'
import { getBaseUrl, renderUrlSet } from '@/helpers/SitemapGenerator'
import redisInstance from '@/libs/redis'
import type { SitemapUrl } from '@/types/common/SitemapTypes'

const CACHE_KEY = 'sitemap:static'
const CACHE_TTL = 24 * 60 * 60 // 1 day

export async function GET() {
  const cached = await redisInstance.get(CACHE_KEY)
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    })
  }

  const BASE = getBaseUrl()
  const urls: SitemapUrl[] = [
    { loc: `${BASE}/`, changefreq: 'daily', priority: 1.0 },
    { loc: `${BASE}/about`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${BASE}/projects`, changefreq: 'weekly', priority: 0.8 },
    { loc: `${BASE}/blog`, changefreq: 'daily', priority: 0.9 },
    { loc: `${BASE}/contact`, changefreq: 'monthly', priority: 0.5 },
    { loc: `${BASE}/privacy-policy`, changefreq: 'yearly', priority: 0.3 },
    { loc: `${BASE}/terms-of-use`, changefreq: 'yearly', priority: 0.3 },
  ]

  const xml = renderUrlSet(urls)
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL)

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  })
}
