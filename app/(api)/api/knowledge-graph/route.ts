import redis from '@/libs/redis'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import { KnowledgeGraphNode } from '@/types/KnowledgeGraphTypes'

let cache: { data: any; expiresAt: number } | null = null

export const dynamic = 'force-dynamic'

export async function GET() {
  const now = Date.now()

  if (cache && now < cache.expiresAt) {
    return Response.json(cache.data)
  }

  const nodesRaw = await redis.get('kg:nodes')

  if (!nodesRaw) {
    console.warn('[KG] No graph found in Redis — triggering lazy rebuild...')
    try {
      KnowledgeGraphService.fullRebuild().catch(err => {
        console.error('[KG] Lazy rebuild failed:', err)
      })
      return Response.json({
        ok: false,
        rebuilding: true,
        message: 'Knowledge graph was empty. Rebuild has been triggered.',
        nodes: [],
        links: [],
      })
    } catch (err) {
      console.error('[KG] Lazy rebuild trigger error:', err)
      return Response.json(
        { ok: false, error: 'Failed to trigger rebuild.' },
        { status: 500 }
      )
    }
  }

  const nodesMap = JSON.parse(nodesRaw || '{}')
  const nodes = (Object.values(nodesMap) as KnowledgeGraphNode[]).map((n) => ({
    id: n.id,
    title: n.title,
    slug: n.slug,
    categorySlug: n.categorySlug,
    size: Math.max(4, Math.min(18, Math.floor(Math.log10((n.views || 0) + 10) * 6))),
  }))

  const links: any[] = []
  for (const n of Object.values(nodesMap) as any[]) {
    const arr = JSON.parse((await redis.get(`kg:links:${n.id}`)) || '[]')
    for (const l of arr) links.push({ source: n.id, target: l.id, value: l.s })
  }

  const data = { nodes, links }

  cache = { data, expiresAt: now + 5000 }
  return Response.json(data)
}
