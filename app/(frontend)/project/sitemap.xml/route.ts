// app/project/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import ProjectService from '@/services/ProjectService';
import { getBaseUrl, renderUrlSet } from '@/helpers/SitemapGenerator';
import redisInstance from '@/libs/redis';
import type { SitemapUrl } from '@/types/SitemapTypes';

const CACHE_KEY = 'sitemap:project';
const CACHE_TTL = 60 * 60;

export async function GET() {
  const cached = await redisInstance.get(CACHE_KEY);
  if (cached) {
    return new NextResponse(cached, {
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const BASE = getBaseUrl();
  const projects = await ProjectService.getAllProjectSlugs();

  const urls: SitemapUrl[] = projects.map((pr: any) => ({
    loc: `${BASE}/project/${pr.slug}`,
    lastmod: pr.updatedAt ? new Date(pr.updatedAt).toISOString() : undefined,
    changefreq: 'weekly',
    priority: 0.7,
  }));

  const xml = renderUrlSet(urls);
  await redisInstance.set(CACHE_KEY, xml, 'EX', CACHE_TTL);

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
