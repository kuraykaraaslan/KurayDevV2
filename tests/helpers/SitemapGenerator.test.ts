import {
  getBaseUrl,
  renderUrlSet,
  renderSitemapIndex,
  type ChangeFreq,
} from '@/helpers/SitemapGenerator'
import type { SitemapUrl } from '@/types/common/SitemapTypes'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('SitemapGenerator', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── getBaseUrl ─────────────────────────────────────────────────────────────
  // Note: the module-level constant is captured at import time, so we only
  // verify the contract (no trailing slash) against whatever env is active.
  describe('getBaseUrl', () => {
    it('returns a non-empty string', () => {
      const url = getBaseUrl()
      expect(typeof url).toBe('string')
      expect(url.length).toBeGreaterThan(0)
    })

    it('never has a trailing slash', () => {
      const url = getBaseUrl()
      expect(url.endsWith('/')).toBe(false)
    })

    it('starts with http:// or https://', () => {
      const url = getBaseUrl()
      expect(url).toMatch(/^https?:\/\//)
    })
  })

  // ── renderUrlSet ───────────────────────────────────────────────────────────
  describe('renderUrlSet', () => {
    it('produces valid XML sitemap structure', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/about', changefreq: 'monthly', priority: 0.8 },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('</urlset>')
      expect(xml).toContain('<loc>https://example.com/about</loc>')
    })

    it('includes changefreq and priority in output', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', changefreq: 'weekly', priority: 0.9 },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<changefreq>weekly</changefreq>')
      expect(xml).toContain('<priority>0.9</priority>')
    })

    it('includes lastmod when provided', () => {
      const urls: SitemapUrl[] = [
        {
          loc:      'https://example.com/post',
          lastmod:  '2026-03-18T00:00:00.000Z',
          changefreq: 'daily',
          priority: 0.7,
        },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<lastmod>2026-03-18T00:00:00.000Z</lastmod>')
    })

    it('omits lastmod tag when not provided', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/page', changefreq: 'daily', priority: 0.6 },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).not.toContain('<lastmod>')
    })

    it('returns empty urlset for an empty array', () => {
      const xml = renderUrlSet([])

      expect(xml).toContain('<urlset')
      expect(xml).toContain('</urlset>')
      expect(xml).not.toContain('<url>')
    })

    it('formats priority to one decimal place', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/', priority: 1 },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<priority>1.0</priority>')
    })

    it('defaults changefreq to daily when not supplied', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/' },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<changefreq>daily</changefreq>')
    })

    it('defaults priority to 0.7 when not supplied', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/' },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('<priority>0.7</priority>')
    })

    it('escapes ampersands in URL', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/search?q=a&b=c' },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).toContain('&amp;')
      expect(xml).not.toMatch(/<loc>[^<]*&[^a][^<]*<\/loc>/)
    })

    it('escapes angle brackets and quotes in URL', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/page?x=<bad>"value"' },
      ]

      const xml = renderUrlSet(urls)

      expect(xml).not.toContain('<bad>')
      expect(xml).toContain('&lt;bad&gt;')
    })

    it('renders multiple URLs with correct count', () => {
      const urls: SitemapUrl[] = [
        { loc: 'https://example.com/a', priority: 0.8 },
        { loc: 'https://example.com/b', priority: 0.7 },
        { loc: 'https://example.com/c', priority: 0.6 },
      ]

      const xml = renderUrlSet(urls)
      const matches = xml.match(/<url>/g) ?? []

      expect(matches).toHaveLength(3)
    })
  })

  // ── renderSitemapIndex ─────────────────────────────────────────────────────
  describe('renderSitemapIndex', () => {
    it('produces valid sitemap index XML structure', () => {
      const locs = ['https://example.com/sitemap-1.xml', 'https://example.com/sitemap-2.xml']

      const xml = renderSitemapIndex(locs)

      expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>')
      expect(xml).toContain('<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')
      expect(xml).toContain('</sitemapindex>')
    })

    it('includes each sitemap loc entry', () => {
      const locs = ['https://example.com/sitemap-blog.xml', 'https://example.com/sitemap-projects.xml']

      const xml = renderSitemapIndex(locs)

      expect(xml).toContain('<loc>https://example.com/sitemap-blog.xml</loc>')
      expect(xml).toContain('<loc>https://example.com/sitemap-projects.xml</loc>')
    })

    it('returns empty sitemapindex for an empty array', () => {
      const xml = renderSitemapIndex([])

      expect(xml).toContain('<sitemapindex')
      expect(xml).toContain('</sitemapindex>')
      expect(xml).not.toContain('<sitemap>')
    })

    it('escapes special characters in sitemap loc', () => {
      const locs = ['https://example.com/sitemap?type=blog&v=1']

      const xml = renderSitemapIndex(locs)

      expect(xml).toContain('&amp;')
    })
  })
})
