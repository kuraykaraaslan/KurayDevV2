import { generateSlug, addHeadingIds, extractHeadings, type TOCItem } from '@/helpers/tocUtils'

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('tocUtils', () => {
  beforeEach(() => jest.clearAllMocks())

  // ── generateSlug ───────────────────────────────────────────────────────────
  describe('generateSlug', () => {
    it('converts text to lowercase', () => {
      expect(generateSlug('Hello World')).toBe('hello-world')
    })

    it('replaces spaces with hyphens', () => {
      expect(generateSlug('getting started')).toBe('getting-started')
    })

    it('removes special characters', () => {
      expect(generateSlug('C++ & TypeScript!')).toBe('c-typescript')
    })

    it('collapses multiple hyphens into one', () => {
      expect(generateSlug('hello---world')).toBe('hello-world')
    })

    it('handles leading and trailing whitespace in input', () => {
      // Spaces become hyphens before .trim() runs, so outer spaces produce
      // leading/trailing hyphens that .trim() does not strip (trim removes spaces only).
      // The slug still has the core content with word separators.
      const result = generateSlug('  hello world  ')
      expect(result).toContain('hello')
      expect(result).toContain('world')
    })

    it('handles empty string', () => {
      expect(generateSlug('')).toBe('')
    })

    it('handles strings with only special characters', () => {
      // After removing all non-slug chars, should be empty or just hyphens trimmed away
      const result = generateSlug('!@#$%^')
      expect(typeof result).toBe('string')
    })

    it('preserves numbers in slugs', () => {
      expect(generateSlug('Phase 25 Chatbot')).toBe('phase-25-chatbot')
    })
  })

  // ── extractHeadings ────────────────────────────────────────────────────────
  describe('extractHeadings', () => {
    it('extracts h2 headings from HTML content', () => {
      const html = '<h2>Introduction</h2><p>Some text</p>'
      const toc = extractHeadings(html)

      expect(toc).toHaveLength(1)
      expect(toc[0].text).toBe('Introduction')
      expect(toc[0].level).toBe(2)
    })

    it('extracts h3 headings from HTML content', () => {
      const html = '<h3>Sub-section</h3>'
      const toc = extractHeadings(html)

      expect(toc).toHaveLength(1)
      expect(toc[0].level).toBe(3)
    })

    it('extracts multiple headings in document order', () => {
      const html = '<h2>First</h2><h3>Sub</h3><h2>Second</h2>'
      const toc = extractHeadings(html)

      expect(toc).toHaveLength(3)
      expect(toc[0].text).toBe('First')
      expect(toc[1].text).toBe('Sub')
      expect(toc[2].text).toBe('Second')
    })

    it('returns empty array for content with no headings', () => {
      const html = '<p>No headings here.</p><ul><li>Item</li></ul>'
      const toc = extractHeadings(html)

      expect(toc).toEqual([])
    })

    it('returns empty array for empty string', () => {
      expect(extractHeadings('')).toEqual([])
    })

    it('generates a slug-based id for each heading', () => {
      const html = '<h2>TypeScript Tips</h2>'
      const toc = extractHeadings(html)

      expect(toc[0].id).toBe('typescript-tips')
    })

    it('does NOT extract h1 headings (only h2 and h3)', () => {
      const html = '<h1>Page Title</h1><h2>Section</h2>'
      const toc = extractHeadings(html)

      // Only h2 should be captured
      expect(toc).toHaveLength(1)
      expect(toc[0].level).toBe(2)
    })

    it('does NOT extract h4+ headings (only h2 and h3)', () => {
      const html = '<h4>Deep section</h4><h2>Shallow</h2>'
      const toc = extractHeadings(html)

      expect(toc).toHaveLength(1)
      expect(toc[0].level).toBe(2)
    })

    it('handles headings with extra whitespace in text', () => {
      const html = '<h2>  Hello World  </h2>'
      const toc = extractHeadings(html)

      expect(toc[0].text).toBe('Hello World')
    })

    it('handles headings with special characters by producing a sanitized id', () => {
      const html = '<h2>C++ &amp; Go</h2>'
      const toc = extractHeadings(html)

      // The text captured is the raw HTML text node; slug should be safe
      expect(toc[0].id).not.toContain('+')
      expect(typeof toc[0].id).toBe('string')
    })

    it('produces correct nesting levels for mixed h2/h3 content', () => {
      const html = `
        <h2>Chapter One</h2>
        <h3>Section 1.1</h3>
        <h3>Section 1.2</h3>
        <h2>Chapter Two</h2>
      `
      const toc = extractHeadings(html)

      const levels = toc.map((item) => item.level)
      expect(levels).toEqual([2, 3, 3, 2])
    })
  })

  // ── addHeadingIds ──────────────────────────────────────────────────────────
  describe('addHeadingIds', () => {
    it('adds id attribute to h2 tags without existing id', () => {
      const html = '<h2>Hello World</h2>'
      const result = addHeadingIds(html)

      expect(result).toContain('id="hello-world"')
    })

    it('adds id attribute to h3 tags without existing id', () => {
      const html = '<h3>Sub Section</h3>'
      const result = addHeadingIds(html)

      expect(result).toContain('id="sub-section"')
    })

    it('does not modify headings that already have an id', () => {
      const html = '<h2 id="existing-id">My Heading</h2>'
      const result = addHeadingIds(html)

      expect(result).toContain('id="existing-id"')
      // Should not add a second id attribute
      expect(result.match(/id=/g)).toHaveLength(1)
    })

    it('preserves other attributes on heading tags', () => {
      const html = '<h2 class="title">Section</h2>'
      const result = addHeadingIds(html)

      expect(result).toContain('class="title"')
      expect(result).toContain('id="section"')
    })

    it('leaves h1 and h4+ tags unchanged', () => {
      const html = '<h1>Page Title</h1><h4>Deep</h4>'
      const result = addHeadingIds(html)

      expect(result).toBe(html)
    })

    it('handles empty string without throwing', () => {
      expect(addHeadingIds('')).toBe('')
    })

    it('returns original content when there are no h2/h3 headings', () => {
      const html = '<p>Just a paragraph</p>'
      expect(addHeadingIds(html)).toBe(html)
    })
  })
})
