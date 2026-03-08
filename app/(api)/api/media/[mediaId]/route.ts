import { NextResponse } from 'next/server'
import AuthMiddleware from '@/services/AuthService/AuthMiddleware'
import { prisma } from '@/libs/prisma'
import { UpdateMediaRequestSchema } from '@/dtos/MediaDTO'
import MediaMessages from '@/messages/MediaMessages'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    await AuthMiddleware.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { mediaId } = await params
    const body = await request.json()
    
    const parsed = UpdateMediaRequestSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Validation failed', errors: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { name, altText } = parsed.data

    const media = await prisma.media.update({
      where: { mediaId },
      data: { name, altText },
    })

    return NextResponse.json({ message: MediaMessages.MEDIA_UPDATED_SUCCESS, media })
  } catch (error: any) {
    console.error('Error updating media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
