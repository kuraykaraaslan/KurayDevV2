export const dynamic = "force-dynamic";

import { NextResponse } from 'next/server';
import PostService from '@/services/PostService';
import { getBaseUrl, renderUrlSet } from '@/helpers/SitemapGenerator';
import redisInstance from '@/libs/redis';
import type { SitemapUrl } from '@/types/common';

const CACHE_KEY = 'sitemap:blog';
const CACHE_TTL = 60 * 60; // 1 saat

export async function GET() {
  // 1. Önce Redis’ten dene
  const cached = await redisInstance.get(CACHE_KEY);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  // 2. Cache yoksa DB/Service’ten çek
  const BASE = getBaseUrl();
  const posts = await PostService.getAllPostSlugs();

  const urls: SitemapUrl[] = posts.map((p: any) => ({
    loc: `${BASE}/blog/${p.categorySlug}/${p.slug}`,
    lastmod: p.updatedAt ? new Date(p.createdAt).toISOString() : undefined,
    changefreq: 'daily',
    priority: 0.8,
  }));

  const xml = renderUrlSet(urls);

  // 3. Redis’e yaz
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL);

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
