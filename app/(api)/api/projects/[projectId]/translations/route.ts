import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { z } from 'zod'
import { AppLanguageEnum } from '@/types/common/I18nTypes'

const UpsertTranslationSchema = z.object({
  lang: AppLanguageEnum,
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable().optional(),
  slug: z.string().min(1, 'Slug is required'),
  content: z.string().nullable().optional(),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params
    const translations = await prisma.projectTranslation.findMany({ where: { projectId } })
    return NextResponse.json({ translations })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { projectId } = await params
    const body = await request.json()

    const parsed = UpsertTranslationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const { lang, title, description, slug, content } = parsed.data

    const project = await prisma.project.findUnique({ where: { projectId } })
    if (!project) {
      return NextResponse.json({ message: 'Project not found' }, { status: 404 })
    }

    const translation = await prisma.projectTranslation.upsert({
      where: { projectId_lang: { projectId, lang } },
      create: { projectId, lang, title, description: description ?? null, slug, content: content ?? null },
      update: { title, description: description ?? null, slug, content: content ?? null },
    })

    return NextResponse.json({ translation })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
