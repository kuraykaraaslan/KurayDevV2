import { z } from 'zod'

export const SessionIdParamSchema = z.object({
  sessionId: z
    .string({ required_error: 'Session ID is required' })
    .cuid('Invalid session ID format'),
})

export const TerminateAllQuerySchema = z.object({
  all: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => v === 'true'),
})

export const SessionResponseSchema = z.object({
  userSessionId: z.string(),
  userId: z.string(),
  isCurrent: z.boolean(),
  os: z.string().nullable(),
  browser: z.string().nullable(),
  device: z.string().nullable(),
  ip: z.string().nullable(),
  city: z.string().nullable(),
  state: z.string().nullable(),
  country: z.string().nullable(),
  createdAt: z.coerce.date(),
  sessionExpiry: z.coerce.date(),
})

export type SessionIdParam = z.infer<typeof SessionIdParamSchema>
export type TerminateAllQuery = z.infer<typeof TerminateAllQuerySchema>
export type SessionResponse = z.infer<typeof SessionResponseSchema>
