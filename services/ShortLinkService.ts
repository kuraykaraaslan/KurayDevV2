import { prisma } from '@/libs/prisma'
import UserAgentService from '@/services/UserAgentService'
import { NextRequest } from 'next/server'

const CODE_CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const CODE_LENGTH = 6

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
            where: { originalUrl },
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
     * Resolves a short code to the original URL, increments the click counter,
     * and records click metadata for analytics.
     */
    static async resolve(code: string, request?: NextRequest): Promise<string | null> {
        const link = await prisma.shortLink.findUnique({ where: { code } })
        if (!link) return null

        const clickData: {
            shortLinkId: string
            referrer?: string
            ip?: string
            country?: string
            city?: string
            os?: string
            browser?: string
            device?: string
        } = { shortLinkId: link.id }

        if (request) {
            try {
                const ua = await UserAgentService.parseRequest(request)
                const referrer = request.headers.get('referer') ?? request.headers.get('referrer') ?? undefined
                clickData.referrer = referrer ?? undefined
                clickData.ip = ua.ip ?? undefined
                clickData.country = ua.country ?? undefined
                clickData.city = ua.city ?? undefined
                clickData.os = ua.os ?? undefined
                clickData.browser = ua.browser ?? undefined
                clickData.device = ua.device ?? undefined
            } catch {
                // geo lookup failure is non-fatal
            }
        }

        await prisma.$transaction([
            prisma.shortLink.update({
                where: { code },
                data: { clicks: { increment: 1 } },
            }),
            prisma.shortLinkClick.create({ data: clickData }),
        ])

        return link.originalUrl
    }

    /**
     * Returns all short links (for admin panel).
     */
    static async getAll() {
        return prisma.shortLink.findMany({
            orderBy: { createdAt: 'desc' },
        })
    }

    /**
     * Returns a single short link by id.
     */
    static async getById(id: string) {
        return prisma.shortLink.findUnique({ where: { id } })
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
        return prisma.shortLink.delete({ where: { id } })
    }

    /**
     * Returns aggregated analytics for a short link.
     */
    static async getAnalytics(id: string) {
        const link = await prisma.shortLink.findUnique({ where: { id } })
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

