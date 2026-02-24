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
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    const { categoryId } = await params
    const translations = await prisma.categoryTranslation.findMany({ where: { categoryId } })
    return NextResponse.json({ translations })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ categoryId: string }> }
) {
  try {
    await UserSessionService.authenticateUserByRequest({ request, requiredUserRole: 'ADMIN' })

    const { categoryId } = await params
    const body = await request.json()

    const parsed = UpsertTranslationSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors.map((e) => e.message).join(', ') },
        { status: 400 }
      )
    }

    const { lang, title, description, slug } = parsed.data

    const category = await prisma.category.findUnique({ where: { categoryId } })
    if (!category) {
      return NextResponse.json({ message: 'Category not found' }, { status: 404 })
    }

    const translation = await prisma.categoryTranslation.upsert({
      where: { categoryId_lang: { categoryId, lang } },
      create: { categoryId, lang, title, description: description ?? null, slug },
      update: { title, description: description ?? null, slug },
    })

    return NextResponse.json({ translation })
  } catch (error: any) {
    return NextResponse.json({ message: error.message }, { status: 500 })
  }
}
