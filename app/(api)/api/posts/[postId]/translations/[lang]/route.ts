import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import UserSessionService from '@/services/AuthService/UserSessionService'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string; lang: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId, lang } = await params

    const existing = await prisma.postTranslation.findUnique({
      where: { postId_lang: { postId, lang } },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Translation not found' }, { status: 404 })
    }

    await prisma.postTranslation.delete({
      where: { postId_lang: { postId, lang } },
    })

    return NextResponse.json({ message: 'Translation deleted' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
