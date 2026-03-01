import { NextRequest, NextResponse } from 'next/server'
import ShortLinkService from '@/services/ShortLinkService'
import { ShortLinkCodeParamSchema } from '@/dtos/ShortLinkDTO'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const raw = await params

  const parsed = ShortLinkCodeParamSchema.safeParse(raw)
  if (!parsed.success) {
    return NextResponse.json(
      { message: parsed.error.errors.map((e) => e.message).join(', ') },
      { status: 400 }
    )
  }

  const originalUrl = await ShortLinkService.resolve(parsed.data.code, request)

  if (!originalUrl) {
    return NextResponse.json({ message: 'Short link not found' }, { status: 404 })
  }

  return NextResponse.redirect(originalUrl, 301)
}
