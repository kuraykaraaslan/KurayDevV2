/**
 * Table of Contents Utility Functions
 * These can be used on both server and client side
 */

export interface TOCItem {
  id: string
  text: string
  level: number
}

/**
 * Generates a URL-friendly slug from text
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove multiple hyphens
    .trim()
}

/**
 * Adds IDs to headings in HTML content for anchor links
 */
export function addHeadingIds(htmlContent: string): string {
  return htmlContent.replace(
    /<h([2-3])([^>]*)>([^<]+)<\/h[2-3]>/gi,
    (match, level, attrs, text) => {
      const id = generateSlug(text.trim())
      // Check if id already exists in attrs
      if (attrs.includes('id=')) {
        return match
      }
      return `<h${level}${attrs} id="${id}">${text}</h${level}>`
    }
  )
}

/**
 * Extracts headings from HTML content and generates TOC items
 */
export function extractHeadings(htmlContent: string): TOCItem[] {
  const headingRegex = /<h([2-3])[^>]*>([^<]+)<\/h[2-3]>/gi
  const headings: TOCItem[] = []
  let match

  while ((match = headingRegex.exec(htmlContent)) !== null) {
    const level = parseInt(match[1])
    const text = match[2].trim()
    const id = generateSlug(text)
    headings.push({ id, text, level })
  }

  return headings
}
