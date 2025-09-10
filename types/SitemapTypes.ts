// types/SitemapTypes.ts
import type { ChangeFreq } from '@/helpers/SitemapGenerator';

export type SitemapUrl = {
  loc: string;
  lastmod?: string;       // ISO8601
  changefreq?: ChangeFreq;
  priority?: number;      // 0.0 - 1.0
};
