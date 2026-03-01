import { z } from 'zod'

export const ShortLinkCodeParamSchema = z.object({
  code: z
    .string({ required_error: 'Code is required' })
    .min(1, 'Code cannot be empty')
    .max(32, 'Code is too long')
    .regex(/^[a-zA-Z0-9]+$/, 'Code must be alphanumeric'),
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

export type CreateShortLinkRequest = z.infer<typeof CreateShortLinkRequestSchema>
export type ShortLinkResponse = z.infer<typeof ShortLinkResponseSchema>
