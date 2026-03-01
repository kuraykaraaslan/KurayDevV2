import { prisma } from '@/libs/prisma'

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
     * Resolves a short code to the original URL and increments the click counter.
     */
    static async resolve(code: string): Promise<string | null> {
        const link = await prisma.shortLink.findUnique({ where: { code } })
        if (!link) return null

        await prisma.shortLink.update({
            where: { code },
            data: { clicks: { increment: 1 } },
        })

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
}
