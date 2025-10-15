import redis from '@/libs/redis'
import LocalEmbedService from './PostService/LocalEmbedService'
import { cosine } from '@/helpers/Cosine'
import PostService from '@/services/PostService'
import { KnowledgeGraphNode } from '@/types/KnowledgeGraphTypes'
import Logger from '@/libs/logger'

const KEY_NODES = 'kg:nodes'
const LINKS = (id: string) => `kg:links:${id}`
const LOCK_KEY = 'kg:rebuild:lock'
const TOP_K = 5
const THRESH = 0.22
const LOCK_TTL_MS = 1000 * 60 * 10 // 10 dakika (süre aşımı)

async function loadNodes() : Promise<Record<string, KnowledgeGraphNode>> {
  return JSON.parse((await redis.get(KEY_NODES)) || '{}') as Record<string, KnowledgeGraphNode>
}

async function saveNodes(n: Record<string, KnowledgeGraphNode>) {
  await redis.set(KEY_NODES, JSON.stringify(n))
}

async function embedPost(p: any) {
  const text = `${p.title}\n${p.description || ''}\n${p.keywords?.join(', ') || ''}\n${String(
    p.content || ''
  ).slice(0, 1000)}`
  const [embedding] = await LocalEmbedService.embed([text])
  return embedding
}

export default class KnowledgeGraphService {
  /** 🔐 Redis tabanlı rebuild kilidi */
  private static async acquireLock(): Promise<boolean> {
    const result = await redis.set(LOCK_KEY, '1', 'PX', LOCK_TTL_MS, 'NX')
    return result === 'OK' // true → kilit alındı
  }

  private static async releaseLock() {
    await redis.del(LOCK_KEY)
  }

  static async isLocked(): Promise<boolean> {
    return !!(await redis.exists(LOCK_KEY))
  }

  /** Tek post güncelle */
  static async updatePost(postId: string) {
    const post = await PostService.getAllPosts({ page: 1, pageSize: 1, postId: postId }).then(r => r.posts[0])
    if (!post) return
    const nodes = await loadNodes()
    const embedding = await embedPost(post)

    nodes[postId] = {
      id: post.postId,
      title: post.title,
      slug: post.slug,
      categorySlug: post.category?.slug || 'general',
      views: post.views || 0,
      embedding: embedding,
    }

    await saveNodes(nodes)

    // bağlantılar
    const sims: { id: string; s: number }[] = []
    for (const [id, n] of Object.entries(nodes)) {
      if (id === postId) continue
      const s = cosine(embedding, n.embedding)
      sims.push({ id, s })
    }
    sims.sort((a, b) => b.s - a.s)
    const top = sims.slice(0, TOP_K).filter(x => x.s >= THRESH)
    await redis.set(LINKS(postId), JSON.stringify(top))

    // karşı taraflara da yansıt
    for (const t of top) {
      const revKey = LINKS(t.id)
      const arr = JSON.parse((await redis.get(revKey)) || '[]')
      const idx = arr.findIndex((r: any) => r.id === postId)
      if (idx >= 0) arr[idx].s = t.s
      else arr.push({ id: postId, s: t.s })
      await redis.set(revKey, JSON.stringify(arr))
    }
  }

  /** Tam rebuild (eşzamanlı korumalı) */
  static async fullRebuild() {
    const locked = await this.acquireLock()
    if (!locked) {
      Logger.info('[KG] Rebuild already in progress, skipping...')
      return
    }

    try {
      Logger.info('[KG] Starting full rebuild...')
      await redis.hset('kg:meta', {
        status: 'running',
        startedAt: new Date().toISOString(),
      })

      const { posts } = await PostService.getAllPosts({ page: 1, pageSize: 5000 })
      if (!posts?.length) {
        console.warn('[KG] no posts found')
        return
      }

      const texts = posts.map(
        p =>
          `${p.title}\n${p.description || ''}\n${p.keywords?.join(', ') || ''}\n${String(
            p.content || ''
          ).slice(0, 1000)}`
      )
      const embeddings = await LocalEmbedService.embed(texts)

      const nodes: Record<string, any> = {}
      posts.forEach((p, i) => {
        nodes[p.postId] = {
          id: p.postId,
          title: p.title,
          slug: p.slug,
          categorySlug: p.category?.slug || 'general',
          group: p.category?.slug || 'general',
          views: p.views || 0,
          embedding: embeddings[i],
        }
      })
      await saveNodes(nodes)

      const ids = Object.keys(nodes)
      for (const id of ids) {
        const sims = ids
          .filter(j => j !== id)
          .map(j => ({ j, s: cosine(nodes[id].embedding, nodes[j].embedding) }))
          .sort((a, b) => b.s - a.s)
        const top = sims.slice(0, TOP_K).filter(x => x.s >= THRESH)
        await redis.set(LINKS(id), JSON.stringify(top.map(t => ({ id: t.j, s: t.s }))))
      }

      await redis.hset('kg:meta', {
        status: 'completed',
        finishedAt: new Date().toISOString(),
        postCount: ids.length,
      })

      Logger.info('[KG] Full rebuild completed successfully.')
    } catch (err) {
      Logger.error('[KG] Full rebuild failed:', err)
      await redis.hset('kg:meta', {
        status: 'failed',
        error: String(err),
      })
    } finally {
      await this.releaseLock()
    }
  }
}
