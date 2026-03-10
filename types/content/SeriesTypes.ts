import { z } from 'zod'

export const SeriesPostStubSchema = z.object({
    postId: z.string(),
    title: z.string(),
    slug: z.string(),
    status: z.string(),
    category: z.object({ slug: z.string() }),
})

export const SeriesEntrySchema = z.object({
    id: z.string(),
    order: z.number(),
    postId: z.string(),
    seriesId: z.string(),
    post: SeriesPostStubSchema,
})

export const PostSeriesSchema = z.object({
    id: z.string(),
    title: z.string(),
    slug: z.string(),
    description: z.string().nullable(),
    image: z.string().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable().optional(),
    entries: z.array(SeriesEntrySchema).default([]),
})

/** Embeds in PostWithData — only what the frontend needs */
export const PostSeriesRefSchema = z.object({
    order: z.number(),
    seriesId: z.string(),
    series: PostSeriesSchema,
})

export type SeriesPostStub = z.infer<typeof SeriesPostStubSchema>
export type SeriesEntry    = z.infer<typeof SeriesEntrySchema>
export type PostSeries     = z.infer<typeof PostSeriesSchema>
export type PostSeriesRef  = z.infer<typeof PostSeriesRefSchema>
