import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import PostCoverService from '@/services/PostService/PostCoverService'
import ActivityPubService from '@/services/ActivityPubService'
import Logger from '@/libs/logger'
import { UpdatePostRequestSchema } from '@/dtos/PostDTO'
import PostMessages from '@/messages/PostMessages'

/**
 * GET handler for retrieving a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the post data or an error message
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const post = await PostService.getPostById(postId)

    if (!post) {
      return NextResponse.json({ message: PostMessages.POST_NOT_FOUND }, { status: 404 })
    }

    return NextResponse.json({ message: PostMessages.POST_RETRIEVED, post })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * DELETE handler for deleting a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing a success message or an error message
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId } = await params
    const post = await PostService.getPostById(postId)

    if (!post) {
      return NextResponse.json({ message: PostMessages.POST_NOT_FOUND }, { status: 404 })
    }

    await PostService.deletePost(postId)

    if (post.status === 'PUBLISHED') {
      ActivityPubService.notifyFollowersOfPostDelete(post).catch((err) => {
        Logger.error(`[ActivityPub] Failed to notify followers of post deletion ${postId}: ${String(err)}`)
      })
    }

    return NextResponse.json({ message: PostMessages.POST_DELETED_SUCCESSFULLY })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

/**
 * PUT handler for updating a post by its ID.
 * @param request - The incoming request object
 * @param context - Contains the URL parameters, including postId
 * @returns A NextResponse containing the updated post data or an error message
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId } = await params

    const existingPost = await PostService.getPostById(postId)

    if (!existingPost) {
      return NextResponse.json({ message: PostMessages.POST_NOT_FOUND }, { status: 404 })
    }

    const data = await request.json()
    data.postId = postId

    const parsedData = UpdatePostRequestSchema.safeParse(data)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const post = await PostService.updatePost(parsedData.data)

    await KnowledgeGraphService.queueUpdatePost(post.postId)

    if (!post.image) {
      await PostCoverService.resetById(post.postId)
    }

    if (post.status === 'PUBLISHED') {
      const notifyData = {
        postId: post.postId,
        title: post.title,
        content: post.content,
        description: post.description,
        slug: post.slug,
        keywords: post.keywords,
        publishedAt: post.publishedAt,
        category: existingPost.category,
      }
      if (existingPost.status === 'PUBLISHED') {
        ActivityPubService.notifyFollowersOfPostUpdate(notifyData).catch((err) => {
          Logger.error(`[ActivityPub] Failed to notify followers of post update ${postId}: ${String(err)}`)
        })
      } else {
        ActivityPubService.notifyFollowersOfPost(notifyData).catch((err) => {
          Logger.error(`[ActivityPub] Failed to notify followers of post publish ${postId}: ${String(err)}`)
        })
      }
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
