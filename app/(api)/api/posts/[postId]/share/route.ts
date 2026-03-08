import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import ShortLinkService from '@/services/ShortLinkService'
import PostMessages from '@/messages/PostMessages'

const APP_HOST = process.env.NEXT_PUBLIC_APPLICATION_HOST || 'http://localhost:3000'

/**
 * POST /api/posts/[postId]/share
 * Creates (or returns cached) a short link for the given post.
 * Public endpoint — no auth required.
 * Body: { lang?: string }  → used to build the canonical post URL
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    const post = await PostService.getPostById(postId)
    if (!post) {
      return NextResponse.json({ message: PostMessages.POST_NOT_FOUND }, { status: 404 })
    }

    let lang = 'en'
    try {
      const body = await request.json()
      if (typeof body?.lang === 'string' && body.lang.length > 0) {
        lang = body.lang
      }
    } catch {
      // body is optional — ignore parse failures
    }

    const postUrl = `${APP_HOST}/${lang}/blog/${post.category.slug}/${post.slug}`
    const code = await ShortLinkService.getOrCreate(postUrl)
    const shortUrl = `${APP_HOST}/s/${code}`

    return NextResponse.json({ shortUrl, code })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ message }, { status: 500 })
  }
}
