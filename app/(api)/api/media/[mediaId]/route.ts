import { NextResponse } from 'next/server'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { prisma } from '@/libs/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ mediaId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { mediaId } = await params
    const body = await request.json()
    const { name, altText } = body

    const media = await prisma.media.update({
      where: { mediaId },
      data: { name, altText },
    })

    return NextResponse.json({ message: 'Media updated successfully', media })
  } catch (error: any) {
    console.error('Error updating media:', error)
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
