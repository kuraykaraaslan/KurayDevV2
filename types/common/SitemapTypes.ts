import { z } from 'zod';

export const SitemapTypeEnum = z.enum(['static', 'blog', 'projects']);

export type SitemapType = z.infer<typeof SitemapTypeEnum>;

export const Sitemaps: Record<string, string> = {
    'static': 'sitemap-static.xml',
    'blog': 'blog/sitemap.xml',
    'projects': 'projects/sitemap.xml',
};

export const SitemapUrlSchema = z.object({
    loc: z.string().url('Must be a valid URL'),
    lastmod: z.string().datetime().optional(),
    changefreq: z.string().optional(), // ChangeFreq type
    priority: z.number().min(0).max(1).optional(),
});

export type SitemapUrl = z.infer<typeof SitemapUrlSchema>;
