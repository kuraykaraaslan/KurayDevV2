import type { MetadataRoute } from 'next'
import PostService from '@/services/PostService'
import ProjectService from '@/services/ProjectService'
import redisInstance from '@/libs/redis'
import { SITE_URL } from '@/libs/seo/siteUrl'
import { buildAlternates } from '@/helpers/HreflangHelper'
import { INDEXABLE_LANGUAGES } from '@/types/common/I18nTypes'

/**
 * hreflang alternates (incl. x-default) for a path available in `langs`.
 * Reuses the same helper the page-level metadata uses so the sitemap and the
 * per-page <link rel="alternate"> signals stay consistent.
 */
function altLanguages(path: string, langs: string[]) {
  return { languages: buildAlternates('en', path, langs).languages }
}

const CACHE_KEY = 'sitemap:root'
const CACHE_TTL = 60 * 60 // 1 hour

/** Join SITE_URL with a path. Path may start with or without a leading slash. */
export function siteUrl(path = ''): string {
  if (!path) return SITE_URL + '/'
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Returns the cached sitemap entry list (building + caching on a miss).
 * Shape matches Next's `MetadataRoute.Sitemap` so existing tests keep working.
 */
export async function getSitemapEntries(): Promise<MetadataRoute.Sitemap> {
  try {
    const cached = await redisInstance.get(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached) as MetadataRoute.Sitemap
    }
  } catch {
    // ignore cache read errors and fall through to a fresh build
  }

  const entries = await buildSitemap()

  try {
    await redisInstance.set(CACHE_KEY, JSON.stringify(entries), 'EX', CACHE_TTL)
  } catch {
    // ignore cache write errors
  }

  return entries
}

export async function buildSitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()

  // Static listings have no per-item translations, so they're advertised in the
  // genuinely-maintained language set (INDEXABLE_LANGUAGES, e.g. en/tr) rather
  // than all 24 UI languages — avoids signalling incomplete translations.
  const staticLangs = [...INDEXABLE_LANGUAGES]
  const staticEntries: MetadataRoute.Sitemap = [
    // Root <loc> must match the homepage canonical (no trailing slash), which is
    // buildLangUrl('en', '') === SITE_URL. A trailing slash here made the sitemap
    // advertise a URL the page itself declares non-canonical.
    { url: SITE_URL, lastModified: now, changeFrequency: 'weekly', priority: 1.0, alternates: altLanguages('', staticLangs) },
    { url: `${SITE_URL}/blog`, lastModified: now, changeFrequency: 'daily', priority: 0.9, alternates: altLanguages('/blog', staticLangs) },
    { url: `${SITE_URL}/projects`, lastModified: now, changeFrequency: 'weekly', priority: 0.8, alternates: altLanguages('/projects', staticLangs) },
    { url: `${SITE_URL}/about`, lastModified: now, changeFrequency: 'monthly', priority: 0.6, alternates: altLanguages('/about', staticLangs) },
  ]

  let projectEntries: MetadataRoute.Sitemap = []
  try {
    const projects = await ProjectService.getAllProjectSlugs()
    projectEntries = projects.map((p) => ({
      url: `${SITE_URL}/projects/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
      alternates: altLanguages(`/projects/${p.slug}`, ['en', ...p.langs]),
      ...(p.image ? { images: [p.image] } : {}),
    }))
  } catch {
    projectEntries = []
  }

  let postEntries: MetadataRoute.Sitemap = []
  try {
    const posts = await PostService.getAllPostSlugs()
    postEntries = posts.map((post) => ({
      url: `${SITE_URL}/blog/${post.categorySlug}/${post.slug}`,
      lastModified: post.updatedAt ? new Date(post.updatedAt) : post.createdAt,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
      alternates: altLanguages(`/blog/${post.categorySlug}/${post.slug}`, ['en', ...post.langs]),
      ...(post.image ? { images: [post.image] } : {}),
    }))
  } catch {
    postEntries = []
  }

  // Dedupe by URL, keeping the first occurrence.
  const all = [...staticEntries, ...projectEntries, ...postEntries]
  const seen = new Set<string>()
  return all.filter((entry) => {
    if (seen.has(entry.url)) return false
    seen.add(entry.url)
    return true
  })
}

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (c) =>
    c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '&' ? '&amp;' : c === "'" ? '&apos;' : '&quot;'
  )
}

function toIso(value: Date | string | undefined): string | null {
  if (!value) return null
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString()
}

/**
 * Serialize sitemap entries to the standard urlset XML, optionally referencing
 * an XSL stylesheet so browsers render a human-readable page instead of raw
 * (often un-pretty-printed) markup. The stylesheet PI is ignored by crawlers,
 * so the document stays a fully valid sitemap.
 */
export function serializeSitemap(
  entries: MetadataRoute.Sitemap,
  opts: { stylesheetHref?: string } = {}
): string {
  const lines: string[] = ['<?xml version="1.0" encoding="UTF-8"?>']
  if (opts.stylesheetHref) {
    lines.push(`<?xml-stylesheet type="text/xsl" href="${escapeXml(opts.stylesheetHref)}"?>`)
  }
  lines.push(
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
  )

  for (const entry of entries) {
    lines.push('<url>')
    lines.push(`<loc>${escapeXml(entry.url)}</loc>`)

    const languages = entry.alternates?.languages
    if (languages) {
      for (const [lang, href] of Object.entries(languages)) {
        if (!href) continue
        lines.push(`<xhtml:link rel="alternate" hreflang="${escapeXml(lang)}" href="${escapeXml(href)}" />`)
      }
    }

    if (entry.images) {
      for (const img of entry.images) {
        lines.push(`<image:image><image:loc>${escapeXml(img)}</image:loc></image:image>`)
      }
    }

    const lastmod = toIso(entry.lastModified)
    if (lastmod) lines.push(`<lastmod>${lastmod}</lastmod>`)
    if (entry.changeFrequency) lines.push(`<changefreq>${entry.changeFrequency}</changefreq>`)
    if (entry.priority !== undefined) lines.push(`<priority>${entry.priority}</priority>`)

    lines.push('</url>')
  }

  lines.push('</urlset>')
  return lines.join('\n')
}
