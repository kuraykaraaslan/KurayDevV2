import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import CommentService from '@/services/CommentService'
import PostService from '@/services/PostService'
import { CreateCommentRequestSchema } from '@/dtos/CommentDTO'
import CommentMessages from '@/messages/CommentMessages'
import { pipeline } from '@xenova/transformers'
import { CommentStatus } from '@/generated/prisma'

// Bu route kesin Node.js runtime'da çalışsın:
export const runtime = 'nodejs'

// İstersen (zorunlu değil) model cache path'i ayarlayabilirsin
// env.localModelPath = '/tmp/models'; // Vercel için uygun

let toxicityModel: any = null

async function loadToxicityModel() {
  if (!toxicityModel) {
    toxicityModel = await pipeline(
      'text-classification',
      'Xenova/toxic-bert' // 🔴 BURASI ÖNEMLİ
    )
  }
  return toxicityModel
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user session
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'GUEST' })

    // Determine role (ADMIN, USER, or fallback GUEST)
    const userRole = request.user?.role || 'GUEST'

    const body = await request.json()

    const parsedData = CreateCommentRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          error: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    const { content, postId, parentId, email, name } = parsedData.data

    // Validate post
    const post = await PostService.getPostById(postId)

    if (!post) {
      return NextResponse.json({ message: CommentMessages.POST_NOT_FOUND }, { status: 404 })
    }

    let finalStatus: CommentStatus = CommentStatus.NOT_PUBLISHED

    if (userRole === 'ADMIN') {
      finalStatus = CommentStatus.PUBLISHED
    } else {
      try {
        const model = await loadToxicityModel()
        if (!model) {
          console.warn('⚠ Toxicity model could not be loaded. Fallback => NOT_PUBLISHED')
          finalStatus = CommentStatus.NOT_PUBLISHED
        } else {
          const result = await model(content)
          const toxicScore = result[0].score

          const isSafe = toxicScore < 0.45
          finalStatus = isSafe ? CommentStatus.PUBLISHED : CommentStatus.SPAM

          console.log('Toxicity score:', toxicScore, '=>', finalStatus)
        }
      } catch (err) {
        console.error('⚠ AI moderation failed:', err)
        finalStatus = CommentStatus.NOT_PUBLISHED
      }
    }

    await CommentService.createComment({
      content,
      postId,
      parentId,
      email,
      name,
      status: finalStatus,
      createdAt: new Date(),
    })

    return NextResponse.json(
      {
        message: 'Comment created.',
        status: finalStatus,
      },
      { status: 201 }
    )
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    const page = searchParams.get('page') ? parseInt(searchParams.get('page') || '0', 10) : 0
    const pageSize = searchParams.get('pageSize')
      ? parseInt(searchParams.get('pageSize') || '10', 10)
      : 10
    const postId = searchParams.get('postId') || undefined
    const search = searchParams.get('search') || undefined
    const pending = searchParams.get('pending') === 'true'

    if (pending) {
      await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })
    } else {
      await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'GUEST' })
    }

    const data = {
      page,
      pageSize,
      search,
      postId,
      pending,
    }

    const result = await CommentService.getAllComments(data)
    return NextResponse.json({ comments: result.comments, total: result.total, page, pageSize })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, _response: NextResponse) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const data = await request.json()
    await CommentService.updateComment(data)

    return NextResponse.json({ message: 'Comment updated successfully.' })
  } catch (error: any) {
    console.error(error.message)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
