import DOMPurify from 'isomorphic-dompurify'
import Image from 'next/image'
import { addHeadingIds } from '@/helpers/tocUtils'

export default function Article(doc: { title : string; content: string; image: string }) {
  const image = doc.image ?? null

  const sanitizedHTML = DOMPurify.sanitize(doc.content ?? '', {
    USE_PROFILES: { html: true },
    ALLOWED_TAGS: [
      'p',
      'b',
      'i',
      'em',
      'strong',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'h4',
      'blockquote',
      'code',
      'pre',
      'img',
      'br',
    ],
    ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'id'],
  })

  // Add IDs to headings for anchor links
  const safeHTML = addHeadingIds(sanitizedHTML)

  return (
    <div className="max-w-none justify-center text-left mx-auto prose mb-8 max-w-none">
      <div dangerouslySetInnerHTML={{ __html: safeHTML }} className="prose mt-4 max-w-none" />
    </div>
  )
}
