import { NextResponse } from 'next/server'
import { prisma } from '@/libs/prisma'
import UserSessionService from '@/services/AuthService/UserSessionService'
import { z } from 'zod'
import { AppLanguageEnum } from '@/types/common/I18nTypes'

const UpsertTranslationSchema = z.object({
  lang: AppLanguageEnum,
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  description: z.string().nullable().optional(),
  slug: z.string().min(1, 'Slug is required'),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    const { postId } = await params
    const translations = await prisma.postTranslation.findMany({ where: { postId } })
    return NextResponse.json({ translations })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ postId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { postId } = await params
    const body = await request.json()

    const parsed = UpsertTranslationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const { lang, title, content, description, slug } = parsed.data

    const post = await prisma.post.findUnique({ where: { postId } })
    if (!post) {
      return NextResponse.json({ message: 'Post not found' }, { status: 404 })
    }

    const translation = await prisma.postTranslation.upsert({
      where: { postId_lang: { postId, lang } },
      create: { postId, lang, title, content, description: description ?? null, slug },
      update: { title, content, description: description ?? null, slug },
    })

    return NextResponse.json({ translation })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
