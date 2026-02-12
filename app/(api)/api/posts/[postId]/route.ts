import { NextResponse } from 'next/server'
import PostService from '@/services/PostService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import PostCoverService from '@/services/PostService/PostCoverService'
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
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId } = await params
    const post = await PostService.getPostById(postId)

    if (!post) {
      return NextResponse.json({ message: PostMessages.POST_NOT_FOUND }, { status: 404 })
    }

    await PostService.deletePost(postId)

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
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId } = await params

    const data = await request.json()
    data.postId = postId

    const parsedData = UpdatePostRequestSchema.safeParse(data)

    if (!parsedData.success) {
      console.log('Validation errors:', parsedData.error.errors)
      return NextResponse.json(
        {
          error: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    console.log('Updating post:', parsedData.data.postId)
    const post = await PostService.updatePost(parsedData.data)

    await KnowledgeGraphService.queueUpdatePost(post.postId)

    if (!post.image) {
      await PostCoverService.resetById(post.postId)
    }

    return NextResponse.json({ post })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
