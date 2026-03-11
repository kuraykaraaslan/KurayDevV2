import { NextResponse } from 'next/server'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'

export const dynamic = 'force-dynamic'

/**
 * GET /api/posts/[postId]/similar
 * Returns semantically similar posts using the Knowledge Graph (cosine similarity on embeddings).
 * Falls back to empty array when no KG data exists for the post.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params

    if (!postId) {
      return NextResponse.json({ message: 'Post ID is required' }, { status: 400 })
    }

    const limit = parseInt(
      new URL(_request.url).searchParams.get('limit') || '6',
      10
    )

    const similarPosts = await KnowledgeGraphService.getSimilarPosts(postId, limit)

    return NextResponse.json({ posts: similarPosts }) // now full post data with _similarityScore
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[Similar Posts API]', message)
    return NextResponse.json({ message }, { status: 500 })
  }
}
