import { prisma } from '@/libs/prisma'
import UserAgentService from '@/services/UserAgentService'
import redis from '@/libs/redis'

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

/** Redis key where pending click events are buffered */
export const CLICK_BUFFER_KEY = 'click:buffer'

/** Max clicks per IP per code per minute before tracking is skipped */
const CLICK_RATE_LIMIT = 10
const CLICK_RATE_WINDOW = 60 // seconds

export default class ShortLinkService {
    static generateCode() {
        let code = ''
        for (let i = 0; i < CODE_LENGTH; i++) {
            code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
        }
        return code
    }

    /**
     * Creates or returns an existing short link for the given URL.
     */
    static async getOrCreate(originalUrl: string): Promise<string> {
        const existing = await prisma.shortLink.findFirst({
            where: { originalUrl, deletedAt: null },
        })
        if (existing) return existing.code

        let code = this.generateCode()
        let attempts = 0
        while (attempts < 10) {
            const conflict = await prisma.shortLink.findUnique({ where: { code } })
            if (!conflict) break
            code = this.generateCode()
            attempts++
        }

        const link = await prisma.shortLink.create({
            data: { code, originalUrl },
        })
        return link.code
    }

    /**
     * Resolves a short code to the original URL.
     * Pushes click metadata to the Redis buffer (flushed to DB by cron).
     * If `ip` is provided, applies per-IP rate limiting — excess clicks are
     * still redirected but NOT tracked, preventing bot inflation.
     */
    static async resolve(code: string, request?: NextRequest): Promise<string | null> {
        const link = await prisma.shortLink.findFirst({ where: { code, deletedAt: null } })
        if (!link) return null

        if (request) {
            try {
                // --- Rate limit check (per IP + code) ---
                const ip =
                    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
                    request.headers.get('x-real-ip')?.trim() ||
                    request.headers.get('cf-connecting-ip')?.trim()

                let rateLimited = false
                if (ip) {
                    const rlKey = `click:rl:${code}:${ip}`
                    const count = await redis.incr(rlKey)
                    if (count === 1) await redis.expire(rlKey, CLICK_RATE_WINDOW)
                    rateLimited = count > CLICK_RATE_LIMIT
                }

                if (!rateLimited) {
                    // --- Gather metadata ---
                    const ua = await UserAgentService.parseRequest(request).catch(() => null)
                    const referrer =
                        request.headers.get('referer') ??
                        request.headers.get('referrer') ??
                        undefined

                    const clickData = {
                        shortLinkId: link.id,
                        referrer: referrer ?? null,
                        ip: ua?.ip ?? null,
                        country: ua?.country ?? null,
                        city: ua?.city ?? null,
                        os: ua?.os ?? null,
                        browser: ua?.browser ?? null,
                        device: ua?.device ?? null,
                        clickedAt: new Date().toISOString(),
                    }

                    // --- Push to Redis buffer (flushed by cron every 5 min) ---
                    await redis.rpush(CLICK_BUFFER_KEY, JSON.stringify(clickData))
                }
            } catch {
                // tracking failure is non-fatal — redirect still works
            }
        }

        return link.originalUrl
    }

    /**
     * Returns all short links (for admin panel).
     */
    static async getAll(params?: { page?: number; pageSize?: number; search?: string; sortKey?: string; sortDir?: 'asc' | 'desc' }) {
        const page = params?.page ?? 0
        const pageSize = params?.pageSize ?? 50
        const ALLOWED_SORT_KEYS: Record<string, string> = { code: 'code', createdAt: 'createdAt' }
        const resolvedSortKey = (params?.sortKey && ALLOWED_SORT_KEYS[params.sortKey]) ?? 'createdAt'
        const resolvedSortDir: 'asc' | 'desc' = params?.sortDir === 'asc' ? 'asc' : 'desc'

        const where = params?.search
          ? { deletedAt: null, OR: [{ code: { contains: params.search } }, { originalUrl: { contains: params.search } }] }
          : { deletedAt: null }

        const [links, total] = await prisma.$transaction([
          prisma.shortLink.findMany({
            where,
            skip: page * pageSize,
            take: pageSize,
            orderBy: { [resolvedSortKey]: resolvedSortDir },
          }),
          prisma.shortLink.count({ where }),
        ])

        return { links, total }
    }

    /**
     * Returns a single short link by id.
     */
    static async getById(id: string) {
        return prisma.shortLink.findFirst({ where: { id, deletedAt: null } })
    }

    /**
     * Updates a short link.
     */
    static async update(id: string, data: { originalUrl?: string; code?: string }) {
        return prisma.shortLink.update({ where: { id }, data })
    }

    /**
     * Deletes a short link by id.
     */
    static async delete(id: string) {
        return prisma.shortLink.update({ where: { id }, data: { deletedAt: new Date() } })
    }

    /**
     * Returns aggregated analytics for a short link.
     */
    static async getAnalytics(id: string) {
        const link = await prisma.shortLink.findFirst({ where: { id, deletedAt: null } })
        if (!link) return null

        const events = await prisma.shortLinkClick.findMany({
            where: { shortLinkId: id },
            select: { clickedAt: true, referrer: true, country: true, city: true, os: true, browser: true, device: true },
            orderBy: { clickedAt: 'asc' },
        })

        const countBy = <T extends string | null | undefined>(arr: T[]) => {
            const map: Record<string, number> = {}
            for (const v of arr) {
                const key = v ?? 'Unknown'
                map[key] = (map[key] ?? 0) + 1
            }
            return Object.entries(map)
                .map(([label, count]) => ({ label, count }))
                .sort((a, b) => b.count - a.count)
        }

        // Clicks per day (YYYY-MM-DD)
        const clicksByDay: Record<string, number> = {}
        for (const e of events) {
            const day = e.clickedAt.toISOString().slice(0, 10)
            clicksByDay[day] = (clicksByDay[day] ?? 0) + 1
        }
        const clicksOverTime = Object.entries(clicksByDay)
            .map(([date, count]) => ({ date, count }))
            .sort((a, b) => a.date.localeCompare(b.date))

        return {
            link,
            totalClicks: events.length,
            clicksOverTime,
            byReferrer: countBy(events.map((e) => e.referrer)),
            byCountry:  countBy(events.map((e) => e.country)),
            byBrowser:  countBy(events.map((e) => e.browser)),
            byOS:       countBy(events.map((e) => e.os)),
            byDevice:   countBy(events.map((e) => e.device)),
        }
    }
}

