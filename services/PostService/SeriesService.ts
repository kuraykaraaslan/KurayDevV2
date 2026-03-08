import { prisma } from '@/libs/prisma'
import type { CreateSeriesRequest, UpdateSeriesRequest } from '@/dtos/SeriesDTO'

const entryWithPostSelect = {
    id: true,
    order: true,
    postId: true,
    seriesId: true,
    post: {
        select: {
            postId: true,
            title: true,
            slug: true,
            status: true,
            image: true,
            category: { select: { slug: true } },
        },
    },
}

const seriesSelect = {
    id: true,
    title: true,
    slug: true,
    description: true,
    image: true,
    createdAt: true,
    updatedAt: true,
    entries: {
        select: entryWithPostSelect,
        orderBy: { order: 'asc' as const },
    },
}

export default class SeriesService {
    // ── List ──────────────────────────────────────────────
    static async getAll(page = 0, pageSize = 20, search?: string, sortKey?: string, sortDir?: 'asc' | 'desc') {
        const where = search
            ? { title: { contains: search, mode: 'insensitive' as const } }
            : {}

        const ALLOWED_SORT_KEYS: Record<string, string> = { title: 'title', slug: 'slug', createdAt: 'createdAt', updatedAt: 'updatedAt' }
        const resolvedSortKey = (sortKey && ALLOWED_SORT_KEYS[sortKey]) ?? 'createdAt'
        const resolvedSortDir: 'asc' | 'desc' = sortDir === 'asc' ? 'asc' : 'desc'

        const [series, total] = await prisma.$transaction([
            prisma.postSeries.findMany({
                where,
                skip: page * pageSize,
                take: pageSize,
                orderBy: { [resolvedSortKey]: resolvedSortDir },
                select: {
                    ...seriesSelect,
                    _count: { select: { entries: true } },
                },
            }),
            prisma.postSeries.count({ where }),
        ])

        return { series, total }
    }

    // ── Single ────────────────────────────────────────────
    static async getById(id: string) {
        return prisma.postSeries.findUnique({ where: { id }, select: seriesSelect })
    }

    static async getBySlug(slug: string) {
        return prisma.postSeries.findUnique({ where: { slug }, select: seriesSelect })
    }

    // ── Create ────────────────────────────────────────────
    static async create(data: CreateSeriesRequest) {
        const existing = await prisma.postSeries.findUnique({ where: { slug: data.slug } })
        if (existing) throw new Error('A series with this slug already exists.')
        return prisma.postSeries.create({ data, select: seriesSelect })
    }

    // ── Update ────────────────────────────────────────────
    static async update(id: string, data: UpdateSeriesRequest) {
        return prisma.postSeries.update({ where: { id }, data, select: seriesSelect })
    }

    // ── Delete ────────────────────────────────────────────
    static async delete(id: string) {
        await prisma.postSeries.delete({ where: { id } })
    }

    // ── Entries ───────────────────────────────────────────
    /** Add a post to a series (or update its position if already in another series). */
    static async addPost(seriesId: string, postId: string, order?: number) {
        // Determine order: append to end if not specified
        const resolvedOrder =
            order ??
            ((await prisma.postSeriesEntry.count({ where: { seriesId } })) )

        // upsert handles the case where the post is being moved between series
        return prisma.postSeriesEntry.upsert({
            where: { postId },
            create: { seriesId, postId, order: resolvedOrder },
            update: { seriesId, order: resolvedOrder },
            select: entryWithPostSelect,
        })
    }

    /** Remove a post from its current series. */
    static async removePost(postId: string) {
        await prisma.postSeriesEntry.delete({ where: { postId } })
    }

    /** Bulk-update the `order` field for all entries in a series. */
    static async reorderPosts(seriesId: string, entries: { postId: string; order: number }[]) {
        await prisma.$transaction(
            entries.map(({ postId, order }) =>
                prisma.postSeriesEntry.update({
                    where: { postId, seriesId },
                    data: { order },
                })
            )
        )
        return this.getById(seriesId)
    }
}
