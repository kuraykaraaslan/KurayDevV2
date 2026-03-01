import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import redisInstance from '@/libs/redis'

const CACHE_KEY = 'sitemap:blog'

/**
 * Finds all posts with `status = 'SCHEDULED'` and `publishedAt <= now`,
 * then flips them to `PUBLISHED`. Runs every hour.
 */
export async function publishScheduledPosts(): Promise<void> {
    const now = new Date()

    const due = await prisma.post.findMany({
        where: {
            status: 'SCHEDULED',
            publishedAt: { lte: now },
            deletedAt: null,
        },
        select: { postId: true, title: true },
    })

    if (due.length === 0) {
        Logger.info('publishScheduledPosts: no posts due')
        return
    }

    Logger.info(`publishScheduledPosts: publishing ${due.length} post(s)`)

    await prisma.post.updateMany({
        where: {
            postId: { in: due.map((p) => p.postId) },
        },
        data: { status: 'PUBLISHED' },
    })

    // Bust sitemap cache so the newly-published posts appear immediately
    await redisInstance.del(CACHE_KEY)

    for (const p of due) {
        Logger.info(`  ✔ Published: "${p.title}" (${p.postId})`)
    }
}
