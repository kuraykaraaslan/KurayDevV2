import { z } from 'zod'

export const ShortLinkCodeParamSchema = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .min(1, 'Code cannot be empty')
    .max(32, 'Code is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Code must be alphanumeric'),
})

export const ShortLinkIdParamSchema = z.object({
  id: z.string({ required_error: 'ID is required' }).cuid('Invalid ID format'),
})

export const CreateShortLinkRequestSchema = z.object({
  url: z
    .string({ required_error: 'URL is required' })
    .url('Must be a valid URL'),
})

export const UpdateShortLinkRequestSchema = z.object({
  originalUrl: z
    .string()
    .url('Must be a valid URL')
    .optional(),
  code: z
    .string()
    .min(1, 'Code cannot be empty')
    .max(32, 'Code is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Code must be alphanumeric')
    .optional(),
})

export const ShortLinkResponseSchema = z.object({
  id: z.string(),
  code: z.string(),
  originalUrl: z.string(),
  clicks: z.number(),
  createdAt: z.date(),
})

const AnalyticsEntrySchema = z.object({
  label: z.string(),
  count: z.number(),
})

const ClickOverTimeSchema = z.object({
  date: z.string(),
  count: z.number(),
})

export const ShortLinkAnalyticsResponseSchema = z.object({
  link: ShortLinkResponseSchema,
  totalClicks: z.number(),
  clicksOverTime: z.array(ClickOverTimeSchema),
  byReferrer: z.array(AnalyticsEntrySchema),
  byCountry: z.array(AnalyticsEntrySchema),
  byBrowser: z.array(AnalyticsEntrySchema),
  byOS: z.array(AnalyticsEntrySchema),
  byDevice: z.array(AnalyticsEntrySchema),
})

export type CreateShortLinkRequest = z.infer<typeof CreateShortLinkRequestSchema>
export type ShortLinkResponse = z.infer<typeof ShortLinkResponseSchema>
export type ShortLinkAnalyticsResponse = z.infer<typeof ShortLinkAnalyticsResponseSchema>
export type AnalyticsEntry = z.infer<typeof AnalyticsEntrySchema>
export type ClickOverTime = z.infer<typeof ClickOverTimeSchema>
