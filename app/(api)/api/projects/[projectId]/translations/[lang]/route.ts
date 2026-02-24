import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import UserSessionService from '@/services/AuthService/UserSessionService'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string; lang: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { projectId, lang } = await params

    const existing = await prisma.projectTranslation.findUnique({
      where: { projectId_lang: { projectId, lang } },
    })

    if (!existing) {
      return NextResponse.json({ message: 'Translation not found' }, { status: 404 })
    }

    await prisma.projectTranslation.delete({
      where: { projectId_lang: { projectId, lang } },
    })

    return NextResponse.json({ message: 'Translation deleted' })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
