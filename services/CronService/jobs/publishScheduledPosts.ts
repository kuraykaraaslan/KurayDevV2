import { prisma } from '@/libs/prisma'
import Logger from '@/libs/logger'
import redisInstance from '@/libs/redis'
import ActivityPubService from '@/services/ActivityPubService'

const CACHE_KEY = 'sitemap:blog'
const PUBLISH_LOCK_KEY = 'cron:publishScheduledPosts:lock'
const PUBLISH_LOCK_TTL_SECONDS = 55

/**
 * Finds all posts with `status = 'SCHEDULED'` and `publishedAt <= now`,
 * then flips them to `PUBLISHED` and notifies ActivityPub followers.
 * Runs every hour.
 */
export async function publishScheduledPosts(): Promise<void> {
    const lock = await redisInstance.set(PUBLISH_LOCK_KEY, '1', 'EX', PUBLISH_LOCK_TTL_SECONDS, 'NX')
    if (lock !== 'OK') {
        Logger.info('publishScheduledPosts: skipped (already running)')
        return
    }

    try {
    const now = new Date()

    const due = await prisma.post.findMany({
        where: {
            status: 'SCHEDULED',
            publishedAt: { lte: now },
            deletedAt: null,
        },
        select: {
            postId: true,
            title: true,
            content: true,
            description: true,
            slug: true,
            keywords: true,
            publishedAt: true,
            category: { select: { slug: true } },
        },
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
        // Notify Fediverse followers about the new post
        ActivityPubService.notifyFollowersOfPost(p).catch((err) => {
            Logger.error(`[ActivityPub] Failed to notify followers for scheduled post ${p.postId}: ${String(err)}`)
        })
    }
    } finally {
        try {
            await redisInstance.del(PUBLISH_LOCK_KEY)
        } catch {
        }
    }
}
