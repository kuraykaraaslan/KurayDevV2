import Logger from '@/libs/logger'
import redis from '@/libs/redis'
import KnowledgeGraphService from '@/services/KnowledgeGraphService'
import { KnowledgeGraphNode } from '@/types/KnowledgeGraphTypes'
import { NextRequest } from 'next/server'

let cache: { data: any; expiresAt: number } | null = null

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const categorySlug = new URL(request.url).searchParams.get('categorySlug')
  const now = Date.now()

  // Cache check
  if (cache && now < cache.expiresAt) {
    return Response.json(cache.data)
  }

  const nodesRaw = await redis.get('kg:nodes')

  // Lazy rebuild if empty
  if (!nodesRaw) {
    Logger.info('[KG] Knowledge graph empty, triggering lazy rebuild...')
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
    } catch (err: any) {
      Logger.error('[KG] Failed to trigger lazy rebuild: ' + err.message)
      return Response.json({ ok: false, error: 'Failed to trigger rebuild.' }, { status: 500 })
    }
  }

  // Parse and build nodes
  const nodesMap = JSON.parse(nodesRaw || '{}')
  const allNodes = Object.values(nodesMap) as KnowledgeGraphNode[]

  const nodes = allNodes
    .filter((n) => !categorySlug || n.categorySlug === categorySlug)
    .map((n) => ({
      id: n.id,
      title: n.title,
      slug: n.slug,
      categorySlug: n.categorySlug,
      image: n.image,
      size: Math.max(4, Math.min(18, Math.floor(Math.log10((n.views || 0) + 10) * 6))),
    }))


  Logger.info(`[KG] Serving ${nodes.length} nodes${categorySlug ? ` for category ${categorySlug}` : ''}`)

  // Build links (filter both source and target)
  const links: any[] = []

  for (const n of allNodes) {
    if (categorySlug && n.categorySlug !== categorySlug) continue

    const arr = JSON.parse((await redis.get(`kg:links:${n.id}`)) || '[]')

    for (const l of arr) {
      // Ensure target node exists and matches category
      const targetNode = nodesMap[l.id || l.target]
      if (targetNode && (!categorySlug || targetNode.categorySlug === categorySlug)) {
        links.push({
          source: n.id,
          target: targetNode.id,
          value: l.s ?? 1,
        })
      }
    }
  }

  const data = { nodes, links }

  cache = { data, expiresAt: now + 5000 }
  return Response.json(data)
}
