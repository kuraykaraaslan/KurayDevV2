import { NextResponse } from 'next/server'
import PostLikeService from '@/services/PostService/LikeService'
import UserSessionService from '@/services/AuthService/UserSessionService'
import PostMessages from '@/messages/PostMessages'
import { LikePostRequestSchema } from '@/dtos/PostInteractionDTO'

export async function POST(request: NextRequest, { params }: { params: { postId: string } }) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'GUEST' })

    const { postId } = await params

    const parsedData = LikePostRequestSchema.safeParse({ postId })

    if (!parsedData.success) {
      return NextResponse.json(
        {
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const userId = request?.user?.userId || null

    // Call the likePost method with the postId and userId
    await PostLikeService.likePost({
      postId,
      userId,
      request, // Pass the request
    })

    return NextResponse.json({ message: PostMessages.POST_LIKED_SUCCESSFULLY, liked: true })
  } catch (error: any) {
    console.error('Error liking post:', error)
    return NextResponse.json(
      { message: error.message || PostMessages.OPERATION_FAILED },
      { status: 500 }
    )
  }
}
