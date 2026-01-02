import redis from '@/libs/redis'
import LocalEmbedService from './PostService/LocalEmbedService'
import { cosine } from '@/helpers/Cosine'
import PostService from '@/services/PostService'
import { KnowledgeGraphNode } from '@/types/content/BlogTypes'
import Logger from '@/libs/logger'
import { Queue, Worker } from 'bullmq'

const KEY_NODES = 'kg:nodes'
const LINKS = (id: string) => `kg:links:${id}`
const TOP_K = 5
const THRESH = 0.22

async function loadNodes(): Promise<Record<string, KnowledgeGraphNode>> {
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
  /** Queue + Worker */
  static readonly QUEUE_NAME = 'knowledgeGraphQueue'
  static readonly QUEUE = new Queue(KnowledgeGraphService.QUEUE_NAME, {
    connection: redis,
  })

  static readonly WORKER = new Worker(
    KnowledgeGraphService.QUEUE_NAME,
    async job => {
      const { type, postId } = job.data
      Logger.info(`[KG-Worker] Processing job ${job.id}: ${type} ${postId || ''}`)
      if (type === 'fullRebuild') await KnowledgeGraphService._fullRebuildInternal()
      if (type === 'updatePost' && postId) await KnowledgeGraphService._updatePostInternal(postId)
    },
    { connection: redis }
  )

  static {
    KnowledgeGraphService.WORKER.on('completed', job => {
      Logger.info(`[KG-Worker] Job ${job.id} completed`)
    })
    KnowledgeGraphService.WORKER.on('failed', (job, err) => {
      Logger.error(`[KG-Worker] Job ${job?.id} failed: ${err.message}`)
    })
  }

  // --------------------- Public async triggers ---------------------

  static async queueFullRebuild() {
    await KnowledgeGraphService.QUEUE.add('fullRebuild', { type: 'fullRebuild' })
    Logger.info('[KG] Full rebuild queued.')
  }

  static async queueUpdatePost(postId: string) {
    await KnowledgeGraphService.QUEUE.add('updatePost', { type: 'updatePost', postId })
    Logger.info(`[KG] Post update queued for ${postId}.`)
  }

  // --------------------- Internal logic ---------------------

  /** Tek post rebuild */
  private static async _updatePostInternal(postId: string) {
    const post = await PostService.getAllPosts({ page: 1, pageSize: 1, postId }).then(r => r.posts[0])
    if (!post) return
    const nodes = await loadNodes()
    const embedding = await embedPost(post)

    nodes[postId] = {
      id: post.postId,
      title: post.title,
      slug: post.slug,
      image: post.image || undefined,
      categorySlug: post.category?.slug || 'general',
      views: post.views || 0,
      embedding,
    }

    await saveNodes(nodes)

    const sims: { id: string; s: number }[] = []
    for (const [id, n] of Object.entries(nodes)) {
      if (id === postId) continue
      const s = cosine(embedding, n.embedding)
      sims.push({ id, s })
    }

    sims.sort((a, b) => b.s - a.s)
    const top = sims.slice(0, TOP_K).filter(x => x.s >= THRESH)
    await redis.set(LINKS(postId), JSON.stringify(top))

    for (const t of top) {
      const revKey = LINKS(t.id)
      const arr = JSON.parse((await redis.get(revKey)) || '[]')
      const idx = arr.findIndex((r: any) => r.id === postId)
      if (idx >= 0) arr[idx].s = t.s
      else arr.push({ id: postId, s: t.s })
      await redis.set(revKey, JSON.stringify(arr))
    }

    Logger.info(`[KG] Post ${postId} updated.`)
  }

  /** Tam rebuild */
  private static async _fullRebuildInternal() {
    try {
      Logger.info('[KG] Starting full rebuild...')
      await redis.hset('kg:meta', {
        status: 'running',
        startedAt: new Date().toISOString(),
      })

      const { posts } = await PostService.getAllPosts({ page: 1, pageSize: 5000 })
      if (!posts?.length) {
        Logger.warn('[KG] No posts found for rebuild, aborting.')
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
          image: p.image || undefined,
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
    } catch (err: any) {
      Logger.error('[KG] Full rebuild failed: ' + err.message)
      await redis.hset('kg:meta', {
        status: 'failed',
        error: String(err),
      })
    }
  }
}
