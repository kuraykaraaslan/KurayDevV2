import { z } from 'zod'

export const SeriesIdParamSchema = z.object({
    seriesId: z.string().cuid('Invalid series ID'),
})

export const CreateSeriesRequestSchema = z.object({
    title: z.string().min(1, 'Title is required'),
    slug: z.string().min(1, 'Slug is required'),
    description: z.string().nullable().optional(),
    image: z.string().nullable().optional(),
})

export const UpdateSeriesRequestSchema = CreateSeriesRequestSchema.partial().extend({
    title: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
})

export const AddSeriesEntrySchema = z.object({
    postId: z.string().min(1, 'Post ID is required'),
    order: z.number().int().min(0).optional(),
})

export const ReorderSeriesEntriesSchema = z.object({
    entries: z.array(
        z.object({
            postId: z.string(),
            order: z.number().int().min(0),
        })
    ),
})

export type SeriesIdParam          = z.infer<typeof SeriesIdParamSchema>
export type CreateSeriesRequest    = z.infer<typeof CreateSeriesRequestSchema>
export type UpdateSeriesRequest    = z.infer<typeof UpdateSeriesRequestSchema>
export type AddSeriesEntry         = z.infer<typeof AddSeriesEntrySchema>
export type ReorderSeriesEntries   = z.infer<typeof ReorderSeriesEntriesSchema>
