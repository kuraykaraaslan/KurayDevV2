// helpers/SitemapGenerator.ts
import type { SitemapUrl } from '@/types/common/SitemapTypes'

export type ChangeFreq = 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'

export const getBaseUrl = () => {
  const raw =
    process.env.NEXT_PUBLIC_APPLICATION_HOST ??
    process.env.APPLICATION_HOST ??
    'https://kuray.dev'
  return raw.replace(/\/+$/, '')
}

const escapeXml = (s: string) =>
  s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;')

export const renderUrlSet = (urls: SitemapUrl[]) => {
  const items = urls
    .map(
      (u) => `
  <url>
    <loc>${escapeXml(u.loc)}</loc>
    ${u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''}
    <changefreq>${u.changefreq ?? 'daily'}</changefreq>
    <priority>${(u.priority ?? 0.7).toFixed(1)}</priority>
  </url>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</urlset>`
}

export const renderSitemapIndex = (locs: string[]) => {
  const items = locs
    .map(
      (l) => `
  <sitemap>
    <loc>${escapeXml(l)}</loc>
  </sitemap>`
    )
    .join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${items}
</sitemapindex>`
}
