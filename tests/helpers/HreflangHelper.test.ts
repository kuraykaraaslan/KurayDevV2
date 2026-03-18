import { buildLangUrl, buildAlternates } from '@/helpers/HreflangHelper'

// ── Mocks ────────────────────────────────────────────────────────────────────
// HreflangHelper reads NEXT_PUBLIC_APPLICATION_HOST and DEFAULT_LANGUAGE from
// the I18nTypes module. We fix the host so tests are deterministic.

const HOST = 'https://example.com'

describe('HreflangHelper', () => {
  const originalEnv = process.env.NEXT_PUBLIC_APPLICATION_HOST

  beforeAll(() => {
    process.env.NEXT_PUBLIC_APPLICATION_HOST = HOST
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_APPLICATION_HOST = originalEnv
  })

  beforeEach(() => jest.clearAllMocks())

  // ── buildLangUrl ───────────────────────────────────────────────────────────
  describe('buildLangUrl', () => {
    it('builds a URL without language prefix for the default language (en)', () => {
      // The module-level HOST constant is captured at import time; we test the
      // exported function's logic directly with the env in place.
      const url = buildLangUrl('en', '/blog/my-post')
      // Should NOT include /en prefix
      expect(url).not.toContain('/en/')
      expect(url).toContain('/blog/my-post')
    })

    it('prepends /{lang} prefix for non-default languages', () => {
      const url = buildLangUrl('tr', '/blog/my-post')
      expect(url).toContain('/tr/blog/my-post')
    })

    it('constructs a URL with correct path for a locale', () => {
      const url = buildLangUrl('fr', '/about')
      expect(url).toContain('/fr/about')
    })

    it('handles root path correctly for default language', () => {
      const url = buildLangUrl('en', '/')
      expect(url).toContain('/')
      expect(url).not.toMatch(/\/en\//)
    })
  })

  // ── buildAlternates ────────────────────────────────────────────────────────
  describe('buildAlternates', () => {
    it('generates canonical URL for the current language', () => {
      const { canonical } = buildAlternates('en', '/blog/post', ['en', 'tr'])
      expect(canonical).toContain('/blog/post')
    })

    it('generates hreflang entries for all available languages', () => {
      const { languages } = buildAlternates('en', '/blog/post', ['en', 'tr'])

      expect(languages['en']).toBeDefined()
      expect(languages['tr']).toBeDefined()
    })

    it('always includes x-default pointing to the default language version', () => {
      const { languages } = buildAlternates('tr', '/blog/post', ['en', 'tr'])

      expect(languages['x-default']).toBeDefined()
      // x-default should match the English (default) URL, not the Turkish one
      expect(languages['x-default']).toBe(languages['en'])
    })

    it('generates correct alternate URLs for non-default locale', () => {
      const { canonical, languages } = buildAlternates('tr', '/about', ['en', 'tr'])

      expect(canonical).toContain('/tr/about')
      expect(languages['en']).not.toContain('/tr/')
      expect(languages['tr']).toContain('/tr/about')
    })

    it('handles single-locale list with only English', () => {
      const { languages } = buildAlternates('en', '/contact', ['en'])

      expect(languages['en']).toBeDefined()
      expect(languages['x-default']).toBeDefined()
      expect(languages['x-default']).toBe(languages['en'])
    })

    it('handles multiple locales producing distinct URLs', () => {
      const langs = ['en', 'tr', 'fr', 'de']
      const { languages } = buildAlternates('en', '/page', langs)

      const urls = langs.map((l) => languages[l])
      const uniqueUrls = new Set(urls)
      expect(uniqueUrls.size).toBe(langs.length)
    })

    it('does not duplicate x-default when en is already in availableLangs', () => {
      const { languages } = buildAlternates('en', '/page', ['en', 'tr'])

      // x-default and en may share the same URL value but should both be present as keys
      const keys = Object.keys(languages)
      expect(keys).toContain('en')
      expect(keys).toContain('x-default')
    })
  })
})
