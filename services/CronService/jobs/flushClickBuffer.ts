import { prisma } from '@/libs/prisma'
import redis from '@/libs/redis'
import Logger from '@/libs/logger'
import { CLICK_BUFFER_KEY } from '@/services/ShortLinkService'

/** How many buffered events to process per cron run */
const BATCH_SIZE = 1000
const FLUSH_LOCK_KEY = 'click:buffer:flush:lock'
const FLUSH_LOCK_TTL_SECONDS = 30

interface BufferedClick {
    shortLinkId: string
    referrer: string | null
    ip: string | null
    country: string | null
    city: string | null
    os: string | null
    browser: string | null
    device: string | null
    clickedAt: string
}

/**
 * Drains up to BATCH_SIZE entries from the Redis click buffer, writes them
 * to `ShortLinkClick`, and increments the `clicks` counter on each
 * `ShortLink` in a single bulk operation.
 */
export async function flushClickBuffer(): Promise<void> {
    const lock = await redis.set(FLUSH_LOCK_KEY, '1', 'EX', FLUSH_LOCK_TTL_SECONDS, 'NX')
    if (lock !== 'OK') {
        Logger.info('flushClickBuffer: skipped (already running)')
        return
    }

    try {
    // Atomically grab the first BATCH_SIZE items and remove them from the list
        const pipeline = redis.pipeline()
        pipeline.lrange(CLICK_BUFFER_KEY, 0, BATCH_SIZE - 1)
        pipeline.ltrim(CLICK_BUFFER_KEY, BATCH_SIZE, -1)
        const [[, raw]] = (await pipeline.exec()) as [[null, string[]], [null, number]]

        if (!raw || raw.length === 0) {
            Logger.info('flushClickBuffer: nothing to flush')
            return
        }

        Logger.info(`flushClickBuffer: flushing ${raw.length} events`)

        // Parse raw JSON strings
        const events: BufferedClick[] = raw.flatMap((item) => {
            try {
                return [JSON.parse(item) as BufferedClick]
            } catch {
                Logger.error(`flushClickBuffer: failed to parse item: ${item}`)
                return []
            }
        })

        if (events.length === 0) return

        // Bulk-insert click rows
        await prisma.shortLinkClick.createMany({
            data: events.map((e) => ({
                shortLinkId: e.shortLinkId,
                referrer: e.referrer,
                ip: e.ip,
                country: e.country,
                city: e.city,
                os: e.os,
                browser: e.browser,
                device: e.device,
                clickedAt: new Date(e.clickedAt),
            })),
            skipDuplicates: true,
        })

        // Aggregate click counts per shortLink and increment them
        const counts = events.reduce<Record<string, number>>((acc, e) => {
            acc[e.shortLinkId] = (acc[e.shortLinkId] ?? 0) + 1
            return acc
        }, {})

        await Promise.all(
            Object.entries(counts).map(([id, count]) =>
                prisma.shortLink.update({
                    where: { id },
                    data: { clicks: { increment: count } },
                })
            )
        )

        Logger.info(`flushClickBuffer: wrote ${events.length} clicks across ${Object.keys(counts).length} links`)
    } finally {
        try {
            await redis.del(FLUSH_LOCK_KEY)
        } catch {
        }
    }
}
