import { NextResponse } from 'next/server'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'

export async function POST() {
  try {
    await KnowledgeGraphService.queueFullRebuild()
    return NextResponse.json({ ok: true, message: 'Knowledge graph rebuild completed.' })
  } catch (err: any) {
    console.error('[KG] rebuild failed:', err)
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
