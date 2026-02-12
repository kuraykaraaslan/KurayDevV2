import { NextResponse } from 'next/server'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import { RebuildKnowledgeGraphRequestSchema } from '@/dtos/KnowledgeGraphDTO'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const parsedData = RebuildKnowledgeGraphRequestSchema.safeParse(body)

    if (!parsedData.success) {
      return NextResponse.json(
        {
          ok: false,
          message: parsedData.error.errors.map((err) => err.message).join(', '),
        },
        { status: 400 }
      )
    }

    await KnowledgeGraphService.queueFullRebuild()
    return NextResponse.json({ ok: true, message: 'Knowledge graph rebuild completed.' })
  } catch (err: any) {
    console.error('[KG] rebuild failed:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
