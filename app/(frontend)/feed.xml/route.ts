export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import PostService from '@/services/PostService';
import { getBaseUrl } from '@/helpers/SitemapGenerator';
import redisInstance from '@/libs/redis';

const CACHE_KEY = 'feed:blog';
const CACHE_TTL = 60 * 60; // 1 saat

export async function GET() {
  // 1. Önce Redis'ten dene
  const cached = await redisInstance.get(CACHE_KEY);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
    });
  }

  // 2. Cache yoksa DB/Service'ten çek
  const BASE = getBaseUrl();
  const posts = await PostService.getAllPostSlugs();

  const rssItems = posts
    .map((p: any) => `
    <item>
      <title>${escapeXml(p.title)}</title>
      <link>${BASE}/blog/${p.categorySlug}/${p.slug}</link>
      <guid>${BASE}/blog/${p.categorySlug}/${p.slug}</guid>
      <pubDate>${new Date(p.createdAt).toUTCString()}</pubDate>
      <description>${escapeXml(p.description || '')}</description>
    </item>`)
    .join('');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Blog Feed</title>
    <link>${BASE}/blog</link>
    <description>Latest blog posts</description>
    <language>en-us</language>
    ${rssItems}
  </channel>
</rss>`;

  // 3. Redis'e yaz
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL);

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  });
}

function escapeXml(str: string): string {
  return str.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case "'": return '&apos;';
      case '"': return '&quot;';
      default: return c;
    }
  });
}
