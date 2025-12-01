// types/SitemapTypes.ts
import type { ChangeFreq } from '@/helpers/SitemapGenerator';

export enum SitemapType {
    STATIC = "static",
    BLOG = "blog",
    PROJECTS = "projects",
}

export const Sitemaps: Record<SitemapType, string> = {
    [SitemapType.STATIC]: "sitemap-static.xml",
    [SitemapType.BLOG]: "blog/sitemap.xml",
    [SitemapType.PROJECTS]: "projects/sitemap.xml",
}
export type SitemapUrl = {
  loc: string;
  lastmod?: string;       // ISO8601
  changefreq?: ChangeFreq;
  priority?: number;      // 0.0 - 1.0
};
