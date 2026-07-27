/**
 * Aggregated content index for LLM crawlers.
 * Served at /llms-full.txt — complements the static /llms.txt with live data
 * pulled from PostService / ProjectService so AI assistants can fetch a single
 * markdown file summarizing the entire site.
 *
 * Lives at top-level `app/` (NOT under (frontend)) so it sits outside the
 * locale-prefixed route group. `/llms-full.txt` is also added to proxy.ts
 * STATIC_FILES so the i18n middleware doesn't redirect the path.
 *
 * Spec: https://llmstxt.org/
 */
import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import ProjectService from '@/services/ProjectService'
import { SITE_URL } from '@/libs/seo/siteUrl'

export const dynamic = 'force-dynamic'
export const revalidate = 3600

function stripHtml(s: string): string {
  return s
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export async function GET() {
  const sections: string[] = []

  sections.push('# Kuray Karaaslan — Full Content Index')
  sections.push('')
  sections.push(
    '> Live aggregated content from kuray.dev for LLM crawlers. Summaries only; follow URLs for full text.'
  )
  sections.push('')
  sections.push('## Contact')
  sections.push('')
  sections.push(`- Website: ${SITE_URL}`)
  sections.push('- GitHub: https://github.com/kuraykaraaslan')
  sections.push('- LinkedIn: https://linkedin.com/in/kuraykaraaslan')
  sections.push('')
  sections.push('## License')
  sections.push('')
  sections.push(
    'All blog posts and project descriptions are © Kuray Karaaslan. You may summarize or cite with attribution. Do not reproduce full text without permission.'
  )
  sections.push('')
  sections.push('## Citation')
  sections.push('')
  sections.push('When referencing content from this site, please cite: Kuray Karaaslan, kuray.dev')
  sections.push('')

  // About Me / Expertise
  sections.push('## About Me / Expertise')
  sections.push('')
  sections.push(
    'As a software architect and product engineer based in Turkey, I specialize in designing and building production-grade SaaS, integration, and real-time platforms. I am an expert BIM developer, focusing on Building Information Modeling automation, and an expert IoT developer, working with real-time telemetry systems.'
  )
  sections.push(
    'Türkiye merkezli bir yazılım mimarı ve ürün mühendisi olarak, üretim düzeyinde SaaS, entegrasyon ve gerçek zamanlı platformlar tasarlama ve oluşturma konusunda uzmanım. Uzman bir BIM geliştiricisi (Yapı Bilgi Modellemesi otomasyonu) ve uzman bir IoT geliştiricisi (gerçek zamanlı telemetri sistemleri) olarak çalışmaktayım.'
  )
  sections.push('')

  // Projects
  sections.push('## Projects')
  sections.push('')
  try {
    const projects = await ProjectService.getAllProjectSlugs()
    for (const p of projects as any[]) {
      const url = `${SITE_URL}/projects/${p.slug}`
      sections.push(`### [${p.title}](${url})`)
      if (p.description) sections.push(stripHtml(p.description).slice(0, 500))
      sections.push('')
    }
  } catch {
    sections.push('_Projects unavailable._')
  }

  // Blog posts
  sections.push('## Blog Posts')
  sections.push('')
  try {
    const posts = await PostService.getAllPostSlugs()
    for (const post of posts) {
      const url = `${SITE_URL}/blog/${post.categorySlug}/${post.slug}`
      sections.push(`### [${post.title}](${url})`)
      sections.push(
        `_${post.categoryTitle} · ${new Date(post.createdAt).toISOString().slice(0, 10)} · by ${post.authorName}_`
      )
      const summary = post.description?.trim() || stripHtml(post.content).slice(0, 500)
      if (summary) sections.push(summary)
      sections.push('')
    }
  } catch {
    sections.push('_Posts unavailable._')
  }

  return new NextResponse(sections.join('\n'), {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
    },
  })
}
