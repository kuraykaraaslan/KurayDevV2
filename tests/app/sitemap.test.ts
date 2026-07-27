jest.mock('@/services/PostService', () => ({ __esModule: true, default: { getAllPostSlugs: jest.fn() } }))
jest.mock('@/services/ProjectService', () => ({ __esModule: true, default: { getAllProjectSlugs: jest.fn() } }))

import { getSitemapEntries as sitemap } from '@/helpers/SitemapData'
import PostService from '@/services/PostService'
import ProjectService from '@/services/ProjectService'
import { SITE_URL } from '@/libs/seo/siteUrl'

describe('app/sitemap', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(ProjectService.getAllProjectSlugs as jest.Mock).mockResolvedValue([
      { title: 'P1', slug: 'p1', langs: ['tr'] },
    ])
    ;(PostService.getAllPostSlugs as jest.Mock).mockResolvedValue([
      { slug: 'post', categorySlug: 'cat', langs: ['tr'], createdAt: new Date('2024-01-01'), updatedAt: null },
    ])
  })

  it('emits only valid absolute URLs under SITE_URL with no /undefined', async () => {
    const entries = await sitemap()
    expect(entries.length).toBeGreaterThan(0)
    for (const e of entries) {
      expect(e.url.startsWith(SITE_URL)).toBe(true)
      expect(e.url).not.toMatch(/\/undefined(\/|$)/)
      expect(() => new URL(e.url)).not.toThrow()
    }
  })

  it('includes hreflang alternates with x-default on content entries', async () => {
    const entries = await sitemap()
    const post = entries.find((e) => e.url.includes('/blog/cat/post'))
    expect(post).toBeDefined()
    expect(post!.alternates?.languages?.['x-default']).toBeDefined()
    expect(post!.alternates?.languages?.['tr']).toContain('/tr/blog/cat/post')
  })

  it('degrades gracefully when a data source throws', async () => {
    ;(PostService.getAllPostSlugs as jest.Mock).mockRejectedValue(new Error('db down'))
    const entries = await sitemap()
    // Still returns the static + project entries. The homepage
    // <loc> is SITE_URL with no trailing slash so it matches the page canonical.
    expect(entries.length).toBeGreaterThan(0)
    expect(entries.some((e) => e.url === SITE_URL)).toBe(true)
  })
})
